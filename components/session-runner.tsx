"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PracticeWorkspace, type AttemptResult } from "@/components/practice-workspace";
import { RemediationStepView } from "@/components/remediation-step";
import { SessionStepIntro } from "@/components/session-step-intro";
import { usePatternLiftState } from "@/components/patternlift-state";
import { patternOptions } from "@/lib/product";
import type { DailySession, SessionStep } from "@/lib/session";
import { buildRemediationBranch } from "@/lib/session";
import { getTechniqueById, mapPatternToTechniqueId } from "@/lib/techniques";
import { getRemediationById, pickRemediation } from "@/lib/remediation";
import { chooseSupportPlan, type SupportPlan } from "@/lib/support-plan";
import type { TechniqueSkillVector } from "@/lib/skill-vector";
import type { ScaffoldLevel } from "@/lib/scaffold";
import { masteryGradeFor, type StudyTask } from "@/lib/study-plan";

type TodayTask = StudyTask & { status: "pending" | "done" | "skipped" };

const TASK_TYPE_LABEL: Record<StudyTask["type"], string> = {
  learn: "Learn",
  practice: "Practice",
  recall: "Recall",
  review: "Review"
};

type TodayResponse = {
  plan: {
    headline: string;
    rationale: string;
    totalWeeks: number;
    dailyMinutes: number;
    totalDays: number;
    coachStyle: "beginner" | "guided" | "optional";
  };
  today: {
    dayNumber: number;
    weekNumber: number;
    patternLabel: string;
    studyMode: "learn" | "recognize" | "practice" | "review";
    problems: Array<{ id: string; title: string; difficulty: string; reps: number }>;
  };
  streak: number;
  checkins: string[];
  session: DailySession;
  todayTasks: TodayTask[];
  todaySkills?: TechniqueSkillVector;
  todaySupport?: {
    recentScaffoldLevel?: number;
    recentOutcomeWasSolid?: boolean;
    recentFailureAfterPriorMastery: boolean;
  };
};

const STORAGE_PREFIX = "patternlift-session-";
const STEPS_STORAGE_PREFIX = "patternlift-session-steps-";

function lastFourteenDays() {
  const days: string[] = [];
  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

function techniqueFor(patternId?: string) {
  if (!patternId) return null;
  const id = mapPatternToTechniqueId(patternId);
  return id ? getTechniqueById(id) : null;
}

function readCompletedSteps(dayNumber: number): string[] {
  try {
    const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${dayNumber}`);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCompletedSteps(dayNumber: number, ids: string[]) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${dayNumber}`, JSON.stringify(ids));
  } catch {
    // localStorage unavailable - progress just won't survive a refresh, not fatal.
  }
}

// Steps are persisted separately from completedStepIds, because V2.3
// branching can INSERT steps (remediation + retry) that didn't exist in
// the server-planned session - without this, a refresh mid-remediation
// would silently drop the branch and jump back to the original plan.
function readSteps(dayNumber: number): SessionStep[] | null {
  try {
    const saved = window.localStorage.getItem(`${STEPS_STORAGE_PREFIX}${dayNumber}`);
    return saved ? (JSON.parse(saved) as SessionStep[]) : null;
  } catch {
    return null;
  }
}

function saveSteps(dayNumber: number, steps: SessionStep[]) {
  try {
    window.localStorage.setItem(`${STEPS_STORAGE_PREFIX}${dayNumber}`, JSON.stringify(steps));
  } catch {
    // Not fatal - branch just won't survive a refresh.
  }
}

function pickFreshProblemId(usedProblemIds: string[], todayProblems: TodayResponse["today"]["problems"]) {
  const fresh = todayProblems.find((problem) => !usedProblemIds.includes(problem.id));
  return fresh ?? null;
}

