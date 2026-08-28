import type { CoachStyle, CurriculumDay } from "@/lib/curriculum-agent";
import { allProblems, patternOptions } from "@/lib/product";

export type SessionStepType =
  | "recall"
  | "learn"
  | "guided_problem"
  | "contrast"
  | "independent_problem"
  | "reflection";

export type SessionStep = {
  id: string;
  type: SessionStepType;
  title: string;
  estimatedMinutes: number;
  patternId?: string;
  patternLabel?: string;
  problemId?: string;
  problemTitle?: string;
  contrastPatternId?: string;
  contrastPatternLabel?: string;
  prompt?: string;
  // For guided_problem / independent_problem steps only - how much coaching
  // support this step gets. Independent steps deliberately use lighter
  // support than guided ones, even on the same day's coachStyle setting -
  // a seed for the future Code Fading system, not the full thing yet.
  coachStyle?: CoachStyle;
};

export type DailySession = {
  dayNumber: number;
  weekNumber: number;
  headline: string;
  estimatedMinutes: number;
  steps: SessionStep[];
};

export type DueReviewInput = {
  id: string;
  problemId?: string;
  problemTitle: string;
  patternLabel: string;
  reviewQuestion: string;
};

function patternLabelFor(patternId: string | null | undefined) {
  return patternOptions.find((option) => option.id === patternId)?.label ?? patternId ?? "This pattern";
}

function problemTitleFor(problemId: string) {
  return allProblems.find((problem) => problem.id === problemId)?.title;
}

function contrastFor(problemId: string | undefined) {
  const problem = problemId ? allProblems.find((entry) => entry.id === problemId) : undefined;
  if (!problem) return null;
  return { id: problem.contrastPatternId, label: patternLabelFor(problem.contrastPatternId) };
}

export function buildDailySession(day: CurriculumDay, dueReviews: DueReviewInput[], coachStyle: CoachStyle): DailySession {
  const steps: SessionStep[] = [];
  const patternLabel = day.patternLabel || patternLabelFor(day.patternId);
  const [primaryProblemId, secondaryProblemId] = day.problemIds;
  const contrast = contrastFor(primaryProblemId);

  const firstDueReview = dueReviews.find((review) => review.problemId);
  if (firstDueReview?.problemId) {
    steps.push({
      id: "recall",
      type: "recall",
      title: `Recall: ${firstDueReview.problemTitle}`,
      estimatedMinutes: 3,
      problemId: firstDueReview.problemId,
      problemTitle: firstDueReview.problemTitle,
      patternLabel: firstDueReview.patternLabel,
      prompt: firstDueReview.reviewQuestion,
      coachStyle: "guided"
    });
  }

  const pushContrast = () => {
    if (!contrast?.id) return;
    steps.push({
      id: "contrast",
      type: "contrast",
      title: `${patternLabel} or ${contrast.label}?`,
      estimatedMinutes: 4,
      patternId: day.patternId ?? undefined,
      patternLabel,
      contrastPatternId: contrast.id,
      contrastPatternLabel: contrast.label
    });
  };

  const pushIndependent = (minutes: number) => {
    if (!secondaryProblemId) return;
    steps.push({
      id: "independent",
      type: "independent_problem",
      title: `On your own: ${problemTitleFor(secondaryProblemId) ?? "Problem"}`,
      estimatedMinutes: minutes,
      problemId: secondaryProblemId,
      problemTitle: problemTitleFor(secondaryProblemId),
      patternId: day.patternId ?? undefined,
      patternLabel,
      coachStyle: "optional"
    });
  };

  if (day.studyMode === "learn") {
    steps.push({
      id: "learn",
      type: "learn",
      title: `Learn: ${patternLabel}`,
      estimatedMinutes: 5,
      patternId: day.patternId ?? undefined,
      patternLabel
    });
    if (primaryProblemId) {
      steps.push({
        id: "guided",
        type: "guided_problem",
        title: `Guided: ${problemTitleFor(primaryProblemId) ?? "Problem"}`,
        estimatedMinutes: 9,
        problemId: primaryProblemId,
        problemTitle: problemTitleFor(primaryProblemId),
        patternId: day.patternId ?? undefined,
        patternLabel,
        coachStyle
      });
    }
    pushContrast();
    pushIndependent(9);
    steps.push({
      id: "reflection",
      type: "reflection",
      title: "Explain it back",
      estimatedMinutes: 2,
      patternLabel,
      prompt: `Explain ${patternLabel} to someone who has never seen it, in 2-3 sentences.`
    });
  } else if (day.studyMode === "recognize") {
    if (primaryProblemId) {
      steps.push({
        id: "recognize",
        type: "guided_problem",
        title: `Recognize: ${problemTitleFor(primaryProblemId) ?? "Problem"}`,
        estimatedMinutes: 6,
        problemId: primaryProblemId,
        problemTitle: problemTitleFor(primaryProblemId),
        patternId: day.patternId ?? undefined,
        patternLabel,
        coachStyle
      });
    }
    pushContrast();
    pushIndependent(9);
  } else if (day.studyMode === "practice") {
    if (primaryProblemId) {
      steps.push({
        id: "guided",
        type: "guided_problem",
        title: `Warm-up: ${problemTitleFor(primaryProblemId) ?? "Problem"}`,
        estimatedMinutes: 8,
        problemId: primaryProblemId,
        problemTitle: problemTitleFor(primaryProblemId),
        patternId: day.patternId ?? undefined,
        patternLabel,
        coachStyle
      });
    }
    pushIndependent(10);
    steps.push({
      id: "reflection",
      type: "reflection",
      title: "Reflection",
      estimatedMinutes: 2,
      patternLabel,
      prompt: "What almost tripped you up today, and how did you catch it?"
    });
  } else {
    pushContrast();
    steps.push({
      id: "reflection",
      type: "reflection",
      title: "Reflection",
      estimatedMinutes: 2,
      patternLabel,
      prompt: "Which pattern from this week still feels shaky?"
    });
  }

  return {
    dayNumber: day.dayNumber,
    weekNumber: day.weekNumber,
    headline: patternLabel,
    estimatedMinutes: steps.reduce((sum, step) => sum + step.estimatedMinutes, 0),
    steps
  };
}
