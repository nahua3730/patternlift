import { allProblems, patternOptions } from "@/lib/product";
import { getTechniqueById, techniqueLibrary, type TechniqueId } from "@/lib/techniques";
import { buildMasteryModel, type MasteryAttempt } from "@/lib/mastery";
import { buildCoachInstructions, buildCoachInput, type CoachRequest } from "@/lib/coach";

export const coachAgentTools = [
  {
    type: "function" as const,
    name: "get_technique_detail",
    description:
      "Read the full teaching notes for one PatternLift technique, including its core idea, aliases, and recognition signals.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        techniqueId: {
          type: "string",
          enum: techniqueLibrary.map((technique) => technique.id)
        }
      },
      required: ["techniqueId"]
    }
  },
  {
    type: "function" as const,
    name: "get_mastery_snapshot",
    description:
      "Read this learner's real mastery score, attempt count, and recurring confusion pairs for the problem's target and contrast patterns.",
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
    name: "list_similar_problems",
    description:
      "Find other PatternLift problems for a given pattern and difficulty, useful when suggesting what to try next.",
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
        excludeCurrent: { type: "boolean" }
      },
      required: ["patternId", "difficulty", "excludeCurrent"]
    }
  }
];

export function buildCoachAgentInstructions(coachStyle: CoachRequest["coachStyle"], latestMessage: string) {
  return [
    buildCoachInstructions(coachStyle, latestMessage),
    "You have tools to ground your answer in this specific learner's real data instead of guessing.",
    "Call get_mastery_snapshot before claiming anything about the learner's history, mastery level, or past confusion.",
    "Call get_technique_detail before explaining a technique's trap or core idea in more depth than the summary already given.",
    "Only call list_similar_problems if the learner is asking what to try next.",
    "Do not call a tool unless its result would change your reply. Never narrate that you are calling a tool."
  ].join(" ");
}

export function buildCoachAgentInput(body: CoachRequest) {
  return buildCoachInput(body);
}

export function executeCoachAgentTool(
  name: string,
  args: Record<string, unknown>,
  context: {
    problemId: string | null;
    patternId: string | null;
    contrastPatternId: string | null;
    attempts: MasteryAttempt[];
  }
) {
  if (name === "get_technique_detail") {
    const technique = getTechniqueById(String(args.techniqueId) as TechniqueId);
    if (!technique) return { error: "Unknown technique id." };
    return technique;
  }

  if (name === "get_mastery_snapshot") {
    if (context.attempts.length === 0) {
      return { available: false, reason: "No logged attempts yet for this learner." };
    }
    const { mastery, confusions } = buildMasteryModel(context.attempts);
    const relevantIds = [context.patternId, context.contrastPatternId].filter(
      (id): id is string => Boolean(id)
    );
    const relevant = relevantIds.length
      ? mastery.filter((entry) => relevantIds.includes(entry.id))
      : mastery.filter((entry) => entry.attempts > 0);
    return {
      available: true,
      patterns: relevant,
      confusions: confusions.slice(0, 4)
    };
  }

  if (name === "list_similar_problems") {
    const patternId = String(args.patternId || "");
    const difficulty = String(args.difficulty || "Any");
    const excludeCurrent = Boolean(args.excludeCurrent);
    return allProblems
      .filter((problem) => problem.targetPatternId === patternId)
      .filter((problem) => difficulty === "Any" || problem.difficulty === difficulty)
      .filter((problem) => !excludeCurrent || problem.id !== context.problemId)
      .slice(0, 8)
      .map((problem) => ({
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty
      }));
  }

  return { error: `Unknown tool ${name}` };
}