// Fire-and-forget - a synthesized legacy task's id won't match any row
// (no-op server-side), and a failed request just means the checklist's
// "done" state stays client-derived for that task, not a broken UI.
function markTaskDone(taskId: string) {
  void fetch(`/api/study-tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "done" })
  }).catch(() => {});
}

export function SessionRunner() {
  const { addAttempt } = usePatternLiftState();
  const [data, setData] = useState<TodayResponse | null>(null);
  const [notScheduled, setNotScheduled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [steps, setSteps] = useState<SessionStep[]>([]);
  const [lastDebugInfo, setLastDebugInfo] = useState<Record<string, unknown> | null>(null);
  // Study Plan Phase 1: mastery grade per problemId, shown on the checklist
  // once that problem's attempt is submitted. Core tasks' done state is
  // derived from completedStepIds/steps below (the existing step flow is
  // still what actually runs them); this only tracks the grade + which
  // task ids have already been PATCHed done, and which Bonus task (if any)
  // is currently open.
  const [taskGrades, setTaskGrades] = useState<Record<string, 0 | 1 | 2 | 3>>({});
  const [patchedTaskIds, setPatchedTaskIds] = useState<string[]>([]);
  const [bonusRevealed, setBonusRevealed] = useState(false);
  const [activeBonusTaskId, setActiveBonusTaskId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/today")
      .then(async (response) => {
        if (response.status === 404) {
          if (!cancelled) setNotScheduled(true);
          return null;
        }
        if (!response.ok) throw new Error("Unable to load today's plan.");
        return (await response.json()) as TodayResponse;
      })
      .then((payload) => {
        if (cancelled || !payload) return;
        setData(payload);
        setCompletedStepIds(readCompletedSteps(payload.today.dayNumber));
        const savedSteps = readSteps(payload.today.dayNumber);
        setSteps(savedSteps && savedSteps.length > 0 ? savedSteps : payload.session.steps);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A Core task is "done" once any completed step in the existing flow
  // ran that same problemId - the task checklist is a summary view over
  // the real step flow, not a second execution path. PATCH each newly-done
  // task exactly once (patchedTaskIds guards re-firing on every render).
  useEffect(() => {
    if (!data) return;
    const coreTasks = data.todayTasks.filter((task) => task.bucket === "core" && task.problemId);
    const newlyDone = coreTasks.filter(
      (task) =>
        !patchedTaskIds.includes(task.id) &&
        completedStepIds.some((stepId) => {
          const step = steps.find((entry) => entry.id === stepId);
          return step?.problemId === task.problemId;
        })
    );
    if (newlyDone.length === 0) return;
    newlyDone.forEach((task) => markTaskDone(task.id));
    setPatchedTaskIds((current) => [...current, ...newlyDone.map((task) => task.id)]);
  }, [data, completedStepIds, steps, patchedTaskIds]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (notScheduled) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-black/60">
          No active study plan yet.{" "}
          <Link href="/onboarding" className="font-semibold text-indigo-600">
            Build your plan
          </Link>{" "}
          to get a daily session.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="mx-auto max-w-2xl py-16 text-center text-sm text-black/40">Loading today&apos;s session…</div>;
  }

  const dayNumber = data.today.dayNumber;

  const markStepComplete = (stepId: string) => {
    setCompletedStepIds((current) => {
      if (current.includes(stepId)) return current;
      const next = [...current, stepId];
      saveCompletedSteps(dayNumber, next);
      return next;
    });
  };

  const insertBranch = (originalStep: SessionStep, branchSteps: SessionStep[]) => {
    setSteps((current) => {
      const index = current.findIndex((step) => step.id === originalStep.id);
      if (index === -1) return current;
      const next = [...current.slice(0, index + 1), ...branchSteps, ...current.slice(index + 1)];
      saveSteps(dayNumber, next);
      return next;
    });
  };

  // V2.3 dynamic branching entry point - called after a problem step's
  // attempt is recorded, before the step is marked complete. Deterministic
  // and bounded: a step that's already a retry (retryOfStepId set) never
  // branches again, capping remediation at one cycle per original step.
  const handleAttemptForStep = (step: SessionStep, result: AttemptResult) => {
    addAttempt(result);

    if (result.problemId) {
      const grade = masteryGradeFor({
        recognizedCorrectly: result.selectedPatternLabel === result.correctPatternLabel,
        outcome: result.outcome,
        highestHintLevel: result.highestHintLevel
      });
      setTaskGrades((current) => ({ ...current, [result.problemId]: grade }));
    }

    const failureType = result.diagnosis?.primaryFailure;
    const alreadyRetried = Boolean(step.retryOfStepId);
    // Refreshing right after a submission resets PracticeWorkspace's own
    // local "submitted" state (it isn't persisted), so a learner can end
    // up clicking Submit a second time for the same step. Without this
    // guard, that would insert a SECOND Repair+Retry pair - this makes
    // the branch insertion idempotent per original step.
    const alreadyBranched = steps.some((entry) => entry.id.startsWith(`${step.id}-remediation-`));

    if (failureType && !alreadyRetried && !alreadyBranched) {
      const techniqueId = mapPatternToTechniqueId(step.patternId ?? null);
      const activity = pickRemediation(techniqueId, failureType);

      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[remediation branch]", {
          step: step.id,
          failureType,
          techniqueId,
          activityId: activity?.id ?? null
        });
      }

      if (activity) {
        const usedProblemIds = steps.map((entry) => entry.problemId).filter((id): id is string => Boolean(id));
        const freshProblem =
          activity.nextAction === "fresh_problem" ? pickFreshProblemId(usedProblemIds, data.today.problems) : null;
        const supportPlan = chooseSupportPlan({
          skills: data.todaySkills,
          defaultCoachStyle: step.coachStyle ?? data.plan.coachStyle,
          recentScaffoldLevel: data.todaySupport?.recentScaffoldLevel as ScaffoldLevel | undefined,
          recentOutcomeWasSolid: data.todaySupport?.recentOutcomeWasSolid,
          recentFailureAfterPriorMastery: data.todaySupport?.recentFailureAfterPriorMastery
        });
        const branch = buildRemediationBranch({
          originalStep: step,
          activity,
          supportPlan,
          freshProblemId: freshProblem?.id,
          freshProblemTitle: freshProblem?.title
        });
        insertBranch(step, branch);
      }
    }

    setLastDebugInfo({
      step: step.id,
      diagnosis: result.diagnosis,
      highestHintLevel: result.highestHintLevel,
      scaffoldLevel: result.scaffoldLevel
    });

    // V2.3.1: submitting no longer silently advances the session - the
    // step is only marked complete once the learner clicks Continue on
    // the post-submission result card (PracticeWorkspace's onComplete).
    // Any remediation branch above is already queued by the time that
    // happens, so Continue naturally lands on the Repair step next.
  };

  const activeStep = steps.find((step) => !completedStepIds.includes(step.id)) ?? null;
  const allDone = steps.length > 0 && !activeStep;

  const coreTasks = data.todayTasks.filter((task) => task.bucket === "core");
  const bonusTasks = data.todayTasks.filter((task) => task.bucket === "bonus");
  const isTaskDone = (task: TodayTask) =>
    task.status === "done" ||
    (task.problemId
      ? completedStepIds.some((stepId) => steps.find((entry) => entry.id === stepId)?.problemId === task.problemId)
      : allDone);
  const coreDoneCount = coreTasks.filter(isTaskDone).length;
  const coreMinutes = coreTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const bonusMinutes = bonusTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const activeBonusTask = bonusTasks.find((task) => task.id === activeBonusTaskId) ?? null;

  return (
    <div className="grid gap-5">
      {coreTasks.length > 0 ? (
        <TaskChecklist
          coreTasks={coreTasks}
          bonusTasks={bonusTasks}
          coreDoneCount={coreDoneCount}
          coreMinutes={coreMinutes}
          bonusMinutes={bonusMinutes}
          isTaskDone={isTaskDone}
          taskGrades={taskGrades}
          bonusRevealed={bonusRevealed}
          onRevealBonus={() => setBonusRevealed(true)}
          onStartBonus={(taskId) => setActiveBonusTaskId(taskId)}
        />
      ) : null}

      {activeBonusTask ? (
        <BonusTaskRunner
          task={activeBonusTask}
          data={data}
          onGrade={(problemId, grade) => setTaskGrades((current) => ({ ...current, [problemId]: grade }))}
          onAttempt={addAttempt}
          onDone={() => {
            markTaskDone(activeBonusTask.id);
            setActiveBonusTaskId(null);
          }}
          onExit={() => setActiveBonusTaskId(null)}
        />
      ) : (
      <>
      <div className="uiverse-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/50">
              Day {data.today.dayNumber} of {data.plan.totalDays} · Week {data.today.weekNumber}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-ink">
              {steps.length > 0 ? `Your session` : "Nothing scheduled today"}
            </h1>
            <p className="mt-1 text-sm text-black/50">{data.session.headline}</p>
          </div>
          <Link href="/progress" className="shrink-0 text-xs font-medium text-black/45 transition hover:text-ink">
            {data.streak} day streak
          </Link>
        </div>
        {steps.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {steps.map((step, index) => {
              const done = completedStepIds.includes(step.id);
              const active = activeStep?.id === step.id;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    done
                      ? "bg-emerald-50 text-emerald-700"
                      : active
                        ? "bg-ink text-white"
                        : step.retryOfStepId || step.type === "remediation"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-mist text-black/45"
                  }`}
                >
                  <span>{done ? "✓" : index + 1}</span>
                  <span>{stepShortLabel(step)}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {steps.length === 0 ? (
        <div className="uiverse-panel p-8 text-center text-sm text-black/60">
          Nothing scheduled today - a good day to browse the{" "}
          <Link href="/roadmap" className="font-semibold text-indigo-600">
            Roadmap
          </Link>{" "}
          instead.
        </div>
      ) : allDone ? (
        <div className="uiverse-panel p-8 text-center">
          <p className="text-lg font-semibold text-ink">Nice work - today&apos;s session is done.</p>
          <p className="mt-2 text-sm text-black/60">Come back tomorrow for the next step, or keep practicing if you&apos;re not done for the day.</p>
          <Link
            href="/start"
            className="mt-4 inline-flex rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
          >
            Practice something else →
          </Link>
        </div>
      ) : activeStep ? (
        <StepRenderer
          step={activeStep}
          steps={steps}
          data={data}
          onComplete={() => markStepComplete(activeStep.id)}
          onAttempt={(result) => handleAttemptForStep(activeStep, result)}
        />
      ) : null}
      </>
      )}

      {process.env.NODE_ENV !== "production" && lastDebugInfo ? <DevDebugPanel info={lastDebugInfo} /> : null}

      <details className="uiverse-panel p-4 text-sm text-black/60">
        <summary className="cursor-pointer select-none font-medium text-black/50">
          Streak & plan details
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="grid grid-cols-7 gap-1">
            {lastFourteenDays().map((day) => (
              <div
                key={day}
                className={`h-3 w-3 rounded-[3px] ${data.checkins.includes(day) ? "bg-cyan-400" : "bg-black/8"}`}
              />
            ))}
          </div>
          <p className="leading-6">{data.plan.rationale}</p>
        </div>
      </details>
    </div>
  );
}

