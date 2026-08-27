import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbAll } from "@/lib/db";
import type { PersistenceSnapshot } from "@/lib/persistence";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts = await dbAll<{
    id: string;
    problem_id: string;
    problem_title: string;
    selected_pattern_label: string;
    correct_pattern_label: string;
    outcome: string;
    score: number;
    insight: string;
    hints_used: number;
    code_passed: number | null;
    confidence: number;
    confused_with: string | null;
    input_method: string;
    created_at: string;
  }>(
      `
        SELECT id, problem_id, problem_title, selected_pattern_label, correct_pattern_label,
          outcome, score, insight, hints_used, code_passed, confidence, confused_with,
          input_method, created_at
        FROM attempts
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 24
      `
    , [user.id]
  );

  const reviewItems = await dbAll<{
    id: string;
    problem_title: string;
    target_pattern_label: string;
    contrast_pattern_label: string;
    review_question: string;
    urgency: string;
    due_at: string | null;
    interval_days: number;
    repetitions: number;
  }>(
      `
        SELECT id, problem_title, target_pattern_label, contrast_pattern_label, review_question,
          urgency, due_at, interval_days, repetitions
        FROM review_items
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 4
      `
    , [user.id]
  );

  // Real attempts/review items for this user - never the starter/demo content.
  // That content is only for the logged-out marketing preview; showing it to a
  // real signed-in account with no history yet would fabricate progress they
  // never made (fake "recent misses", fake due-today reviews).
  const history = attempts.map((attempt) => ({
    id: attempt.id,
    problemId: attempt.problem_id,
    problemTitle: attempt.problem_title,
    selectedPatternLabel: attempt.selected_pattern_label,
    actualPatternLabel: attempt.correct_pattern_label,
    outcome: attempt.outcome as "solid" | "partial" | "confused",
    insight: attempt.insight,
    score: attempt.score,
    hintsUsed: attempt.hints_used,
    codePassed: attempt.code_passed == null ? null : attempt.code_passed === 1,
    confidence: attempt.confidence,
    confusedWith: attempt.confused_with,
    inputMethod: attempt.input_method as "text" | "voice",
    createdAt: attempt.created_at
  }));

  const reviewQueue = reviewItems.map((item) => ({
    id: item.id,
    problemTitle: item.problem_title,
    targetPatternLabel: item.target_pattern_label,
    contrastPatternLabel: item.contrast_pattern_label,
    reviewQuestion: item.review_question,
    urgency: item.urgency as "high" | "medium",
    dueAt: item.due_at ?? undefined,
    intervalDays: item.interval_days,
    repetitions: item.repetitions
  }));

  const snapshot: PersistenceSnapshot = {
    history,
    reviewQueue
  };

  return NextResponse.json(snapshot);
}
