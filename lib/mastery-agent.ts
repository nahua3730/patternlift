import { allProblems, patternOptions, type AppProblem } from "@/lib/product";
import { buildMasteryModel, type MasteryAttempt } from "@/lib/mastery";

export type MasteryAgentStudyMode = "learn" | "recognize" | "practice";
export type MasteryAgentCoachStyle = "beginner" | "guided" | "optional";

export type MasteryAgentAlternative = {
  problemId: string;
  problemTitle: string;
  reason: string;
};

export type MasteryAgentPlan = {
  problemId: string;
  problemTitle: string;
  patternId: string;
  patternLabel: string;
  difficulty: string;
  studyMode: MasteryAgentStudyMode;
  coachStyle: MasteryAgentCoachStyle;
  estimatedMinutes: number;
  rationale: string;
  focusSkill: string;
  evidenceSummary: string;
  confidence: number;
  alternatives: MasteryAgentAlternative[];
};

export type MasteryAgentRecommendation = {
  runId: string;
  source: "agent" | "fallback";
  plan: MasteryAgentPlan;
  toolTrace: string[];
};

export const masteryAgentPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "problemId",
    "problemTitle",
    "patternId",
    "patternLabel",
    "difficulty",
    "studyMode",
    "coachStyle",
    "estimatedMinutes",
    "rationale",
    "focusSkill",
    "evidenceSummary",
    "confidence",
    "alternatives"
  ],
  properties: {
    problemId: { type: "string" },
    problemTitle: { type: "string" },
    patternId: { type: "string" },
    patternLabel: { type: "string" },
    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
    studyMode: { type: "string", enum: ["learn", "recognize", "practice"] },
    coachStyle: { type: "string", enum: ["beginner", "guided", "optional"] },
    estimatedMinutes: { type: "integer", minimum: 8, maximum: 45 },
    rationale: { type: "string" },
    focusSkill: { type: "string" },
    evidenceSummary: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    alternatives: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["problemId", "problemTitle", "reason"],
        properties: {
          problemId: { type: "string" },
          problemTitle: { type: "string" },
          reason: { type: "string" }
        }
      }
    }
  }
} as const;

function findPattern(problem: AppProblem) {
  return patternOptions.find((pattern) => pattern.id === problem.targetPatternId)!;
}

function chooseProblem(
  patternId: string,
  difficulty: string,
  attemptedIds: Set<string>
) {
  const candidates = allProblems.filter((problem) => problem.targetPatternId === patternId);
  return (
    candidates.find(
      (problem) => problem.difficulty === difficulty && !attemptedIds.has(problem.id)
    ) ??
    candidates.find((problem) => !attemptedIds.has(problem.id)) ??
    candidates.find((problem) => problem.difficulty === difficulty) ??
    candidates[0] ??
    allProblems[0]
  );
}