function DevDebugPanel({ info }: { info: Record<string, unknown> }) {
  return (
    <details className="uiverse-panel p-4 text-xs text-black/60">
      <summary className="cursor-pointer select-none font-medium text-black/50">
        Dev: last diagnosis / support plan
      </summary>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-mist p-3 text-[11px] leading-5">
        {JSON.stringify(info, null, 2)}
      </pre>
    </details>
  );
}

function formatMinutes(minutes: number) {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

const PRIORITY_DOT: Record<StudyTask["priority"], string> = {
  A: "bg-indigo-500",
  B: "bg-sky-400",
  C: "bg-black/25"
};

function TaskRow({
  task,
  done,
  grade,
  onStart
}: {
  task: TodayTask;
  done: boolean;
  grade?: 0 | 1 | 2 | 3;
  onStart?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
        done ? "border-emerald-200 bg-emerald-50/60" : "border-black/8 bg-white"
      }`}
    >
      <span
        className={`h-2 w-2 flex-none rounded-full ${PRIORITY_DOT[task.priority]}`}
        aria-hidden="true"
        title={`Priority ${task.priority}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/50">
            {TASK_TYPE_LABEL[task.type]}
          </span>
          <span className={`truncate text-sm font-medium ${done ? "text-black/45 line-through" : "text-ink"}`}>
            {task.title}
          </span>
        </div>
      </div>
      <span className="flex-none text-xs font-medium text-black/40">{formatMinutes(task.estimatedMinutes)}</span>
      {done ? (
        typeof grade === "number" ? (
          <span className="flex-none rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            {grade}/3
          </span>
        ) : (
          <span className="flex-none text-emerald-600" aria-hidden="true">✓</span>
        )
      ) : onStart ? (
        <button
          type="button"
          onClick={onStart}
          className="flex-none rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:border-black/24"
        >
          Start
        </button>
      ) : null}
    </div>
  );
}

