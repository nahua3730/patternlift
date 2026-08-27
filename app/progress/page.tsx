import { requireUser } from "@/lib/auth";
import { dbAll, dbOne } from "@/lib/db";
import { loadRecentAttempts } from "@/lib/attempts-repo";
import { getRepCounts } from "@/lib/rep-counts";
import { computeStreak } from "@/lib/streak";
import { buildMasteryModel } from "@/lib/mastery";
import { ProgressPanel } from "@/components/progress-panel";

const MASTERY_MODEL_ATTEMPT_LIMIT = 300;

export default async function ProgressPage() {
  const user = await requireUser("/progress");

  const [totalRow, solidRow, checkinRows, reviewRows, attempts, reps] = await Promise.all([
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
    getRepCounts(user.id)
  ]);

  const totalAttempts = Number(totalRow?.count ?? 0);
  const solidAttempts = Number(solidRow?.count ?? 0);
  const streak = computeStreak(checkinRows.map((row) => row.checkin_date));
  const now = Date.now();
  const reviewDueCount = reviewRows.filter(
    (row) => !row.due_at || new Date(row.due_at).getTime() <= now
  ).length;
  const masteryModel = buildMasteryModel(attempts);

  return (
    <ProgressPanel
      totalAttempts={totalAttempts}
      solidAttempts={solidAttempts}
      reviewDueCount={reviewDueCount}
      streak={streak}
      masteryModel={masteryModel}
      reps={reps}
      recentAttempts={attempts.slice(0, 40)}
    />
  );
}
