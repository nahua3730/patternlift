import type { AppProblem } from "@/lib/product";
import type { ProblemCodeConfig } from "@/lib/problem-code-client";
import type { Priority, TaskBucket } from "@/lib/study-plan";

export type BlindTransferTaskPayload = {
  kind: "blind_transfer";
  id: string;
  type: "transfer";
  priority: Priority;
  bucket: TaskBucket;
  problemId: string;
  title: "Pattern Challenge";
  estimatedMinutes: number;
  status: "pending" | "done" | "skipped";
  predictionState: "awaiting_prediction" | "locked";
};

export type NormalStudyTaskPayload = {
  kind: "normal";
  id: string;
  type: "learn" | "practice" | "recall" | "review";
  priority: Priority;
  bucket: TaskBucket;
  patternId: string | null;
  problemId: string | null;
  title: string;
  estimatedMinutes: number;
  status: "pending" | "done" | "skipped";
  // Pilot Foundation: which curriculum day this task actually belongs to -
  // set (and different from today's own dayNumber) only for a Carryover
  // entry, so the UI can label its origin ("from Day 24").
  dayNumber?: number;
  learnResource?: { title: string; url: string; provider?: string };
  externalProblem?: { title: string; url: string; source: "leetcode" | "kamacoder" | "other" };
  // Pilot Foundation: prior attempt/roadmap-mark count for this task's
  // problem, when it has one - lets the UI show "Solved before (xN)"
  // without a second round trip. Reuses getRepCounts, already computed for
  // the today.problems summary - never a new signal.
  reps?: number;
};

export type TodayStudyTaskPayload = NormalStudyTaskPayload | BlindTransferTaskPayload;

export type BlindProblemPayload = Pick<AppProblem, "id" | "title" | "difficulty" | "prompt">;

export type TransferProblemRuntime = Pick<
  AppProblem,
  | "id"
  | "category"
  | "title"
  | "difficulty"
  | "prompt"
  | "targetPatternId"
  | "recommendedClues"
  | "recommendedFirstStep"
  | "reviewQuestion"
  | "contrastPatternId"
>;

export type TransferTaskStateResponse =
  | {
      state: "awaiting_prediction";
      task: BlindTransferTaskPayload;
      problem: BlindProblemPayload;
    }
  | {
      state: "prediction_locked";
      task: BlindTransferTaskPayload;
      prediction: { predictedPatternId: string | null };
      solve: {
        problem: TransferProblemRuntime;
        codeConfig: ProblemCodeConfig;
        hasNativeCodeConfig: boolean;
        patternLabel: string;
        coachStyle: "optional";
      };
    };

export function blindTransferTaskPayload(input: {
  id: string;
  priority: Priority;
  bucket: TaskBucket;
  problemId: string;
  estimatedMinutes: number;
  status: "pending" | "done" | "skipped";
  predictionLocked: boolean;
}): BlindTransferTaskPayload {
  return {
    kind: "blind_transfer",
    id: input.id,
    type: "transfer",
    priority: input.priority,
    bucket: input.bucket,
    problemId: input.problemId,
    title: "Pattern Challenge",
    estimatedMinutes: input.estimatedMinutes,
    status: input.status,
    predictionState: input.predictionLocked ? "locked" : "awaiting_prediction"
  };
}

// Development/test guard for the actual invariant: the payload may contain
// generic pattern options elsewhere, but it must not associate THIS Transfer
// problem with its hidden target/contrast answer before prediction.
export function assertBlindTransferPayload(
  value: unknown,
  secret: { problemId: string; targetPatternId: string; targetPatternLabel: string; contrastPatternId: string }
) {
  const serialized = JSON.stringify(value);
  const problemIndex = serialized.indexOf(secret.problemId);
  if (problemIndex === -1) return;

  for (const answer of [secret.targetPatternId, secret.targetPatternLabel, secret.contrastPatternId]) {
    if (answer && serialized.includes(answer)) {
      throw new Error(`Blind Transfer payload associates ${secret.problemId} with hidden answer metadata (${answer}).`);
    }
  }
}
