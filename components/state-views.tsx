"use client";

import { PracticeWorkspace } from "@/components/practice-workspace";
import { ProgressPanel } from "@/components/progress-panel";
import { ReviewQueue } from "@/components/review-queue";
import { TechniqueLibrary } from "@/components/technique-library";
import { usePatternLiftState } from "@/components/patternlift-state";

export function PracticePageView({
  initialProblemId,
  mode,
  coachStyle
}: {
  initialProblemId?: string;
  mode?: "learn" | "recognize" | "practice";
  coachStyle?: "beginner" | "guided" | "optional" | "off";
}) {
  const { addAttempt } = usePatternLiftState();
  return (
    <PracticeWorkspace
      onComplete={addAttempt}
      initialProblemId={initialProblemId}
      mode={mode}
      coachStyle={coachStyle}
    />
  );
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
