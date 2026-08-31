import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbExecute, dbOne } from "@/lib/db";
import type { CurriculumPlan } from "@/lib/curriculum-agent";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { runId?: string };
  if (!body.runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const run = await dbOne<{ id: string; output_json: string }>(
    `SELECT id, output_json FROM study_plan_runs WHERE id = ? AND user_id = ?`,
    [body.runId, user.id]
  );
  if (!run) {
    return NextResponse.json({ error: "Study plan run not found" }, { status: 404 });
  }

  await dbExecute(
    `UPDATE study_plan_runs SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    [body.runId, user.id]
  );

  // Old-shape plans (persisted before Phase 1) have no days[].tasks[] -
  // nothing to insert here; /api/today synthesizes a fallback checklist
  // for those from problemIds instead.
  try {
    const plan = JSON.parse(run.output_json) as CurriculumPlan;
    for (const day of plan.days) {
      for (const task of day.tasks ?? []) {
        await dbExecute(
          `
            INSERT INTO study_tasks
              (id, user_id, plan_run_id, day_number, task_type, priority, bucket, pattern_id, problem_id, title, estimated_minutes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          `,
          [
            // Reuse the task's own id from the plan JSON (globally unique
            // since Phase 1.1 - it embeds the plan run's id) rather than
            // minting a fresh one here. session.ts tags each generated
            // step with this exact same task.id as its studyTaskId, so
            // the persisted row's id MUST match it verbatim for the
            // client's studyTaskId-based completion matching to work.
            task.id,
            user.id,
            run.id,
            day.dayNumber,
            task.type,
            task.priority,
            task.bucket,
            task.patternId,
            task.problemId,
            task.title,
            task.estimatedMinutes
          ]
        );
      }
    }
  } catch {
    // Malformed output_json shouldn't block starting the plan - the
    // checklist just falls back to the synthesized view on /today.
  }

  return NextResponse.json({ href: "/today" });
}
