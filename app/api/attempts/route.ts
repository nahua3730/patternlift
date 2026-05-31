import { NextResponse } from "next/server";
import type { AttemptResult } from "@/components/practice-workspace";
import { getCurrentUser } from "@/lib/auth";
import { createId, db } from "@/lib/db";
import { buildHistoryItem, buildReviewItem } from "@/lib/persistence";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as AttemptResult;

  const historyItem = buildHistoryItem(body);
  const reviewItem = buildReviewItem(body);

  db.prepare(
    `
      INSERT INTO attempts (
        id,
        user_id,
        problem_id,
        problem_title,
        selected_pattern_label,
        correct_pattern_label,
        outcome,
        score,
        insight
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    createId("attempt"),
    user.id,
    body.problemId,
    body.problemTitle,
    body.selectedPatternLabel,
    body.correctPatternLabel,
    body.outcome,
    body.score,
    historyItem.insight
  );

  db.prepare(`DELETE FROM review_items WHERE user_id = ? AND problem_title = ?`).run(
    user.id,
    body.problemTitle
  );

  db.prepare(
    `
      INSERT INTO review_items (
        id,
        user_id,
        problem_title,
        target_pattern_label,
        contrast_pattern_label,
        review_question,
        urgency
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    createId("review"),
    user.id,
    reviewItem.problemTitle,
    reviewItem.targetPatternLabel,
    reviewItem.contrastPatternLabel,
    reviewItem.reviewQuestion,
    reviewItem.urgency
  );

  return NextResponse.json({ ok: true });
}
