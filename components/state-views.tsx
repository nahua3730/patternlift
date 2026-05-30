"use client";

import { PracticeWorkspace } from "@/components/practice-workspace";
import { ProgressPanel } from "@/components/progress-panel";
import { ReviewQueue } from "@/components/review-queue";
import { TechniqueLibrary } from "@/components/technique-library";
import { usePatternLiftState } from "@/components/patternlift-state";

export function DashboardView() {
  const {
    latestAttempt,
    reviewCount,
    solidAttempts,
    todayPlan,
    totalAttempts
  } = usePatternLiftState();

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-ember">
            Dashboard
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Practice a problem, tighten the pattern match, and bring weak edges
            back into review.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-black/72">
            PatternLift works best when the workflow is simple: attempt, coach,
            review, repeat.
          </p>
        </div>

        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-lake">
            Today
          </p>
          <div className="mt-4 space-y-3">
            {todayPlan.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-black/10 bg-mist p-4 text-sm leading-6 text-black/72"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Attempts" value={String(totalAttempts)} />
        <DashboardStat label="Strong Matches" value={String(solidAttempts)} />
        <DashboardStat label="Review Queue" value={String(reviewCount)} />
        <DashboardStat
          label="Latest Score"
          value={latestAttempt ? String(latestAttempt.score) : "--"}
        />
      </section>
    </div>
  );
}

export function PracticePageView() {
  const { addAttempt } = usePatternLiftState();
  return <PracticeWorkspace onComplete={addAttempt} />;
}

export function ProgressPageView() {
  const {
    currentStreak,
    history,
    reviewCount,
    solidAttempts,
    totalAttempts
  } = usePatternLiftState();

  return (
    <ProgressPanel
      totalAttempts={totalAttempts}
      solidAttempts={solidAttempts}
      reviewCount={reviewCount}
      currentStreak={currentStreak}
      history={history}
    />
  );
}

export function ReviewPageView() {
  const { reviewQueue } = usePatternLiftState();
  return <ReviewQueue items={reviewQueue} />;
}

export function TechniquesPageView() {
  return <TechniqueLibrary />;
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="uiverse-panel p-5">
      <p className="text-sm text-black/62">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
