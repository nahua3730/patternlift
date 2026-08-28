"use client";

import { PracticeWorkspace } from "@/components/practice-workspace";
import { ReviewQueue } from "@/components/review-queue";
import { TechniqueLibrary } from "@/components/technique-library";
import { usePatternLiftState } from "@/components/patternlift-state";

export function PracticePageView({
  initialProblemId,
  mode,
  coachStyle,
  selectedPatternIds,
  quickStart,
  guessPatternId,
  guessReason
}: {
  initialProblemId?: string;
  mode?: "learn" | "recognize" | "practice";
  coachStyle?: "beginner" | "guided" | "optional" | "off";
  selectedPatternIds?: string[];
  quickStart?: boolean;
  guessPatternId?: string;
  guessReason?: string;
}) {
  const { addAttempt } = usePatternLiftState();
  return (
    <PracticeWorkspace
      key={`${initialProblemId ?? "default"}-${mode ?? "learn"}-${coachStyle ?? "guided"}`}
      onAttempt={addAttempt}
      initialProblemId={initialProblemId}
      mode={mode}
      coachStyle={coachStyle}
      selectedPatternIds={selectedPatternIds}
      quickStart={quickStart}
      guessPatternId={guessPatternId}
      guessReason={guessReason}
    />
  );
}

export function ReviewPageView() {
  const { reviewQueue, history } = usePatternLiftState();
  return <ReviewQueue items={reviewQueue} history={history} />;
}

export function TechniquesPageView({ reps }: { reps: Record<string, number> }) {
  return <TechniqueLibrary reps={reps} />;
}
