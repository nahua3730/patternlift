import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbOne } from "@/lib/db";
import { allProblems, patternOptions } from "@/lib/product";
import { buildBlindProblemPreview } from "@/lib/transfer-problem";
import { blindTransferTaskPayload, type TransferTaskStateResponse } from "@/lib/transfer-contract";
import type { Priority, TaskBucket } from "@/lib/study-plan";
import { getProblemCodeConfig, hasNativeProblemCodeConfig } from "@/lib/problem-code";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: { params: { studyTaskId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE });

  const task = await dbOne<{
    id: string;
    task_type: string;
    priority: Priority;
    bucket: TaskBucket;
    problem_id: string | null;
    pattern_id: string | null;
    estimated_minutes: number;
    status: "pending" | "done" | "skipped";
  }>(
    `SELECT id, task_type, priority, bucket, problem_id, pattern_id, estimated_minutes, status
     FROM study_tasks WHERE id = ? AND user_id = ?`,
    [params.studyTaskId, user.id]
  );

  // Return the same not-found response for a missing task and a task owned by
  // somebody else, so task ids are not an ownership oracle.
  if (!task || task.task_type !== "transfer" || !task.problem_id || !task.pattern_id) {
    return NextResponse.json({ error: "Transfer task not found" }, { status: 404, headers: PRIVATE_NO_STORE });
  }

  const problem = allProblems.find((entry) => entry.id === task.problem_id);
  if (!problem || problem.targetPatternId !== task.pattern_id) {
    return NextResponse.json({ error: "Invalid Transfer task" }, { status: 409, headers: PRIVATE_NO_STORE });
  }

  const prediction = await dbOne<{ predicted_pattern_id: string | null }>(
    `SELECT predicted_pattern_id FROM pattern_predictions
     WHERE user_id = ? AND study_task_id = ? ORDER BY created_at ASC LIMIT 1`,
    [user.id, task.id]
  );

  const publicTask = blindTransferTaskPayload({
    id: task.id,
    priority: task.priority,
    bucket: task.bucket,
    problemId: problem.id,
    estimatedMinutes: task.estimated_minutes,
    status: task.status,
    predictionLocked: Boolean(prediction)
  });

  if (!prediction) {
    const response: TransferTaskStateResponse = {
      state: "awaiting_prediction",
      task: publicTask,
      problem: buildBlindProblemPreview(problem)
    };
    return NextResponse.json(response, { headers: PRIVATE_NO_STORE });
  }

  const response: TransferTaskStateResponse = {
    state: "prediction_locked",
    task: publicTask,
    prediction: { predictedPatternId: prediction.predicted_pattern_id },
    solve: {
      problem,
      codeConfig: getProblemCodeConfig(problem),
      hasNativeCodeConfig: hasNativeProblemCodeConfig(problem.id),
      patternLabel: patternOptions.find((pattern) => pattern.id === problem.targetPatternId)?.label ?? problem.targetPatternId,
      coachStyle: "optional"
    }
  };
  return NextResponse.json(response, { headers: PRIVATE_NO_STORE });
}
