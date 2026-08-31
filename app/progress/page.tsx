import { requireUser } from "@/lib/auth";
import { dbAll, dbOne } from "@/lib/db";
import { loadRecentAttempts } from "@/lib/attempts-repo";
import { getRepCounts } from "@/lib/rep-counts";
import { computeStreak } from "@/lib/streak";
import { buildMasteryModel } from "@/lib/mastery";
import { transferSolveSuccessByPattern } from "@/lib/transfer-metrics";
import { ProgressPanel } from "@/components/progress-panel";

const MASTERY_MODEL_ATTEMPT_LIMIT = 300;

export default async function ProgressPage() {
  const user = await requireUser("/progress");

  const [totalRow, solidRow, checkinRows, reviewRows, attempts, reps, recognitionRows, transferRows] =
    await Promise.all([
      dbOne<{ count: number }>(`SELECT COUNT(*) as count FROM attempts WHERE user_id = ?`, [user.id]),
      dbOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND outcome = 'solid'`,
        [user.id]
      ),
      dbAll<{ checkin_date: string }>(
        `SELECT checkin_date FROM daily_checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 60`,
        [user.id]
      ),
      dbAll<{ due_at: string | null }>(`SELECT due_at FROM review_items WHERE user_id = ?`, [user.id]),
      loadRecentAttempts(user.id, MASTERY_MODEL_ATTEMPT_LIMIT),
      getRepCounts(user.id),
      // Phase 2A: Recognition Accuracy - per pattern, correct/total blind
      // Transfer predictions. actual_pattern_id is the trusted source
      // (server-resolved at prediction time, see app/api/pattern-
      // predictions/route.ts), never anything client-supplied.
      dbAll<{ actual_pattern_id: string; total: number; correct: number }>(
        `
          SELECT actual_pattern_id, COUNT(*) as total, SUM(CASE WHEN was_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM pattern_predictions
          WHERE user_id = ?
          GROUP BY actual_pattern_id
        `,
        [user.id]
      ),
      // Phase 2A.1: Transfer Solve Success - one datapoint per Transfer
      // studyTask (encounter), not per attempt row. Fetches raw attempt
      // rows here; transferSolveSuccessByPattern derives the original
      // (pre-retry) independent-solve result per task and aggregates that -
      // see lib/transfer-metrics.ts for why a later remediation retry must
      // not convert or dilute the original encounter's result.
      dbAll<{ pattern_id: string; study_task_id: string; outcome: "solid" | "partial" | "confused"; is_retry: number; created_at: string }>(
        `
          SELECT
            st.pattern_id as pattern_id,
            a.study_task_id as study_task_id,
            a.outcome as outcome,
            CASE WHEN a.retry_succeeded IS NULL THEN 0 ELSE 1 END as is_retry,
            a.created_at as created_at
          FROM attempts a
          JOIN study_tasks st ON st.id = a.study_task_id
          WHERE a.user_id = ? AND st.task_type = 'transfer' AND st.pattern_id IS NOT NULL
        `,
        [user.id]
      )
    ]);

  const totalAttempts = Number(totalRow?.count ?? 0);
  const solidAttempts = Number(solidRow?.count ?? 0);
  const streak = computeStreak(checkinRows.map((row) => row.checkin_date));
  const now = Date.now();
  const reviewDueCount = reviewRows.filter(
    (row) => !row.due_at || new Date(row.due_at).getTime() <= now
  ).length;
  const masteryModel = buildMasteryModel(attempts);

  const recognitionAccuracyByPattern = Object.fromEntries(
    recognitionRows.map((row) => [row.actual_pattern_id, { correct: Number(row.correct), total: Number(row.total) }])
  );
  const transferSuccessByPattern = transferSolveSuccessByPattern(
    transferRows.map((row) => ({
      patternId: row.pattern_id,
      studyTaskId: row.study_task_id,
      outcome: row.outcome,
      isRetry: Number(row.is_retry) === 1,
      createdAt: row.created_at
    }))
  );

  return (
    <ProgressPanel
      totalAttempts={totalAttempts}
      solidAttempts={solidAttempts}
      reviewDueCount={reviewDueCount}
      streak={streak}
      masteryModel={masteryModel}
      reps={reps}
      recentAttempts={attempts.slice(0, 40)}
      recognitionAccuracyByPattern={recognitionAccuracyByPattern}
      transferSuccessByPattern={transferSuccessByPattern}
    />
  );
}
