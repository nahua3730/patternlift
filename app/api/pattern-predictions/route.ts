import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createId, dbExecute, dbOne } from "@/lib/db";
import { patternOptions } from "@/lib/product";
import { buildPredictionAckResponse, resolvePrediction } from "@/lib/pattern-predictions";

// Phase 2A: the authoritative structured record of a learner's blind
// pre-solve pattern prediction on a Transfer task.
//
// SECURITY-BOUNDARY-STYLE INVARIANT: actualPatternId is resolved HERE,
// server-side, from the study_tasks row the prediction belongs to (scoped
// to this user) - never accepted from the request body, even if present.
// The response is deliberately minimal ({id} only) - it never includes
// wasCorrect or actualPatternId, so the client has nothing to withhold;
// the value was simply never sent. Correctness is revealed only later, by
// the Transfer result step, after the independent solve completes.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    studyTaskId?: string;
    problemId?: string;
    predictedPatternId?: string | null;
    reasoning?: string;
  };

  if (!body.studyTaskId || !body.problemId) {
    return NextResponse.json({ error: "Missing studyTaskId or problemId" }, { status: 400 });
  }

  const task = await dbOne<{ id: string; pattern_id: string | null; problem_id: string | null; task_type: string }>(
    `SELECT id, pattern_id, problem_id, task_type FROM study_tasks WHERE id = ? AND user_id = ?`,
    [body.studyTaskId, user.id]
  );

  if (!task || task.task_type !== "transfer" || !task.pattern_id || task.problem_id !== body.problemId) {
    return NextResponse.json({ error: "Invalid Transfer task" }, { status: 400 });
  }

  // SECURITY-BOUNDARY-STYLE INVARIANT: a prediction is immutable once
  // submitted. A second POST for the same studyTaskId - a refresh-and-
  // resubmit, a duplicate click, a stale client resubmitting - must never
  // create a second authoritative row or let a later guess silently
  // overwrite the first. The endpoint is idempotent: it returns the
  // ORIGINAL prediction's id unchanged, exactly as if the resubmission
  // itself had "succeeded", without touching the stored prediction.
  const existing = await dbOne<{ id: string }>(
    `SELECT id FROM pattern_predictions WHERE study_task_id = ? AND user_id = ? ORDER BY created_at ASC LIMIT 1`,
    [task.id, user.id]
  );
  if (existing) {
    return NextResponse.json(buildPredictionAckResponse(existing.id));
  }

  // task.pattern_id is the trusted, server-resolved actual pattern - a
  // client-supplied "actualPatternId" is never read from the body at all.
  const resolved = resolvePrediction({
    requestedPredictedPatternId: body.predictedPatternId,
    actualPatternId: task.pattern_id,
    requestedReasoning: body.reasoning,
    validPatternIds: patternOptions.map((pattern) => pattern.id)
  });

  const id = createId("prediction");
  await dbExecute(
    `
      INSERT INTO pattern_predictions
        (id, user_id, study_task_id, problem_id, predicted_pattern_id, actual_pattern_id, reasoning, was_correct)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id, study_task_id) DO NOTHING
    `,
    [
      id,
      user.id,
      task.id,
      body.problemId,
      resolved.predictedPatternId,
      resolved.actualPatternId,
      resolved.reasoning,
      resolved.wasCorrect ? 1 : 0
    ]
  );

  // The unique database constraint closes the race between the pre-check
  // above and this INSERT. If another request won, acknowledge that first
  // immutable row rather than the discarded candidate id.
  const authoritative = await dbOne<{ id: string }>(
    `SELECT id FROM pattern_predictions WHERE study_task_id = ? AND user_id = ? ORDER BY created_at ASC LIMIT 1`,
    [task.id, user.id]
  );
  return NextResponse.json(buildPredictionAckResponse(authoritative?.id ?? id));
}

// Two distinct intents share this one endpoint, gated by ?mode=:
// - mode=resume: lets the client recover a locked-in prediction after a
//   refresh (e.g. between prediction and solving) WITHOUT revealing
//   correctness - only predictedPatternId is returned. Used by
//   session-runner.tsx to restore its recognition-override state.
// - default (no mode / mode=reveal): the full reveal, only ever called
//   from the Transfer result step, reached AFTER the independent solve.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const studyTaskId = url.searchParams.get("studyTaskId");
  if (!studyTaskId) return NextResponse.json({ error: "Missing studyTaskId" }, { status: 400 });

  const prediction = await dbOne<{
    predicted_pattern_id: string | null;
    actual_pattern_id: string;
    was_correct: number;
    reasoning: string | null;
  }>(
    `
      SELECT predicted_pattern_id, actual_pattern_id, was_correct, reasoning
      FROM pattern_predictions
      WHERE study_task_id = ? AND user_id = ?
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [studyTaskId, user.id]
  );

  if (!prediction) return NextResponse.json({ error: "No prediction found" }, { status: 404 });

  if (url.searchParams.get("mode") === "resume") {
    return NextResponse.json({ predictedPatternId: prediction.predicted_pattern_id });
  }

  return NextResponse.json({
    predictedPatternId: prediction.predicted_pattern_id,
    actualPatternId: prediction.actual_pattern_id,
    wasCorrect: Boolean(prediction.was_correct),
    reasoning: prediction.reasoning
  });
}
