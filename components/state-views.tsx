"use client";

import Link from "next/link";
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <HomeConversationBlock
        speaker="Coach"
        title="Welcome back. What do you want to work on today?"
      >
        <p className="text-sm leading-7 text-black/72">
          PatternLift is best when it feels like a steady study partner, not a
          dashboard. Start a fresh problem when you want to sharpen recognition,
          or jump back into review when you want to revisit weak edges.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/practice"
            className="uiverse-button px-5 py-3 text-sm font-medium"
          >
            Start a guided practice run
          </Link>
          <Link
            href="/review"
            className="uiverse-button-secondary px-5 py-3 text-sm font-medium"
          >
            Continue review
          </Link>
        </div>
      </HomeConversationBlock>

      <HomeConversationBlock
        speaker="Coach"
        title="Here is the rhythm I want you to keep."
      >
        <div className="space-y-3">
          <StepLine
            step="1"
            title="Pick one problem."
            body="Stay focused on a single prompt instead of bouncing between tabs and notes."
          />
          <StepLine
            step="2"
            title="Commit to a pattern."
            body="Say what you think it is and what clue pulled you there."
          />
          <StepLine
            step="3"
            title="Get nudged, not rescued."
            body="Use the coach, technique reminders, and review hooks to move forward without losing the thinking process."
          />
        </div>
      </HomeConversationBlock>

      <HomeConversationBlock
        speaker="Coach"
        title="Your current snapshot."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardStat label="Attempts" value={String(totalAttempts)} />
          <DashboardStat label="Strong Matches" value={String(solidAttempts)} />
          <DashboardStat label="Review Queue" value={String(reviewCount)} />
          <DashboardStat
            label="Latest Score"
            value={latestAttempt ? String(latestAttempt.score) : "--"}
          />
        </div>

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
      </HomeConversationBlock>
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
    <div className="rounded-lg border border-black/10 bg-mist p-5">
      <p className="text-sm text-black/62">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function HomeConversationBlock({
  speaker,
  title,
  children
}: {
  speaker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="uiverse-panel p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-semibold text-ink">
          {speaker.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-lake">
            {speaker}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function StepLine({
  step,
  title,
  body
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-mist p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-lake">Step {step}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-black/68">{body}</p>
    </div>
  );
}
