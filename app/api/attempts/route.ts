import { NextResponse } from "next/server";
import type { AttemptResult } from "@/components/practice-workspace";
import { getCurrentUser } from "@/lib/auth";
import { createId, dbExecute, dbOne } from "@/lib/db";
import { buildHistoryItem, buildReviewItem } from "@/lib/persistence";
import { retentionContextFor, type MasteryAttempt } from "@/lib/mastery";
import { getReviewSchedule } from "@/lib/review-schedule";
import { loadRecentAttempts } from "@/lib/attempts-repo";
import { diagnoseAttempt } from "@/lib/diagnosis";

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
  // Study Plan Phase 1: an A-priority task gets the 1-3-7 seed schedule for
  // its first couple of reviews instead of jumping straight to a 7-day
  // interval - reuses the exact same getReviewSchedule path, just with
  // this extra context. Not every attempt comes from a planned task (e.g.
  // /practice, /start), so this is a best-effort lookup, not a hard
  // requirement - no matching task just means the normal curve applies.
  const priorityTask = body.problemId
    ? await dbOne<{ priority: string }>(
        `SELECT priority FROM study_tasks WHERE user_id = ? AND problem_id = ? ORDER BY created_at DESC LIMIT 1`,
        [user.id, body.problemId]
      )
    : undefined;
  const schedule = getReviewSchedule(body.outcome, previousReview?.interval_days ?? 0, {
    isPriorityA: priorityTask?.priority === "A",
    repetitions: previousReview?.repetitions ?? 0
  });

  // Same deterministic engine the Progress page uses, computed here so the
  // diagnosis is persisted as a stable record of what the learner was told
  // at the time - independent of the mastery formula evolving later.
  const priorAttempts = await loadRecentAttempts(user.id, 60);
  const currentAttempt: MasteryAttempt = {
    problemId: body.problemId,
    problemTitle: body.problemTitle,
    selectedPatternLabel: body.selectedPatternLabel,
    actualPatternLabel: body.correctPatternLabel,
    outcome: body.outcome,
    explanationScore: body.explanationScore,
    hintsUsed: body.hintsUsed,
    codePassed: body.codePassed,
    confidence: body.confidence,
    createdAt: new Date().toISOString()
  };
  const priorPatternAttempts = priorAttempts.filter(
    (attempt) => attempt.actualPatternLabel === body.correctPatternLabel
  );
  const retention = retentionContextFor([currentAttempt, ...priorPatternAttempts]);
  const diagnosis = diagnoseAttempt(
    {
      selectedPatternLabel: body.selectedPatternLabel,
      actualPatternLabel: body.correctPatternLabel,
      outcome: body.outcome,
      explanationScore: body.explanationScore,
      codePassed: body.codePassed,
      hintsUsed: body.hintsUsed,
      confidence: body.confidence
    },
    retention
  );

  // Retry-after-remediation succeeded if the outcome improved past
  // "confused" - null when this attempt wasn't a remediation retry at all.
  const retrySucceeded = body.isRetryAfterRemediation ? body.outcome !== "confused" : null;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[diagnosis]", body.problemTitle, {
      selected: body.selectedPatternLabel,
      actual: body.correctPatternLabel,
      outcome: body.outcome,
      retention,
      diagnosis,
      highestHintLevel: body.highestHintLevel,
      scaffoldLevel: body.scaffoldLevel,
      remediationUsed: body.remediationUsed,
      isRetryAfterRemediation: body.isRetryAfterRemediation,
      retrySucceeded
    });
  }

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
        input_method,
        primary_failure_type,
        secondary_failure_type,
        diagnosis_confidence,
        diagnosis_payload,
        highest_hint_level,
        scaffold_level,
        remediation_used,
        retry_succeeded,
        study_task_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    body.inputMethod,
    diagnosis.primaryFailure,
    diagnosis.secondaryFailure ?? null,
    diagnosis.confidence,
    JSON.stringify(diagnosis),
    body.highestHintLevel ?? null,
    body.scaffoldLevel ?? null,
    body.remediationUsed && body.remediationUsed.length > 0 ? JSON.stringify(body.remediationUsed) : null,
    retrySucceeded == null ? null : retrySucceeded ? 1 : 0,
    // Phase 2A: which StudyTask this attempt belongs to, when known -
    // set by session-runner.tsx from the active SessionStep.studyTaskId.
    body.studyTaskId ?? null
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

  return NextResponse.json({ ok: true, diagnosis });
}
