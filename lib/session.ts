import type { CoachStyle, CurriculumDay } from "@/lib/curriculum-agent";
import { allProblems, patternOptions } from "@/lib/product";
import type { TechniqueSkillVector, DimensionScore } from "@/lib/skill-vector";
import type { ConfusionPair } from "@/lib/mastery";
import type { FailureCategory } from "@/lib/diagnosis";
import type { SupportPlan } from "@/lib/support-plan";
import type { StudyTask, LearnResource } from "@/lib/study-plan";

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
  | "reflection"
  | "remediation"
  // Phase 2A: the two Transfer-specific step types. blind_prediction is
  // DELIBERATELY minimal (see the SessionStep field comment below) - it
  // is the one step type whose object must never carry answer-adjacent
  // fields. transfer_result renders the recognition-vs-solve split after
  // the independent_problem solve (reused, no new step type needed for
  // solving itself) completes.
  | "blind_prediction"
  | "transfer_result"
  // Phase 2A.1: the only Transfer representation allowed in /api/today.
  // Post-prediction solve/remediation/result runtime is hydrated through a
  // task-scoped endpoint and never preconstructed in the daily payload.
  | "transfer_encounter";

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
  // support than guided ones, even on the same day's coachStyle setting.
  coachStyle?: CoachStyle;
  // V2.3: what this step is remediating, and with what. remediation steps
  // carry failureType + remediationId; a step produced as a retry after
  // remediation carries retryOfStepId so the branch logic never re-branches
  // off a retry (caps remediation at one cycle per original step).
  failureType?: FailureCategory;
  remediationId?: string;
  retryOfStepId?: string;
  supportPlan?: SupportPlan;
  // Study Plan Phase 1.1: which StudyTask (day.tasks[]) this step belongs
  // to, when the day was generated in the task-driven shape. This is the
  // deterministic link the UI uses to mark a task done - never inferred
  // from problemId, since the same problem can appear under different
  // task types (e.g. a future recall task revisiting a problem learned
  // earlier) and problemId matching would attribute the wrong step.
  studyTaskId?: string;
  // Pilot Foundation: a guided curriculum's topic ("Linked List"), display
  // ONLY, never mastery-bearing. When set, the "learn" step's heading
  // prefers this over patternLabel - an anchor problem's authoritative
  // pattern (e.g. "Two Pointers" for Reverse Linked List) stays correct
  // for technique content and mastery evidence, but must not evict the
  // curriculum topic as the primary thing the learner sees before they've
  // even reached that problem. Undefined for generated plans (unchanged
  // behavior - patternLabel is already the right heading there).
  curriculumContext?: string;
  // Pilot Foundation: present only on a "learn" step whose task carries a
  // guided-curriculum lesson. Rendering shows a resource link + explicit
  // "Mark complete" instead of (or alongside) the static pattern intro.
  learnResource?: LearnResource;
};

export type DailySession = {
  dayNumber: number;
  weekNumber: number;
  headline: string;
  estimatedMinutes: number;
  steps: SessionStep[];
};

