import { dbAll } from "@/lib/db";
import type { MasteryAttempt } from "@/lib/mastery";

export async function loadRecentAttempts(userId: string, limit = 24): Promise<MasteryAttempt[]> {
  const rows = await dbAll<{
    problem_id: string;
    problem_title: string;
    selected_pattern_label: string;
    correct_pattern_label: string;
    outcome: "solid" | "partial" | "confused";
    score: number;
    explanation_score: number | null;
    hints_used: number;
    code_passed: number | null;
    confidence: number;
    confused_with: string | null;
    created_at: string;
  }>(
    `
      SELECT problem_id, problem_title, selected_pattern_label, correct_pattern_label,
        outcome, score, explanation_score, hints_used, code_passed, confidence, confused_with, created_at
      FROM attempts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
    [userId, limit]
  );

  return rows.map((row) => ({
    problemId: row.problem_id,
    problemTitle: row.problem_title,
    selectedPatternLabel: row.selected_pattern_label,
    actualPatternLabel: row.correct_pattern_label,
    outcome: row.outcome,
    score: row.score,
    // 0 is stored as a real "no explanation given" signal in some older
    // rows, indistinguishable from a genuine zero score - treat it as
    // present either way and let scoreConcept's evidence weighting handle it.
    explanationScore: row.explanation_score ?? undefined,
    hintsUsed: row.hints_used,
    codePassed: row.code_passed == null ? null : row.code_passed === 1,
    confidence: row.confidence,
    confusedWith: row.confused_with,
    createdAt: row.created_at
  }));
}
