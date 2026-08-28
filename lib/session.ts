import type { CoachStyle, CurriculumDay } from "@/lib/curriculum-agent";
import { allProblems, patternOptions } from "@/lib/product";
import type { TechniqueSkillVector, DimensionScore } from "@/lib/skill-vector";
import type { ConfusionPair } from "@/lib/mastery";

// What the session orchestrator knows about the learner's standing on
// TODAY's pattern - optional, so callers without this data (or patterns
// with zero evidence) get the same composition as before.
export type SessionLearnerContext = {
  skills?: TechniqueSkillVector;
  dominantConfusion?: ConfusionPair | null;
};

const WEAK_THRESHOLD = 60;
const STRONG_THRESHOLD = 70;

// Only treat a dimension as "weak" when there's real evidence behind it -
// a fresh pattern with zero attempts isn't weak, it's just unknown.
function isWeak(dimension?: DimensionScore) {
  return Boolean(dimension) && dimension!.evidenceCount > 0 && dimension!.score < WEAK_THRESHOLD;
}

function isStrong(dimension?: DimensionScore) {
  return Boolean(dimension) && dimension!.evidenceCount > 0 && dimension!.score >= STRONG_THRESHOLD;
}

function atLeastGuided(style: CoachStyle): CoachStyle {
  return style === "optional" ? "guided" : style;
}

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

export function buildDailySession(
  day: CurriculumDay,
  dueReviews: DueReviewInput[],
  coachStyle: CoachStyle,
  learner?: SessionLearnerContext
): DailySession {
  const steps: SessionStep[] = [];
  const patternLabel = day.patternLabel || patternLabelFor(day.patternId);
  const [primaryProblemId, secondaryProblemId] = day.problemIds;
  const contrast = contrastFor(primaryProblemId);

  const skills = learner?.skills;
  const weakRecognition = isWeak(skills?.recognition);
  const weakReasoning = isWeak(skills?.reasoning);
  const weakImplementation = isWeak(skills?.implementation);
  const weakIndependence = isWeak(skills?.independence);
  const weakRetention = isWeak(skills?.retention);
  const strongRecognition = isStrong(skills?.recognition);
  const hasDominantConfusion = Boolean(learner?.dominantConfusion);
  // Weak reasoning means the learner needs more support, not less - don't
  // let an independent/optional-coaching step go out under-supported.
  const effectiveCoachStyle = weakReasoning ? atLeastGuided(coachStyle) : coachStyle;

  // Forgetting is the priority signal when it's flagged: recall a review
  // for THIS pattern specifically over an unrelated one that happens to be
  // due, since that's the more urgent gap right now.
  const priorityReview = weakRetention
    ? dueReviews.find((review) => review.problemId && review.patternLabel === patternLabel)
    : undefined;
  const firstDueReview = priorityReview ?? dueReviews.find((review) => review.problemId);
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

  // Strong recognition but weak implementation means the gap is turning
  // the plan into working code, not identifying the pattern - point the
  // independent rep at that specifically rather than a generic repeat.
  const implementationFocus = strongRecognition && weakImplementation;

  const pushIndependent = (minutes: number) => {
    if (!secondaryProblemId) return;
    const baseTitle = `On your own: ${problemTitleFor(secondaryProblemId) ?? "Problem"}`;
    steps.push({
      id: "independent",
      type: "independent_problem",
      title: implementationFocus ? `${baseTitle} (focus: working code, not just the pattern)` : baseTitle,
      estimatedMinutes: implementationFocus ? minutes + 3 : minutes,
      problemId: secondaryProblemId,
      problemTitle: problemTitleFor(secondaryProblemId),
      patternId: day.patternId ?? undefined,
      patternLabel,
      // Independent steps stay minimal-coaching by design (support fades on
      // purpose) - weak independence means this rep matters even more, not
      // that it should get more help.
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
        coachStyle: effectiveCoachStyle
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
        coachStyle: effectiveCoachStyle
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
        coachStyle: effectiveCoachStyle
      });
    }
    // "practice" mode doesn't normally include a contrast step, but a
    // recognition weakness or a recurring mix-up on this pattern is
    // exactly what contrast steps are for - surface one anyway.
    if (weakRecognition || hasDominantConfusion) pushContrast();
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
    // This fallback day has no independent step by default, but weak
    // independence is exactly the case where a lower-assistance retry
    // matters most - add one if there's a problem to attach it to.
    if (weakIndependence) pushIndependent(8);
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
