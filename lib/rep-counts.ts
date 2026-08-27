import { dbAll } from "@/lib/db";

export async function getRepCounts(userId: string): Promise<Record<string, number>> {
  const [attemptRows, markRows] = await Promise.all([
    dbAll<{ problem_id: string; count: number }>(
      `SELECT problem_id, COUNT(*) as count FROM attempts WHERE user_id = ? GROUP BY problem_id`,
      [userId]
    ),
    dbAll<{ problem_id: string; count: number }>(
      `SELECT problem_id, COUNT(*) as count FROM problem_marks WHERE user_id = ? GROUP BY problem_id`,
      [userId]
    )
  ]);

  const reps: Record<string, number> = {};
  for (const row of attemptRows) {
    reps[row.problem_id] = (reps[row.problem_id] ?? 0) + Number(row.count);
  }
  for (const row of markRows) {
    reps[row.problem_id] = (reps[row.problem_id] ?? 0) + Number(row.count);
  }
  return reps;
}