function TaskChecklist({
  coreTasks,
  bonusTasks,
  coreDoneCount,
  coreMinutes,
  bonusMinutes,
  isTaskDone,
  taskGrades,
  bonusRevealed,
  onRevealBonus,
  onStartBonus
}: {
  coreTasks: TodayTask[];
  bonusTasks: TodayTask[];
  coreDoneCount: number;
  coreMinutes: number;
  bonusMinutes: number;
  isTaskDone: (task: TodayTask) => boolean;
  taskGrades: Record<string, 0 | 1 | 2 | 3>;
  bonusRevealed: boolean;
  onRevealBonus: () => void;
  onStartBonus: (taskId: string) => void;
}) {
  return (
    <div className="uiverse-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ember">Today&apos;s Core</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{formatMinutes(coreMinutes)}</h2>
        </div>
        <span className="text-xs font-medium text-black/45">
          {coreDoneCount} / {coreTasks.length} done
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {coreTasks.map((task) => (
          <TaskRow key={task.id} task={task} done={isTaskDone(task)} grade={task.problemId ? taskGrades[task.problemId] : undefined} />
        ))}
      </div>

      {bonusTasks.length > 0 ? (
        bonusRevealed ? (
          <div className="mt-4 border-t border-black/8 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
              Bonus if you have time — {formatMinutes(bonusMinutes)}
            </p>
            <div className="mt-3 grid gap-2">
              {bonusTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  done={isTaskDone(task)}
                  grade={task.problemId ? taskGrades[task.problemId] : undefined}
                  onStart={() => onStartBonus(task.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRevealBonus}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600"
          >
            + Continue studying
          </button>
        )
      ) : null}
    </div>
  );
}

function BonusTaskRunner({
  task,
  data,
  onGrade,
  onAttempt,
  onDone,
  onExit
}: {
  task: TodayTask;
  data: TodayResponse;
  onGrade: (problemId: string, grade: 0 | 1 | 2 | 3) => void;
  onAttempt: (result: AttemptResult) => void;
  onDone: () => void;
  onExit: () => void;
}) {
  const supportPlan = useMemo(
    () =>
      chooseSupportPlan({
        skills: data.todaySkills,
        defaultCoachStyle: data.plan.coachStyle,
        recentScaffoldLevel: data.todaySupport?.recentScaffoldLevel as ScaffoldLevel | undefined,
        recentOutcomeWasSolid: data.todaySupport?.recentOutcomeWasSolid,
        recentFailureAfterPriorMastery: data.todaySupport?.recentFailureAfterPriorMastery
      }),
    [data]
  );

  if (!task.problemId) return null;

  return (
    <div className="grid gap-3">
      <div className="uiverse-panel flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ember">
            Bonus · {TASK_TYPE_LABEL[task.type]}
          </p>
          <p className="mt-1 text-sm text-black/60">Extra practice - optional, no pressure.</p>
        </div>
        <button type="button" onClick={onExit} className="text-xs font-medium text-black/45 hover:text-ink">
          ← Back to today
        </button>
      </div>
      <PracticeWorkspace
        key={`bonus-${task.id}-${task.problemId}`}
        initialProblemId={task.problemId}
        mode="practice"
        coachStyle={supportPlan.coachStyle}
        scaffoldLevel={supportPlan.scaffoldLevel}
        maxHintLevel={supportPlan.maxHintLevel}
        onAttempt={(result) => {
          onAttempt(result);
          if (result.problemId) {
            onGrade(
              result.problemId,
              masteryGradeFor({
                recognizedCorrectly: result.selectedPatternLabel === result.correctPatternLabel,
                outcome: result.outcome,
                highestHintLevel: result.highestHintLevel
              })
            );
          }
        }}
        onComplete={onDone}
      />
    </div>
  );
}

function stepShortLabel(step: SessionStep) {
  if (step.retryOfStepId) return "Retry";
  switch (step.type) {
    case "recall":
      return "Recall";
    case "learn":
      return "Learn";
    case "guided_problem":
      return "Guided";
    case "contrast":
      return "Contrast";
    case "independent_problem":
      return "On your own";
    case "reflection":
      return "Reflect";
    case "remediation":
      return "Repair";
  }
}

function StepRenderer({
  step,
  steps,
  data,
  onComplete,
  onAttempt
}: {
  step: SessionStep;
  steps: SessionStep[];
  data: TodayResponse;
  onComplete: () => void;
  onAttempt: (result: AttemptResult) => void;
}) {
  const supportPlan: SupportPlan | undefined = useMemo(() => {
    if (step.type !== "recall" && step.type !== "guided_problem" && step.type !== "independent_problem") {
      return undefined;
    }
    if (step.supportPlan) return step.supportPlan;
    return chooseSupportPlan({
      skills: data.todaySkills,
      defaultCoachStyle: step.coachStyle ?? data.plan.coachStyle,
      recentScaffoldLevel: data.todaySupport?.recentScaffoldLevel as ScaffoldLevel | undefined,
      recentOutcomeWasSolid: data.todaySupport?.recentOutcomeWasSolid,
      recentFailureAfterPriorMastery: data.todaySupport?.recentFailureAfterPriorMastery
    });
  }, [step, data.todaySkills, data.todaySupport, data.plan.coachStyle]);

  // What the primary button says after submission - "Continue to Repair",
  // "Continue to Contrast" - so the learner understands WHY the session
  // is about to change, per V2.3.1's "never look like it randomly changed."
  const continueLabel = useMemo(() => {
    const index = steps.findIndex((entry) => entry.id === step.id);
    const next = index >= 0 ? steps[index + 1] : undefined;
    return next ? `Continue to ${stepShortLabel(next)}` : "Continue";
  }, [steps, step.id]);

  if (step.type === "recall" || step.type === "guided_problem" || step.type === "independent_problem") {
    if (!step.problemId) return null;
    const mode = step.type === "recall" ? "recognize" : "practice";
    return (
      <div className="grid gap-3">
        <SessionStepIntro step={step} />
        <StepPrompt step={step} />
        <PracticeWorkspace
          key={`${step.id}-${step.problemId}`}
          initialProblemId={step.problemId}
          mode={mode}
          coachStyle={supportPlan?.coachStyle ?? step.coachStyle}
          scaffoldLevel={supportPlan?.scaffoldLevel}
          maxHintLevel={supportPlan?.maxHintLevel}
          isRetryAfterRemediation={Boolean(step.retryOfStepId)}
          continueLabel={continueLabel}
          onAttempt={onAttempt}
          onComplete={onComplete}
        />
      </div>
    );
  }

  if (step.type === "learn") {
    return <LearnStep step={step} onComplete={onComplete} />;
  }

  if (step.type === "contrast") {
    return <ContrastStep step={step} onComplete={onComplete} />;
  }

  if (step.type === "remediation") {
    const activity = step.remediationId ? getRemediationById(step.remediationId) : null;
    if (!activity) return null;
    return (
      <RemediationStepView
        activity={activity}
        onComplete={() => onComplete()}
        onSkip={onComplete}
      />
    );
  }

  return <ReflectionStep step={step} onComplete={onComplete} />;
}

function StepPrompt({ step }: { step: SessionStep }) {
  if (!step.prompt) return null;
  return (
    <div className="uiverse-panel p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ember">{stepShortLabel(step)}</p>
      <p className="mt-1 text-sm leading-6 text-black/72">{step.prompt}</p>
    </div>
  );
}

function LearnStep({ step, onComplete }: { step: SessionStep; onComplete: () => void }) {
  const technique = techniqueFor(step.patternId);
  const patternOption = patternOptions.find((option) => option.id === step.patternId);

  return (
    <div className="uiverse-panel p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-ember">Learn</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{step.patternLabel}</h2>
      {technique ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-black/72">
          <p>
            <span className="font-semibold text-ink">When to think of it: </span>
            {technique.whenToThink}
          </p>
          <p>
            <span className="font-semibold text-ink">Core idea: </span>
            {technique.coreIdea}
          </p>
          <p>
            <span className="font-semibold text-ink">Starter question: </span>
            {technique.starterQuestion}
          </p>
        </div>
      ) : patternOption ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-black/72">
          <p>{patternOption.coachPrompt}</p>
          <ul className="list-disc space-y-1 pl-5">
            {patternOption.firstSteps.map((firstStep) => (
              <li key={firstStep}>{firstStep}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onComplete}
        className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
      >
        Continue →
      </button>
    </div>
  );
}

function ContrastStep({ step, onComplete }: { step: SessionStep; onComplete: () => void }) {
  const [choice, setChoice] = useState<"target" | "contrast" | null>(null);
  const targetTechnique = techniqueFor(step.patternId);
  const contrastTechnique = techniqueFor(step.contrastPatternId);
  const clue = patternOptions.find((option) => option.id === step.patternId)?.clues[0];

  return (
    <div className="uiverse-panel p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-ember">Contrast</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">
        {step.patternLabel} or {step.contrastPatternLabel}?
      </h2>
      {clue ? <p className="mt-2 text-sm text-black/60">When you see: &ldquo;{clue}&rdquo;</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setChoice("target")}
          disabled={choice !== null}
          className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-100 ${
            choice === "target"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : choice
                ? "border-black/10 bg-mist text-black/40"
                : "border-black/10 bg-mist text-black/72 hover:border-black/24"
          }`}
        >
          {step.patternLabel}
        </button>
        <button
          type="button"
          onClick={() => setChoice("contrast")}
          disabled={choice !== null}
          className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-100 ${
            choice === "contrast"
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : choice
                ? "border-black/10 bg-mist text-black/40"
                : "border-black/10 bg-mist text-black/72 hover:border-black/24"
          }`}
        >
          {step.contrastPatternLabel}
        </button>
      </div>

      {choice ? (
        <div className="mt-4 rounded-2xl bg-mist p-4 text-sm leading-6 text-black/72">
          <p className="font-semibold text-ink">
            {choice === "target" ? "Right - here's why:" : `Actually, today's focus is ${step.patternLabel}:`}
          </p>
          <p className="mt-1">{targetTechnique?.coreIdea}</p>
          {contrastTechnique ? (
            <>
              <p className="mt-3 font-semibold text-ink">For contrast, {step.contrastPatternLabel}:</p>
              <p className="mt-1">{contrastTechnique.coreIdea}</p>
            </>
          ) : null}
        </div>
      ) : null}

      {choice ? (
        <button
          type="button"
          onClick={onComplete}
          className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
        >
          Continue →
        </button>
      ) : null}
    </div>
  );
}

function ReflectionStep({ step, onComplete }: { step: SessionStep; onComplete: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="uiverse-panel p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-ember">Reflection</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{step.prompt}</h2>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        placeholder="Type a couple sentences..."
        className="mt-4 w-full rounded-2xl border border-black/10 bg-white p-4 text-sm text-ink outline-none focus:border-black/24"
      />
      <button
        type="button"
        onClick={onComplete}
        disabled={text.trim().length === 0}
        className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-40"
      >
        Continue →
      </button>
    </div>
  );
}