export function buildFallbackMasteryPlan(attempts: MasteryAttempt[]): MasteryAgentPlan {
  const { mastery, confusions } = buildMasteryModel(attempts);
  const attemptedIds = new Set(attempts.map((attempt) => attempt.problemId));
  const practiced = mastery.filter((entry) => entry.attempts > 0);
  const target =
    [...practiced].sort(
      (left, right) => left.mastery - right.mastery || right.attempts - left.attempts
    )[0] ?? mastery.find((entry) => entry.id === "hashing") ?? mastery[0];
  const solidRate = attempts.length
    ? attempts.filter((attempt) => attempt.outcome === "solid").length / attempts.length
    : 0;
  const difficulty = attempts.length >= 3 && solidRate >= 0.65 ? "Medium" : "Easy";
  const problem = chooseProblem(target.id, difficulty, attemptedIds);
  const pattern = findPattern(problem);
  const recentConfusion = confusions.find((pair) => pair.actual === pattern.label);
  const studyMode: MasteryAgentStudyMode =
    attempts.length === 0 || target.mastery < 45
      ? "learn"
      : recentConfusion
        ? "recognize"
        : "practice";
  const coachStyle: MasteryAgentCoachStyle =
    attempts.length < 2 || target.mastery < 40
      ? "beginner"
      : target.mastery >= 75
        ? "optional"
        : "guided";
  const alternatives = allProblems
    .filter((candidate) => candidate.id !== problem.id && !attemptedIds.has(candidate.id))
    .filter((candidate) => ["Easy", "Medium", "Hard"].includes(candidate.difficulty))
    .sort((left, right) => {
      const leftMatch = left.targetPatternId === pattern.id ? 1 : 0;
      const rightMatch = right.targetPatternId === pattern.id ? 1 : 0;
      return rightMatch - leftMatch;
    })
    .slice(0, 2)
    .map((candidate) => ({
      problemId: candidate.id,
      problemTitle: candidate.title,
      reason:
        candidate.targetPatternId === pattern.id
          ? `Another ${pattern.label} transfer problem.`
          : "A nearby pattern to keep the session flexible."
    }));

  return {
    problemId: problem.id,
    problemTitle: problem.title,
    patternId: pattern.id,
    patternLabel: pattern.label,
    difficulty: problem.difficulty,
    studyMode,
    coachStyle,
    estimatedMinutes: studyMode === "learn" ? 20 : 15,
    rationale:
      attempts.length === 0
        ? "Start with a short, high-signal problem so PatternLift can establish your first real mastery baseline."
        : target.diagnosis,
    focusSkill:
      recentConfusion
        ? `Separate ${recentConfusion.predicted} from ${recentConfusion.actual} before coding.`
        : `Name the ${pattern.label} signal and invariant before implementation.`,
    evidenceSummary:
      attempts.length === 0
        ? "No completed attempts yet; this is a low-friction calibration session."
        : `${target.attempts} ${pattern.label} attempt${target.attempts === 1 ? "" : "s"}, current mastery signal ${target.mastery}%.`,
    confidence: attempts.length === 0 ? 0.62 : 0.78,
    alternatives
  };
}

export function validateMasteryAgentPlan(value: unknown): MasteryAgentPlan | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<MasteryAgentPlan>;
  const problem = allProblems.find((entry) => entry.id === candidate.problemId);
  if (!problem) return null;
  const pattern = findPattern(problem);
  const validMode = ["learn", "recognize", "practice"].includes(candidate.studyMode ?? "");
  const validCoach = ["beginner", "guided", "optional"].includes(candidate.coachStyle ?? "");
  if (!validMode || !validCoach) return null;

  const alternatives = Array.isArray(candidate.alternatives)
    ? candidate.alternatives
        .map((alternative) => {
          const matched = allProblems.find((entry) => entry.id === alternative?.problemId);
          if (!matched) return null;
          return {
            problemId: matched.id,
            problemTitle: matched.title,
            reason: String(alternative.reason || "A useful alternative for this session.")
          };
        })
        .filter((entry): entry is MasteryAgentAlternative => Boolean(entry))
        .slice(0, 2)
    : [];

  return {
    problemId: problem.id,
    problemTitle: problem.title,
    patternId: pattern.id,
    patternLabel: pattern.label,
    difficulty: problem.difficulty,
    studyMode: candidate.studyMode as MasteryAgentStudyMode,
    coachStyle: candidate.coachStyle as MasteryAgentCoachStyle,
    estimatedMinutes: Math.min(45, Math.max(8, Number(candidate.estimatedMinutes) || 15)),
    rationale: String(candidate.rationale || "This session matches your current mastery signal."),
    focusSkill: String(candidate.focusSkill || pattern.coachPrompt),
    evidenceSummary: String(candidate.evidenceSummary || "Recommendation based on recent practice evidence."),
    confidence: Math.min(1, Math.max(0, Number(candidate.confidence) || 0.65)),
    alternatives
  };
}
