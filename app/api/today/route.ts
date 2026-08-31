import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbAll, dbOne } from "@/lib/db";
import { allProblems, patternOptions } from "@/lib/product";
import { getRepCounts } from "@/lib/rep-counts";
import { computeStreak } from "@/lib/streak";
import type { CurriculumPlan } from "@/lib/curriculum-agent";
import { buildDailySession } from "@/lib/session";
import { buildMasteryModel } from "@/lib/mastery";
import { loadRecentAttempts } from "@/lib/attempts-repo";
import { dominantConfusionFor } from "@/lib/diagnosis";
import { synthesizeTasksFromLegacyDay, type StudyTask } from "@/lib/study-plan";
import { splitByBudget } from "@/lib/today-schedule";
import {
  assertBlindTransferPayload,
  blindTransferTaskPayload,
  type NormalStudyTaskPayload,
  type TodayStudyTaskPayload
} from "@/lib/transfer-contract";
import { isPedagogicallyBlindTransfer } from "@/lib/transfer-safety";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const run = await dbOne<{ id: string; output_json: string; accepted_at: string; headline: string }>(
    `
      SELECT id, output_json, accepted_at
      FROM study_plan_runs
      WHERE user_id = ? AND status = 'accepted'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [user.id]
  );

  if (!run) {
    return NextResponse.json({ error: "No active study plan" }, { status: 404 });
  }

  const plan = JSON.parse(run.output_json) as CurriculumPlan;
  const acceptedAt = new Date(run.accepted_at);
  const daysSinceStart = Math.max(
    0,
    Math.floor((Date.now() - acceptedAt.getTime()) / 86_400_000)
  );
  // Pilot Foundation: the nominal N-day calendar window has elapsed once
  // daysSinceStart reaches plan.days.length. dayIndex stays clamped below
  // for anything that still needs a "day" shape internally, but the
  // response itself must not keep replaying the final curriculum day as
  // if it were fresh content - see the isScheduleComplete branch.
  const isScheduleComplete = daysSinceStart >= plan.days.length;
  const dayIndex = Math.min(daysSinceStart, plan.days.length - 1);
  const day = plan.days[dayIndex];

  // learnResource lives only in the plan JSON (study_tasks has no column
  // for it - see lib/study-plan.ts's LearnResource comment), so a task
  // rebuilt purely from its persisted DB row would silently lose it on
  // every reload. Hydrate it back from the SAME plan.days this request
  // already parsed, keyed by task id (globally unique per Phase 1.1).
  // Spans every day (not just today's) so a pending Learn task keeps the
  // same executable resource wherever it currently surfaces - Carryover,
  // schedule-complete catch-up, or its own original day.
  const planTasksById = new Map(plan.days.flatMap((entry) => entry.tasks ?? []).map((task) => [task.id, task]));

  if (isScheduleComplete) {
    const remainingCoreRows = await dbAll<{
      id: string;
      task_type: StudyTask["type"];
      priority: StudyTask["priority"];
      bucket: StudyTask["bucket"];
      pattern_id: string | null;
      problem_id: string | null;
      title: string;
      estimated_minutes: number;
      status: "pending" | "done" | "skipped";
      day_number: number;
    }>(
      `
        SELECT id, task_type, priority, bucket, pattern_id, problem_id, title, estimated_minutes, status, day_number
        FROM study_tasks
        WHERE plan_run_id = ? AND status = 'pending' AND bucket = 'core' AND task_type != 'transfer'
        ORDER BY day_number ASC, created_at ASC
      `,
      [run.id]
    );
    const remainingCore: NormalStudyTaskPayload[] = remainingCoreRows.map((row) => ({
      kind: "normal",
      id: row.id,
      type: row.task_type as NormalStudyTaskPayload["type"],
      priority: row.priority,
      bucket: row.bucket,
      patternId: row.pattern_id,
      problemId: row.problem_id,
      title: row.title,
      estimatedMinutes: row.estimated_minutes,
      status: row.status,
      dayNumber: row.day_number,
      learnResource: planTasksById.get(row.id)?.learnResource
    }));

    return NextResponse.json(
      {
        planRunId: run.id,
        scheduleStatus: remainingCore.length > 0 ? "schedule_complete" : "complete",
        plan: {
          headline: plan.headline,
          rationale: plan.rationale,
          totalWeeks: plan.totalWeeks,
          dailyMinutes: plan.dailyMinutes,
          totalDays: plan.days.length,
          coachStyle: plan.coachStyle ?? "guided"
        },
        remainingCore
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const reps = await getRepCounts(user.id);

  const problems = day.problemIds
    .map((problemId) => allProblems.find((problem) => problem.id === problemId))
    .filter((problem): problem is (typeof allProblems)[number] => Boolean(problem))
    .map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      reps: reps[problem.id] ?? 0
    }));

  const dueReviews = await dbAll<{
    id: string;
    problem_id: string | null;
    problem_title: string;
    target_pattern_label: string;
    review_question: string;
    urgency: string;
    due_at: string;
  }>(
    `
      SELECT id, problem_id, problem_title, target_pattern_label, review_question, urgency, due_at
      FROM review_items
      WHERE user_id = ? AND due_at <= ?
      ORDER BY due_at ASC
      LIMIT 5
    `,
    [user.id, new Date().toISOString()]
  );

  const checkinRows = await dbAll<{ checkin_date: string }>(
    `SELECT checkin_date FROM daily_checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 30`,
    [user.id]
  );
  const checkins = checkinRows.map((row) => row.checkin_date);
  const streak = computeStreak(checkins);

  const dueReviewsMapped = dueReviews.map((row) => ({
    id: row.id,
    problemId: row.problem_id ?? undefined,
    problemTitle: row.problem_title,
    patternLabel: row.target_pattern_label,
    reviewQuestion: row.review_question,
    urgency: row.urgency
  }));

  const patternLabel = day.patternLabel || patternOptions.find((option) => option.id === day.patternId)?.label;
  const recentAttempts = await loadRecentAttempts(user.id, 60);
  const masteryModel = buildMasteryModel(recentAttempts);
  const todayMastery = patternLabel
    ? masteryModel.mastery.find((pattern) => pattern.label === patternLabel)
    : undefined;
  const dominantConfusion = patternLabel ? dominantConfusionFor(patternLabel, masteryModel.confusions) : null;

  // Support-plan context for today's pattern, computed once here so the
  // client doesn't need a second round trip - recentAttempts is already
  // newest-first (loadRecentAttempts orders by created_at DESC).
  const patternAttempts = patternLabel
    ? recentAttempts.filter((attempt) => attempt.actualPatternLabel === patternLabel)
    : [];
  const mostRecentPatternAttempt = patternAttempts[0];
  const priorSolidExists = patternAttempts.slice(1).some((attempt) => attempt.outcome === "solid");
  const todaySupport = {
    recentScaffoldLevel: mostRecentPatternAttempt?.scaffoldLevel,
    recentOutcomeWasSolid: mostRecentPatternAttempt ? mostRecentPatternAttempt.outcome === "solid" : undefined,
    recentFailureAfterPriorMastery: Boolean(
      mostRecentPatternAttempt && mostRecentPatternAttempt.outcome !== "solid" && priorSolidExists
    )
  };

  // Persisted rows exist for any plan accepted after Phase 1 shipped (the
  // accept route writes one row per task); older accepted plans have none,
  // so fall back to synthesizing a same-looking checklist from the legacy
  // patternId/studyMode/problemIds shape - /today never breaks for an
  // already-in-flight plan.
  const persistedTasks = await dbAll<{
    id: string;
    task_type: StudyTask["type"];
    priority: StudyTask["priority"];
    bucket: StudyTask["bucket"];
    pattern_id: string | null;
    problem_id: string | null;
    title: string;
    estimated_minutes: number;
    status: "pending" | "done" | "skipped";
  }>(
    `
      SELECT id, task_type, priority, bucket, pattern_id, problem_id, title, estimated_minutes, status
      FROM study_tasks
      WHERE plan_run_id = ? AND day_number = ?
      ORDER BY created_at ASC
    `,
    [run.id, day.dayNumber]
  );

  const rawTodayTasks: Array<StudyTask & { status: "pending" | "done" | "skipped" }> =
    persistedTasks.length > 0
      ? persistedTasks.map((row) => ({
          id: row.id,
          type: row.task_type,
          priority: row.priority,
          bucket: row.bucket,
          patternId: row.pattern_id,
          problemId: row.problem_id,
          title: row.title,
          estimatedMinutes: row.estimated_minutes,
          status: row.status,
          learnResource: planTasksById.get(row.id)?.learnResource
        }))
      : synthesizeTasksFromLegacyDay(day).map((task) => ({ ...task, status: "pending" as const }));

  // Pilot Foundation: unfinished Core from any earlier day must never
  // become unreachable just because the calendar moved on - Transfer is
  // deliberately excluded (task_type != 'transfer') since a carried-over
  // Transfer would need its own blindness/demotion re-check against its
  // ORIGINAL day, which is out of scope for this slice; a genuinely
  // unresolved Transfer stays exactly where /api/today already handles it.
  const carryoverRows = await dbAll<{
    id: string;
    task_type: StudyTask["type"];
    priority: StudyTask["priority"];
    bucket: StudyTask["bucket"];
    pattern_id: string | null;
    problem_id: string | null;
    title: string;
    estimated_minutes: number;
    status: "pending" | "done" | "skipped";
    day_number: number;
  }>(
    `
      SELECT id, task_type, priority, bucket, pattern_id, problem_id, title, estimated_minutes, status, day_number
      FROM study_tasks
      WHERE plan_run_id = ? AND day_number < ? AND status = 'pending' AND bucket = 'core' AND task_type != 'transfer'
      ORDER BY day_number ASC, created_at ASC
    `,
    [run.id, day.dayNumber]
  );
  const carryoverPayloads: NormalStudyTaskPayload[] = carryoverRows.map((row) => ({
    kind: "normal",
    id: row.id,
    type: row.task_type as NormalStudyTaskPayload["type"],
    priority: row.priority,
    bucket: row.bucket,
    patternId: row.pattern_id,
    problemId: row.problem_id,
    title: row.title,
    estimatedMinutes: row.estimated_minutes,
    status: row.status,
    dayNumber: row.day_number,
    learnResource: planTasksById.get(row.id)?.learnResource,
    reps: row.problem_id ? reps[row.problem_id] ?? 0 : undefined
  }));
  // Carryover claims up to a full day's guaranteed budget before it's
  // considered "still queued" - deliberately NOT combined with today's own
  // Core bucketing (which already happened once, at generation time, and
  // stays untouched here). This is an additive surface, not a replacement
  // for today's existing session flow.
  const carryover = splitByBudget(carryoverPayloads, plan.dailyMinutes);

  const predictionRows = await dbAll<{ study_task_id: string }>(
    `SELECT study_task_id FROM pattern_predictions WHERE user_id = ?`,
    [user.id]
  );
  const lockedTransferTaskIds = new Set(predictionRows.map((row) => row.study_task_id));

  const hiddenTransfers: Array<{ task: StudyTask; targetPatternId: string; targetPatternLabel: string; contrastPatternId: string }> = [];
  const downgradedTransfers: Array<{ fallback: StudyTask; targetPatternId: string; targetPatternLabel: string; contrastPatternId: string }> = [];
  const sessionTasks: StudyTask[] = [];
  const todayTasks: TodayStudyTaskPayload[] = [];

  for (const task of rawTodayTasks) {
    if (task.type !== "transfer") {
      const normal: NormalStudyTaskPayload = {
        kind: "normal",
        id: task.id,
        type: task.type as NormalStudyTaskPayload["type"],
        priority: task.priority,
        bucket: task.bucket,
        patternId: task.patternId,
        problemId: task.problemId,
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        status: task.status,
        learnResource: task.learnResource,
        reps: task.problemId ? reps[task.problemId] ?? 0 : undefined
      };
      todayTasks.push(normal);
      sessionTasks.push(task);
      continue;
    }

    if (!task.problemId || !task.patternId) {
      // A malformed legacy Transfer cannot be recognized safely or solved
      // as a normal problem. Keep it out of recognition metrics and expose
      // only a generic, unscored review fallback.
      const fallback: StudyTask = {
        ...task,
        id: `unscored-${task.id}`,
        type: "review",
        patternId: null,
        problemId: null,
        title: "Mixed pattern review"
      };
      sessionTasks.push(fallback);
      todayTasks.push({ kind: "normal", ...fallback, type: "review", status: task.status });
      continue;
    }

    const locked = lockedTransferTaskIds.has(task.id);
    const pedagogicallyBlind = locked || isPedagogicallyBlindTransfer({ plan, day, task });
    if (!pedagogicallyBlind) {
      // Existing accepted plans can contain a same-day-primed Transfer. Do
      // not manufacture recognition evidence from it: expose a synthetic
      // ordinary-practice task and leave the persisted Transfer row untouched.
      // patternId is stripped here (not just left off the payload type) -
      // the real target pattern must not survive into the practice task
      // this downgrade produces, matching the malformed-transfer fallback
      // above.
      const fallbackId = `unscored-${task.id}`;
      const fallback: StudyTask = { ...task, id: fallbackId, type: "practice", patternId: null };
      sessionTasks.push(fallback);
      todayTasks.push({
        kind: "normal",
        ...fallback,
        type: "practice",
        status: task.status
      });
      const downgradedProblem = allProblems.find((entry) => entry.id === task.problemId);
      const downgradedTargetLabel = patternOptions.find((entry) => entry.id === task.patternId)?.label ?? task.patternId;
      if (downgradedProblem) {
        downgradedTransfers.push({
          fallback,
          targetPatternId: task.patternId,
          targetPatternLabel: downgradedTargetLabel,
          contrastPatternId: downgradedProblem.contrastPatternId
        });
      }
      continue;
    }

    todayTasks.push(
      blindTransferTaskPayload({
        id: task.id,
        priority: task.priority,
        bucket: task.bucket,
        problemId: task.problemId,
        estimatedMinutes: task.estimatedMinutes,
        status: task.status,
        predictionLocked: locked
      })
    );
    sessionTasks.push(task);

    if (!locked) {
      const problem = allProblems.find((entry) => entry.id === task.problemId);
      const targetPatternLabel = patternOptions.find((entry) => entry.id === task.patternId)?.label ?? task.patternId;
      if (problem) {
        hiddenTransfers.push({
          task,
          targetPatternId: task.patternId,
          targetPatternLabel,
          contrastPatternId: problem.contrastPatternId
        });
      }
    }
  }

  const hiddenPatternLabels = new Set(hiddenTransfers.map((entry) => entry.targetPatternLabel));
  const publicDueReviews = dueReviewsMapped.filter((review) => !hiddenPatternLabels.has(review.patternLabel));
  const publicProblemIds = sessionTasks
    .filter((task) => task.type !== "transfer" && task.bucket === "core" && task.problemId)
    .map((task) => task.problemId as string);
  const sessionDay = {
    ...day,
    problemIds: publicProblemIds,
    tasks: sessionTasks
  };
  const session = buildDailySession(sessionDay, publicDueReviews, plan.coachStyle ?? "guided", {
    skills: todayMastery?.skills,
    dominantConfusion
  });

  const publicProblems = problems.filter((problem) => publicProblemIds.includes(problem.id));
  const hasUnresolvedTransfer = hiddenTransfers.length > 0;

  const payload = {
    // Phase 1.1 follow-up: lets the client scope its localStorage session
    // key to this specific accepted plan, not just a bare day number - see
    // components/session-runner.tsx / lib/session.ts's sessionStorageKey.
    planRunId: run.id,
    scheduleStatus: "active" as const,
    carryover,
    plan: {
      headline: hasUnresolvedTransfer ? "Your personalized study path" : plan.headline,
      rationale: hasUnresolvedTransfer ? "A focused mix of practice, review, and pattern challenges." : plan.rationale,
      totalWeeks: plan.totalWeeks,
      dailyMinutes: plan.dailyMinutes,
      totalDays: plan.days.length,
      coachStyle: plan.coachStyle ?? "guided"
    },
    today: {
      dayNumber: day.dayNumber,
      weekNumber: day.weekNumber,
      patternLabel: hiddenPatternLabels.has(day.patternLabel) ? "Mixed practice" : day.patternLabel,
      studyMode: day.studyMode,
      problems: publicProblems
    },
    todayTasks,
    dueReviews: publicDueReviews,
    streak,
    checkins,
    session,
    todaySkills: todayMastery?.skills,
    todaySupport
  };

  if (process.env.NODE_ENV !== "production") {
    for (const hidden of hiddenTransfers) {
      const taskPayload = todayTasks.find((task) => task.id === hidden.task.id);
      const stepPayload = session.steps.find((step) => step.studyTaskId === hidden.task.id);
      assertBlindTransferPayload({ task: taskPayload, step: stepPayload }, {
        problemId: hidden.task.problemId as string,
        targetPatternId: hidden.targetPatternId,
        targetPatternLabel: hidden.targetPatternLabel,
        contrastPatternId: hidden.contrastPatternId
      });
    }
    // A no-longer-blind Transfer downgraded to ordinary practice is allowed
    // to reveal its problemId (it's genuinely playable as practice now),
    // but must not carry the target pattern it was hidden for - this is
    // the exact class of leak the fallback above was patched to close.
    for (const downgraded of downgradedTransfers) {
      const taskPayload = todayTasks.find((task) => task.id === downgraded.fallback.id);
      const stepPayload = session.steps.find((step) => step.studyTaskId === downgraded.fallback.id);
      assertBlindTransferPayload({ task: taskPayload, step: stepPayload }, {
        problemId: downgraded.fallback.problemId as string,
        targetPatternId: downgraded.targetPatternId,
        targetPatternLabel: downgraded.targetPatternLabel,
        contrastPatternId: downgraded.contrastPatternId
      });
    }
  }

  return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
}
