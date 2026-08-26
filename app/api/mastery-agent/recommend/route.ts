import OpenAI from "openai";
import type { ResponseFunctionToolCall } from "openai/resources/responses/responses";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createId, dbAll, dbExecute } from "@/lib/db";
import { buildMasteryModel, type MasteryAttempt } from "@/lib/mastery";
import {
  buildFallbackMasteryPlan,
  masteryAgentPlanSchema,
  validateMasteryAgentPlan,
  type MasteryAgentPlan
} from "@/lib/mastery-agent";
import { allProblems, patternOptions } from "@/lib/product";

const model = process.env.OPENAI_MASTERY_MODEL?.trim() || "gpt-4.1-mini";
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const tools = [
  {
    type: "function" as const,
    name: "get_mastery_profile",
    description: "Read the learner's pattern-level mastery, diagnoses, and confusion pairs.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {},
      required: []
    }
  },
  {
    type: "function" as const,
    name: "get_recent_attempts",
    description: "Read recent problem attempts, outcomes, hints, confidence, and code results.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 12 }
      },
      required: ["limit"]
    }
  },
  {
    type: "function" as const,
    name: "search_problem_bank",
    description: "Find valid PatternLift problems for a pattern and difficulty. Use returned IDs exactly.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        patternId: {
          type: "string",
          enum: patternOptions.map((pattern) => pattern.id)
        },
        difficulty: { type: "string", enum: ["Easy", "Medium", "Hard", "Any"] },
        excludeAttempted: { type: "boolean" }
      },
      required: ["patternId", "difficulty", "excludeAttempted"]
    }
  }
];

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempts = await loadAttempts(user.id);
  const fallback = buildFallbackMasteryPlan(attempts);
  const runId = createId("mastery-run");
  const toolTrace: string[] = [];
  let plan: MasteryAgentPlan = fallback;
  let source: "agent" | "fallback" = "fallback";

  if (client) {
    try {
      const generated = await runMasteryAgent(attempts, toolTrace);
      const validated = validateMasteryAgentPlan(generated);
      if (validated) {
        plan = validated;
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

  await dbExecute(
    `
      INSERT INTO mastery_agent_runs
        (id, user_id, status, model, source, output_json, tool_trace_json)
      VALUES (?, ?, 'proposed', ?, ?, ?, ?)
    `,
    [runId, user.id, model, source, JSON.stringify(plan), JSON.stringify(toolTrace)]
  );

  return NextResponse.json({ runId, source, plan, toolTrace });
}

async function runMasteryAgent(attempts: MasteryAttempt[], toolTrace: string[]) {
  if (!client) throw new Error("OpenAI client unavailable");

  const attemptedIds = new Set(attempts.map((attempt) => attempt.problemId));
  const masteryModel = buildMasteryModel(attempts);
  let response = await client.responses.create({
    model,
    instructions: [
      "You are the PatternLift Mastery Agent. Build exactly one short coding-practice session.",
      "You decide the problem, training mode, and support level from learner evidence.",
      "Call the learner-data tools before deciding. Use search_problem_bank before naming a problem.",
      "Prefer an unattempted problem that targets the weakest useful signal or a recurring confusion.",
      "For a new learner, choose a low-friction Easy calibration problem and Step-by-step support.",
      "Confidence means confidence that this is a useful next session, not the learner's mastery. Keep it between 0.55 and 0.9.",
      "Keep the rationale concrete and under 38 words. Never claim evidence that tools did not return.",
      "The learner can edit the plan, so make one confident recommendation rather than listing choices."
    ].join(" "),
    input: "Inspect my learning evidence and generate my next best PatternLift session.",
    tools,
    tool_choice: "required",
    text: {
      verbosity: "medium",
      format: {
        type: "json_schema",
        name: "mastery_session_plan",
        description: "A validated recommendation for the learner's next PatternLift session.",
        strict: true,
        schema: masteryAgentPlanSchema
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
        output: JSON.stringify(
          executeTool(call, attempts, attemptedIds, masteryModel)
        )
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
          name: "mastery_session_plan",
          strict: true,
          schema: masteryAgentPlanSchema
        }
      },
      max_output_tokens: 900
    });
  }

  throw new Error("Agent exceeded its tool-call limit");
}

function executeTool(
  call: ResponseFunctionToolCall,
  attempts: MasteryAttempt[],
  attemptedIds: Set<string>,
  masteryModel: ReturnType<typeof buildMasteryModel>
) {
  const args = safeArguments(call.arguments);
  if (call.name === "get_mastery_profile") {
    return {
      patterns: masteryModel.mastery
        .filter((entry) => entry.attempts > 0 || entry.id === "hashing")
        .sort((left, right) => left.mastery - right.mastery)
        .slice(0, 6),
      confusions: masteryModel.confusions.slice(0, 4)
    };
  }
  if (call.name === "get_recent_attempts") {
    const limit = Math.min(12, Math.max(1, Number(args.limit) || 8));
    return attempts.slice(0, limit);
  }
  if (call.name === "search_problem_bank") {
    const patternId = String(args.patternId || "hashing");
    const difficulty = String(args.difficulty || "Any");
    const excludeAttempted = Boolean(args.excludeAttempted);
    return allProblems
      .filter((problem) => problem.targetPatternId === patternId)
      .filter((problem) => difficulty === "Any" || problem.difficulty === difficulty)
      .filter((problem) => !excludeAttempted || !attemptedIds.has(problem.id))
      .slice(0, 12)
      .map((problem) => ({
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        patternId: problem.targetPatternId,
        prompt: problem.prompt.slice(0, 220)
      }));
  }
  return { error: `Unknown tool ${call.name}` };
}

function safeArguments(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function loadAttempts(userId: string): Promise<MasteryAttempt[]> {
  const rows = await dbAll<{
    problem_id: string;
    problem_title: string;
    selected_pattern_label: string;
    correct_pattern_label: string;
    outcome: "solid" | "partial" | "confused";
    score: number;
    hints_used: number;
    code_passed: number | null;
    confidence: number;
    confused_with: string | null;
    created_at: string;
  }>(
    `
      SELECT problem_id, problem_title, selected_pattern_label, correct_pattern_label,
        outcome, score, hints_used, code_passed, confidence, confused_with, created_at
      FROM attempts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 24
    `,
    [userId]
  );

  return rows.map((row) => ({
    problemId: row.problem_id,
    problemTitle: row.problem_title,
    selectedPatternLabel: row.selected_pattern_label,
    actualPatternLabel: row.correct_pattern_label,
    outcome: row.outcome,
    score: row.score,
    hintsUsed: row.hints_used,
    codePassed: row.code_passed == null ? null : row.code_passed === 1,
    confidence: row.confidence,
    confusedWith: row.confused_with,
    createdAt: row.created_at
  }));
}
