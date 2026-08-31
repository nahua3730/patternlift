import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbOne } from "@/lib/db";
import { allProblems } from "@/lib/product";
import { getProblemCodeConfig, hasNativeProblemCodeConfig } from "@/lib/problem-code";
import type { CurriculumPlan } from "@/lib/curriculum-agent";
import type { StudyTask } from "@/lib/study-plan";
import { isPedagogicallyBlindTransfer } from "@/lib/transfer-safety";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: Request, { params }: { params: { problemId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE });

  const problem = allProblems.find((entry) => entry.id === params.problemId);
  if (!problem) return NextResponse.json({ error: "Unknown problem" }, { status: 404, headers: PRIVATE_NO_STORE });

  const taskId = new URL(request.url).searchParams.get("studyTaskId");
  if (taskId) {
    const task = await dbOne<{ task_type: string }>(
      `SELECT task_type FROM study_tasks WHERE id = ? AND user_id = ? AND problem_id = ?`,
      [taskId, user.id, problem.id]
    );
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404, headers: PRIVATE_NO_STORE });
    if (task.task_type === "transfer") {
      const prediction = await dbOne<{ id: string }>(
        `SELECT id FROM pattern_predictions WHERE user_id = ? AND study_task_id = ? LIMIT 1`,
        [user.id, taskId]
      );
      if (!prediction) {
        return NextResponse.json({ error: "Prediction required" }, { status: 423, headers: PRIVATE_NO_STORE });
      }
    }
  } else {
    // An unscoped ordinary-practice request must not become a bypass for an
    // unresolved Transfer of the same problem in the learner's accepted plan.
    const unresolvedTransfer = await dbOne<{
      id: string;
      priority: StudyTask["priority"];
      bucket: StudyTask["bucket"];
      pattern_id: string | null;
      title: string;
      estimated_minutes: number;
      day_number: number;
      output_json: string;
    }>(
      `SELECT st.id, st.priority, st.bucket, st.pattern_id, st.title, st.estimated_minutes, st.day_number, spr.output_json
       FROM study_tasks st
       JOIN study_plan_runs spr ON spr.id = st.plan_run_id AND spr.user_id = st.user_id
       LEFT JOIN pattern_predictions pp ON pp.user_id = st.user_id AND pp.study_task_id = st.id
       WHERE st.user_id = ? AND st.problem_id = ? AND st.task_type = 'transfer'
         AND spr.status = 'accepted' AND pp.id IS NULL
       ORDER BY spr.created_at DESC LIMIT 1`,
      [user.id, problem.id]
    );
    if (unresolvedTransfer) {
      // /api/today independently downgrades a same-day-primed or otherwise
      // no-longer-blind Transfer to ordinary practice, leaving this row
      // untouched. Without this check that downgraded task's own problem
      // would stay permanently blocked here even though /today already
      // serves it as unscored practice - re-run the same canonical check
      // so the two endpoints agree on whether this Transfer still gates.
      const plan = JSON.parse(unresolvedTransfer.output_json) as CurriculumPlan;
      const day = plan.days.find((entry) => entry.dayNumber === unresolvedTransfer.day_number);
      const task: StudyTask = {
        id: unresolvedTransfer.id,
        type: "transfer",
        priority: unresolvedTransfer.priority,
        bucket: unresolvedTransfer.bucket,
        patternId: unresolvedTransfer.pattern_id,
        problemId: problem.id,
        title: unresolvedTransfer.title,
        estimatedMinutes: unresolvedTransfer.estimated_minutes
      };
      const stillBlind = day ? isPedagogicallyBlindTransfer({ plan, day, task }) : true;
      if (stillBlind) {
        return NextResponse.json({ error: "Prediction required" }, { status: 423, headers: PRIVATE_NO_STORE });
      }
    }
  }

  return NextResponse.json(
    {
      problem,
      codeConfig: getProblemCodeConfig(problem),
      hasNativeCodeConfig: hasNativeProblemCodeConfig(problem.id)
    },
    { headers: PRIVATE_NO_STORE }
  );
}
