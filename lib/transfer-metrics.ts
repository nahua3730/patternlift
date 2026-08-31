// Phase 2A.1 follow-up: Transfer Solve Success answers "on a scored blind
// Transfer encounter, did the learner independently solve it without
// meaningful help?" - one datapoint per Transfer studyTask, not one per
// attempt row. A studyTask's ORIGINAL (earliest non-retry) attempt is the
// independent-solve signal; any later remediation retry is valuable for
// mastery/review/completion but must not convert or dilute that original
// result. See lib/transfer-metrics.test.ts for the exact scenarios this
// guards against.
export type TransferAttemptRecord = {
  patternId: string;
  studyTaskId: string;
  outcome: "solid" | "partial" | "confused";
  // Mirrors attempts.retry_succeeded being non-null - set from
  // AttemptResult.isRetryAfterRemediation at submission time.
  isRetry: boolean;
  createdAt: string;
};

export function transferSolveSuccessByPattern(
  attempts: TransferAttemptRecord[]
): Record<string, { solid: number; total: number }> {
  const originalByTask = new Map<string, TransferAttemptRecord>();
  for (const attempt of attempts) {
    if (attempt.isRetry) continue;
    const existing = originalByTask.get(attempt.studyTaskId);
    if (!existing || attempt.createdAt < existing.createdAt) {
      originalByTask.set(attempt.studyTaskId, attempt);
    }
  }

  const byPattern: Record<string, { solid: number; total: number }> = {};
  for (const original of originalByTask.values()) {
    const bucket = byPattern[original.patternId] ?? { solid: 0, total: 0 };
    bucket.total += 1;
    if (original.outcome === "solid") bucket.solid += 1;
    byPattern[original.patternId] = bucket;
  }
  return byPattern;
}