// Phase 1.1 follow-up: session-runner.tsx persists completed-step ids and
// any inserted remediation branch in localStorage, keyed by this. It must
// include planRunId, not just dayNumber, so one account's Day 1 progress
// can never leak into another account's Day 1 (or into a newer plan the
// SAME account later re-generates) sharing the same browser. planRunId
// alone already uniquely identifies both the user and the specific
// accepted plan - each accepted run belongs to exactly one user - so no
// separate user id needs to be threaded through just for this.
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
  // Study Plan Phase 1.1: when a day carries Core StudyTasks, they are the
  // source of truth for today's work - every one of them must turn into an
  // executable step, not just the first two problemIds. Days without tasks
  // (legacy accepted plans, pre-Study-Plan) fall back to the original
  // primary/secondary composition below, byte-for-byte unchanged.
  const coreTasks = (day.tasks ?? []).filter((task) => task.bucket === "core");
  const usingTaskDrivenFlow = coreTasks.length > 0;
  const contrastAnchorProblemId = usingTaskDrivenFlow ? coreTasks[0]?.problemId ?? undefined : primaryProblemId;
  const contrast = contrastFor(contrastAnchorProblemId);

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
    // A guided day with no single day-level pattern (topic day covering
    // several patterns) has nothing coherent to contrast against - "Arrays
    // or Two Pointers?" isn't a real recognition question. Skip rather
    // than ask a broken one.
    if (!contrast?.id || !day.patternId) return;
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

  // Task-driven equivalent of pushIndependent - one step per StudyTask
  // instead of a single fixed "secondary" slot, so a 3rd/4th/5th Core task
  // gets a real, executable step instead of being silently dropped.
  const pushIndependentForTask = (task: StudyTask) => {
    if (!task.problemId) return;
    const taskPatternLabel = patternLabelFor(task.patternId);
    const baseTitle = `On your own: ${problemTitleFor(task.problemId) ?? task.title}`;
    steps.push({
      id: `independent-${task.id}`,
      type: "independent_problem",
      studyTaskId: task.id,
      title: implementationFocus ? `${baseTitle} (focus: working code, not just the pattern)` : baseTitle,
      estimatedMinutes: implementationFocus ? task.estimatedMinutes + 3 : task.estimatedMinutes,
      problemId: task.problemId,
      problemTitle: problemTitleFor(task.problemId),
      patternId: task.patternId ?? undefined,
      patternLabel: taskPatternLabel,
      coachStyle: "optional"
    });
  };

  const reflectionStep = (title: string, prompt: string, studyTaskId?: string): SessionStep => ({
    id: "reflection",
    type: "reflection",
    studyTaskId,
    title,
    estimatedMinutes: 2,
    patternLabel,
    prompt
  });

  // Phase 2A.1: /api/today receives exactly one opaque encounter step.
  // The browser cannot recover future solve/result answer metadata from a
  // step that has never been constructed or serialized. Core and Bonus both
  // hand this same task identity to TransferTaskRunner after this point.
  const pushTransferEncounter = (task: StudyTask) => {
    if (!task.problemId) return;
    steps.push({
      id: `transfer-encounter-${task.id}`,
      type: "transfer_encounter",
      studyTaskId: task.id,
      problemId: task.problemId,
      title: "Pattern Challenge",
      estimatedMinutes: task.estimatedMinutes
    });
  };

  if (usingTaskDrivenFlow) {
    const learnTask = coreTasks.find((task) => task.type === "learn");
    const practiceTasks = coreTasks.filter((task) => task.type === "practice");
    const reviewTask = coreTasks.find((task) => task.type === "review");
    const transferTask = coreTasks.find((task) => task.type === "transfer");

    if (day.studyMode === "learn") {
      if (learnTask) {
        // A task-driven step derives its own pattern from the TASK, never
        // from the day - a guided day's patternId is null (mixed topics),
        // and even on a generated day this is strictly more correct than
        // borrowing the day's pattern (task-driven-flow-wide invariant,
        // matched by pushIndependentForTask below).
        const learnPatternId = learnTask.patternId ?? day.patternId ?? undefined;
        const learnPatternLabel = learnTask.patternId ? patternLabelFor(learnTask.patternId) : patternLabel;
        steps.push({
          id: `learn-${learnTask.id}`,
          type: "learn",
          studyTaskId: learnTask.id,
          title: `Learn: ${learnTask.learnResource?.title ?? learnPatternLabel}`,
          estimatedMinutes: 5,
          patternId: learnPatternId,
          patternLabel: learnPatternLabel,
          // day.topicLabel exists only for a guided curriculum day - a
          // generated day has none, so curriculumContext stays undefined
          // and LearnStep's heading falls back to patternLabel exactly as
          // before (no behavior change for generated plans).
          curriculumContext: day.topicLabel,
          learnResource: learnTask.learnResource
        });
        if (learnTask.problemId) {
          // learnTask.patternId is already authoritative for this exact
          // problem (set by whoever built the StudyTask - buildDayTasks for
          // a generated plan, the guided-curriculum adapter for a guided
          // one) - no need to re-derive it from the catalog a second time.
          steps.push({
            id: `guided-${learnTask.id}`,
            type: "guided_problem",
            studyTaskId: learnTask.id,
            title: `Guided: ${problemTitleFor(learnTask.problemId) ?? learnTask.title}`,
            estimatedMinutes: Math.max(9, learnTask.estimatedMinutes),
            problemId: learnTask.problemId,
            problemTitle: problemTitleFor(learnTask.problemId),
            patternId: learnPatternId,
            patternLabel: learnPatternLabel,
            coachStyle: effectiveCoachStyle
          });
        }
      }
      pushContrast();
      practiceTasks.forEach(pushIndependentForTask);
      steps.push(
        reflectionStep(
          "Explain it back",
          `Explain ${patternLabel} to someone who has never seen it, in 2-3 sentences.`,
          reviewTask?.id
        )
      );
    } else if (day.studyMode === "recognize") {
      const [firstPractice, ...restPractice] = practiceTasks;
      if (firstPractice?.problemId) {
        steps.push({
          id: `recognize-${firstPractice.id}`,
          type: "guided_problem",
          studyTaskId: firstPractice.id,
          title: `Recognize: ${problemTitleFor(firstPractice.problemId) ?? firstPractice.title}`,
          estimatedMinutes: Math.max(6, firstPractice.estimatedMinutes),
          problemId: firstPractice.problemId,
          problemTitle: problemTitleFor(firstPractice.problemId),
          patternId: firstPractice.patternId ?? day.patternId ?? undefined,
          patternLabel: firstPractice.patternId ? patternLabelFor(firstPractice.patternId) : patternLabel,
          coachStyle: effectiveCoachStyle
        });
      }
      pushContrast();
      restPractice.forEach(pushIndependentForTask);
    } else if (day.studyMode === "practice") {
      const [firstPractice, ...restPractice] = practiceTasks;
      if (firstPractice?.problemId) {
        steps.push({
          id: `guided-${firstPractice.id}`,
          type: "guided_problem",
          studyTaskId: firstPractice.id,
          title: `Warm-up: ${problemTitleFor(firstPractice.problemId) ?? firstPractice.title}`,
          estimatedMinutes: Math.max(8, firstPractice.estimatedMinutes),
          problemId: firstPractice.problemId,
          problemTitle: problemTitleFor(firstPractice.problemId),
          patternId: firstPractice.patternId ?? day.patternId ?? undefined,
          patternLabel: firstPractice.patternId ? patternLabelFor(firstPractice.patternId) : patternLabel,
          coachStyle: effectiveCoachStyle
        });
      }
      // "practice" mode doesn't normally include a contrast step, but a
      // recognition weakness or a recurring mix-up on this pattern is
      // exactly what contrast steps are for - surface one anyway.
      if (weakRecognition || hasDominantConfusion) pushContrast();
      restPractice.forEach(pushIndependentForTask);
      steps.push(
        reflectionStep(
          "Reflection",
          "What almost tripped you up today, and how did you catch it?",
          reviewTask?.id
        )
      );
    } else {
      pushContrast();
      // This fallback day has no independent step by default, but weak
      // independence is exactly the case where a lower-assistance retry
      // matters most - add one if there's a problem to attach it to.
      if (weakIndependence) practiceTasks.forEach(pushIndependentForTask);
      steps.push(reflectionStep("Reflection", "Which pattern from this week still feels shaky?", reviewTask?.id));
    }

    // A fail-closed legacy Transfer may be exposed as an ordinary practice
    // task instead of a scored recognition encounter. Ensure every such
    // task still receives a runnable step even on a mixed-review host day.
    const representedTaskIds = new Set(steps.map((step) => step.studyTaskId).filter(Boolean));
    practiceTasks.filter((task) => !representedTaskIds.has(task.id)).forEach(pushIndependentForTask);

    if (transferTask) pushTransferEncounter(transferTask);

    return {
      dayNumber: day.dayNumber,
      weekNumber: day.weekNumber,
      headline: patternLabel,
      estimatedMinutes: steps.reduce((sum, step) => sum + step.estimatedMinutes, 0),
      steps
    };
  }

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
