"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PracticeWorkspace, type AttemptResult } from "@/components/practice-workspace";
import { RemediationStepView } from "@/components/remediation-step";
import { usePatternLiftState } from "@/components/patternlift-state";
import { patternOptions } from "@/lib/product";
import type { DailySession, SessionStep } from "@/lib/session";
import { buildRemediationBranch } from "@/lib/session";
import { getTechniqueById, mapPatternToTechniqueId } from "@/lib/techniques";
import { getRemediationById, pickRemediation } from "@/lib/remediation";
import { chooseSupportPlan, type SupportPlan } from "@/lib/support-plan";
import type { TechniqueSkillVector } from "@/lib/skill-vector";
import type { ScaffoldLevel } from "@/lib/scaffold";

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

export function SessionRunner() {
  const { addAttempt } = usePatternLiftState();
  const [data, setData] = useState<TodayResponse | null>(null);
  const [notScheduled, setNotScheduled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [steps, setSteps] = useState<SessionStep[]>([]);
  const [lastDebugInfo, setLastDebugInfo] = useState<Record<string, unknown> | null>(null);

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

    const failureType = result.diagnosis?.primaryFailure;
    const alreadyRetried = Boolean(step.retryOfStepId);

    if (failureType && !alreadyRetried) {
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

    markStepComplete(step.id);
  };

  const activeStep = steps.find((step) => !completedStepIds.includes(step.id)) ?? null;
  const allDone = steps.length > 0 && !activeStep;

  return (
    <div className="grid gap-5">
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
          data={data}
          onComplete={() => markStepComplete(activeStep.id)}
          onAttempt={(result) => handleAttemptForStep(activeStep, result)}
        />
      ) : null}

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

function stepShortLabel(step: SessionStep) {
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
  data,
  onComplete,
  onAttempt
}: {
  step: SessionStep;
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

  if (step.type === "recall" || step.type === "guided_problem" || step.type === "independent_problem") {
    if (!step.problemId) return null;
    const mode = step.type === "recall" ? "recognize" : "practice";
    return (
      <div className="grid gap-3">
        <StepPrompt step={step} />
        <PracticeWorkspace
          key={`${step.id}-${step.problemId}`}
          initialProblemId={step.problemId}
          mode={mode}
          coachStyle={supportPlan?.coachStyle ?? step.coachStyle}
          scaffoldLevel={supportPlan?.scaffoldLevel}
          maxHintLevel={supportPlan?.maxHintLevel}
          isRetryAfterRemediation={Boolean(step.retryOfStepId)}
          onComplete={(result) => {
            onAttempt(result);
            onComplete();
          }}
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
