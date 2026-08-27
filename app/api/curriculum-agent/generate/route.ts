import OpenAI from "openai";
import type { ResponseFunctionToolCall } from "openai/resources/responses/responses";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createId, dbExecute } from "@/lib/db";
import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions,
  type RoadmapTrack
} from "@/lib/product";
import {
  buildCurriculumPlanSchema,
  buildFallbackWeeklyPlan,
  coachStyleForExperience,
  ensureFullPatternCoverage,
  expandWeeklyPlanToDays,
  formatInterviewDate,
  resolveDeadlineWeeks,
  validateCurriculumWeeklyPlan,
  weeksFromDeadline,
  type CurriculumPlan,
  type ExperienceLevel,
  type OnboardingAnswers
} from "@/lib/curriculum-agent";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const model = process.env.OPENAI_CURRICULUM_MODEL?.trim() || "gpt-4.1-mini";
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DEFAULT_TRACK: RoadmapTrack = "neetcode150";

const tools = [
  {
    type: "function" as const,
    name: "get_roadmap_overview",
    description: "Read how many NeetCode 150 problems exist per pattern, so pacing across weeks is realistic.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {},
      required: []
    }
  }
];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    experienceLevel?: ExperienceLevel;
    deadlineWeeks?: number | null;
    interviewDate?: string | null;
    dailyMinutes?: number;
  };

  const answers: OnboardingAnswers = {
    experienceLevel:
      body.experienceLevel === "new" || body.experienceLevel === "comfortable" ? body.experienceLevel : "rusty",
    deadlineWeeks:
      typeof body.deadlineWeeks === "number" && body.deadlineWeeks > 0 ? body.deadlineWeeks : null,
    interviewDate:
      typeof body.interviewDate === "string" && ISO_DATE_PATTERN.test(body.interviewDate)
        ? body.interviewDate
        : null,
    dailyMinutes: typeof body.dailyMinutes === "number" && body.dailyMinutes > 0 ? body.dailyMinutes : 45
  };

  const totalWeeks = weeksFromDeadline(resolveDeadlineWeeks(answers));
  const fallbackWeekly = buildFallbackWeeklyPlan(answers);
  const runId = createId("study-plan");
  const toolTrace: string[] = [];
  let weeklyPlan = fallbackWeekly;
  let source: "agent" | "fallback" = "fallback";

  if (client) {
    try {
      const generated = await runCurriculumAgent(answers, totalWeeks, toolTrace);
      const validated = validateCurriculumWeeklyPlan(generated, totalWeeks, answers.dailyMinutes);
      if (validated) {
        weeklyPlan = validated;
        source = "agent";
      }
    } catch (error) {
      toolTrace.push(
        `fallback:${error instanceof Error ? error.message.slice(0, 160) : "agent_error"}`
      );
    }
  } else {
    toolTrace.push("fallback:missing_openai_api_key");
  }

  const coveredWeekly = ensureFullPatternCoverage(weeklyPlan);
  const plan: CurriculumPlan = expandWeeklyPlanToDays(
    coveredWeekly,
    DEFAULT_TRACK,
    coachStyleForExperience(answers.experienceLevel)
  );

  await dbExecute(
    `
      INSERT INTO study_plan_runs
        (id, user_id, status, model, source, input_json, output_json, tool_trace_json)
      VALUES (?, ?, 'proposed', ?, ?, ?, ?, ?)
    `,
    [runId, user.id, model, source, JSON.stringify(answers), JSON.stringify(plan), JSON.stringify(toolTrace)]
  );

  return NextResponse.json({ runId, source, plan, toolTrace });
}

async function runCurriculumAgent(answers: OnboardingAnswers, totalWeeks: number, toolTrace: string[]) {
  if (!client) throw new Error("OpenAI client unavailable");

  const schema = buildCurriculumPlanSchema(totalWeeks, answers.dailyMinutes);

  let response = await client.responses.create({
    model,
    instructions: [
      "You are the PatternLift Curriculum Planner. Build a multi-week study plan structure (weeks and pattern focus only, not individual problems).",
      `FIXED CONSTRAINTS, not your decision: totalWeeks MUST be exactly ${totalWeeks} and dailyMinutes MUST be exactly ${answers.dailyMinutes} — these are already determined by the learner's own answers. Your only job is deciding which patterns each of the ${totalWeeks} weeks focuses on and the pacing (dominantStudyMode, includesReviewDay) within that fixed structure.`,
      "Call get_roadmap_overview before deciding pattern order, so pacing reflects real problem availability.",
      `Learner: experience level "${answers.experienceLevel}", ${answers.interviewDate ? `interview on ${formatInterviewDate(answers.interviewDate)}` : answers.deadlineWeeks ? `interview in about ${answers.deadlineWeeks} weeks` : "no fixed deadline"}. You may reference that date naturally in the rationale.`,
      `Coverage requirement: across all ${totalWeeks} weeks combined, every one of these ${patternOptions.length} patterns must appear in at least one week's focusPatternIds — ${patternOptions.map((pattern) => pattern.id).join(", ")}. Spread them out; use 2-3 focusPatternIds per week if that many weeks aren't available to cover them one at a time.`,
      "New learners should start every week with learn mode. Rusty learners should front-load recognize mode. Comfortable learners should lean on practice and review sooner.",
      "Order patterns easier-to-harder: hashing and two-pointers before dynamic-programming and greedy.",
      "Keep the rationale concrete and under 40 words. Never claim evidence the tool did not return."
    ].join(" "),
    input: "Build my curriculum's weekly structure from the onboarding answers you were given.",
    tools,
    tool_choice: "required",
    text: {
      verbosity: "medium",
      format: {
        type: "json_schema",
        name: "curriculum_weekly_plan",
        description: "A validated weekly structure for the learner's study plan.",
        strict: true,
        schema
      }
    },
    max_output_tokens: 900
  });

  for (let round = 0; round < 4; round += 1) {
    const calls = response.output.filter(
      (item): item is ResponseFunctionToolCall => item.type === "function_call"
    );
    if (calls.length === 0) {
      if (!response.output_text) throw new Error("Agent returned no plan");
      return JSON.parse(response.output_text) as unknown;
    }

    const outputs = calls.map((call) => {
      toolTrace.push(call.name);
      return {
        type: "function_call_output" as const,
        call_id: call.call_id,
        output: JSON.stringify(executeTool())
      };
    });

    response = await client.responses.create({
      model,
      previous_response_id: response.id,
      input: outputs,
      tools,
      tool_choice: "auto",
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: "curriculum_weekly_plan",
          strict: true,
          schema
        }
      },
      max_output_tokens: 900
    });
  }

  throw new Error("Agent exceeded its tool-call limit");
}

function executeTool() {
  const counts = patternOptions.map((pattern) => ({
    patternId: pattern.id,
    patternLabel: pattern.label,
    problemCount: allProblems.filter(
      (problem) =>
        problem.targetPatternId === pattern.id &&
        getOfficialProblemRoadmapMeta(problem.id)?.tracks.includes(DEFAULT_TRACK)
    ).length
  }));
  return { track: DEFAULT_TRACK, patterns: counts };
}
