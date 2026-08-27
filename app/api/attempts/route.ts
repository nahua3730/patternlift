import { NextResponse } from "next/server";
import type { AttemptResult } from "@/components/practice-workspace";
import { getCurrentUser } from "@/lib/auth";
import { createId, dbExecute, dbOne } from "@/lib/db";
import { buildHistoryItem, buildReviewItem } from "@/lib/persistence";
import { getReviewSchedule } from "@/lib/mastery";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as AttemptResult;

  const historyItem = buildHistoryItem(body);
  const reviewItem = buildReviewItem(body);
  const previousReview = await dbOne<{
    interval_days: number;
    repetitions: number;
  }>(
    `SELECT interval_days, repetitions FROM review_items WHERE user_id = ? AND problem_title = ?`
    , [user.id, body.problemTitle]
  );
  const schedule = getReviewSchedule(body.outcome, previousReview?.interval_days ?? 0);

  await dbExecute(
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
        insight,
        hints_used,
        code_passed,
        confidence,
        explanation_score,
        confused_with,
        input_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  , [
    createId("attempt"),
    user.id,
    body.problemId,
    body.problemTitle,
    body.selectedPatternLabel,
    body.correctPatternLabel,
    body.outcome,
    body.score,
    historyItem.insight,
    body.hintsUsed,
    body.codePassed == null ? null : body.codePassed ? 1 : 0,
    body.confidence,
    body.explanationScore,
    body.confusedWith,
    body.inputMethod
  ]);

  await dbExecute(`DELETE FROM review_items WHERE user_id = ? AND problem_title = ?`, [
    user.id,
    body.problemTitle
  ]);

  await dbExecute(
    `
      INSERT INTO review_items (
        id,
        user_id,
        problem_id,
        problem_title,
        target_pattern_label,
        contrast_pattern_label,
        review_question,
        urgency,
        due_at,
        interval_days,
        repetitions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  , [
    createId("review"),
    user.id,
    reviewItem.problemId ?? null,
    reviewItem.problemTitle,
    reviewItem.targetPatternLabel,
    reviewItem.contrastPatternLabel,
    reviewItem.reviewQuestion,
    reviewItem.urgency,
    schedule.dueAt,
    schedule.intervalDays,
    (previousReview?.repetitions ?? 0) + 1
  ]);

  const todayKey = new Date().toISOString().slice(0, 10);
  await dbExecute(
    `
      INSERT INTO daily_checkins (id, user_id, checkin_date)
      SELECT ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM daily_checkins WHERE user_id = ? AND checkin_date = ?
      )
    `,
    [createId("checkin"), user.id, todayKey, user.id, todayKey]
  );

  return NextResponse.json({ ok: true });
}
