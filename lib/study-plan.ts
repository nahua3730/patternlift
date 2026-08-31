// Phase 1 of the Adaptive Study Plan system. Deliberately narrow: task
// generation only produces learn/practice/review tasks today (recall
// surfaces live through the existing review_items/dueReviews pipeline in
// session.ts, unchanged) - transfer/assessment task types, structured
// pattern prediction, weekly review, and adaptive multi-day rescheduling
// are Phase 2 and intentionally not represented here yet.

export type PreparationGoal = "swe_internship" | "new_grad" | "oa_prep" | "general_practice";

export const PREPARATION_GOALS: { value: PreparationGoal; label: string }[] = [
  { value: "swe_internship", label: "SWE Internship" },
  { value: "new_grad", label: "New Grad" },
  { value: "oa_prep", label: "OA Prep" },
  { value: "general_practice", label: "General Practice" }
];

// Phase 2A: "transfer" is the first first-class task type added since
// Phase 1 - an unseen/sufficiently-unfamiliar problem where the learner
// predicts the pattern BEFORE any pattern-specific help is available.
// "recall" stays unused by task generation (recall still flows entirely
// through the separate due-review pipeline in session.ts, unchanged).
export type TaskType = "learn" | "practice" | "recall" | "review" | "transfer";
export type Priority = "A" | "B" | "C";
export type TaskBucket = "core" | "bonus";

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAY_ORDER: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const WEEKDAY_LABEL: Record<WeekdayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday"
};

export type WeekdayMinutes = Record<WeekdayKey, number>;

export function defaultWeekdayMinutes(flatMinutes = 60): WeekdayMinutes {
  return WEEKDAY_ORDER.reduce((acc, day) => {
    acc[day] = flatMinutes;
    return acc;
  }, {} as WeekdayMinutes);
}

// Pilot Foundation: a generic external Learn resource (a Carl/代码随想录
// lesson today, some other guided curriculum's lesson later) - deliberately
// NOT coupled to any one video host. Optional because most tasks (every
// generated-plan task, and any guided Practice/Review task) have none.
export type LearnResource = {
  title: string;
  url: string;
  provider?: string;
};

export type StudyTask = {
  id: string;
  type: TaskType;
  priority: Priority;
  bucket: TaskBucket;
  patternId: string | null;
  problemId: string | null;
  title: string;
  estimatedMinutes: number;
  learnResource?: LearnResource;
};

// Deterministic, explainable, and goal-aware - not difficulty, not user
// configurable. Base list is the set of patterns that show up in nearly
// every interview-prep list (also the front of curriculum-agent.ts's own
// EASY_FIRST_PATTERN_ORDER); goal overrides shift a handful of patterns
// up or down based on what that prep goal actually tests in practice:
// full SWE/new-grad loops lean harder on DP and heaps than a timed OA
// does, while OA-style speed rounds lean harder on greedy/intervals and
// can defer deep DP to a later pass.
const BASE_PRIORITY: Record<string, Priority> = {
  hashing: "A",
  "two-pointers": "A",
  "sliding-window": "A",
  "binary-search": "A",
  stack: "A",
  bfs: "A",
  dfs: "A",
  intervals: "B",
  heap: "B",
  greedy: "B",
  "dynamic-programming": "B"
};

const GOAL_PRIORITY_OVERRIDES: Record<PreparationGoal, Partial<Record<string, Priority>>> = {
  swe_internship: { "dynamic-programming": "A" },
  new_grad: { "dynamic-programming": "A", heap: "A" },
  oa_prep: { greedy: "A", intervals: "A", "dynamic-programming": "C" },
  general_practice: {}
};

export function assignPriority(patternId: string | null, goal: PreparationGoal): Priority {
  if (!patternId) return "B";
  return GOAL_PRIORITY_OVERRIDES[goal][patternId] ?? BASE_PRIORITY[patternId] ?? "B";
}

const PRIORITY_RANK: Record<Priority, number> = { A: 0, B: 1, C: 2 };

// Fills Core with A tasks first (then B, then C) up to the guaranteed
// (lower-bound) budget for the day; everything past that becomes Bonus.
// Never leaves Core empty when there's at least one task, even if that
// first task alone slightly exceeds a very tight budget - an empty Core
// on a day with real work planned would be a worse beginner experience
// than a slightly-over-budget first task.
export function bucketTasks<T extends { priority: Priority; estimatedMinutes: number }>(
  tasks: T[],
  guaranteedMinutes: number
): (T & { bucket: TaskBucket })[] {
  const ordered = tasks
    .map((task, index) => ({ task, index }))
    .sort((left, right) => PRIORITY_RANK[left.task.priority] - PRIORITY_RANK[right.task.priority] || left.index - right.index)
    .map((entry) => entry.task);

  let runningTotal = 0;
  const bucketed = ordered.map((task, index) => {
    const bucket: TaskBucket =
      index === 0 || runningTotal + task.estimatedMinutes <= guaranteedMinutes ? "core" : "bonus";
    if (bucket === "core") runningTotal += task.estimatedMinutes;
    return { ...task, bucket };
  });

  return bucketed;
}

export type MasteryGradeInput = {
  // Did the learner's initial pattern guess for this attempt match the
  // actual pattern? Grade 0 ("could not recognize the pattern until
  // receiving a hint/solution") hinges specifically on this, not just on
  // outcome quality.
  recognizedCorrectly: boolean;
  outcome: "solid" | "partial" | "confused";
  highestHintLevel?: number;
};

// Pure derivation over fields the app already captures on every attempt
// (lib/diagnosis.ts's recognition check, lib/hint-ladder.ts's depth) -
// no new signals collected, same deterministic style as
// lib/support-plan.ts's chooseSupportPlan.
// Backward compatibility: a CurriculumDay accepted before Phase 1 has no
// tasks[] at all, only the old patternId/studyMode/problemIds shape.
// Synthesize a same-looking checklist from it so /today never breaks for
// an already-in-flight plan - no weekday-budget context exists for an old
// plan, so everything is treated as Core (matches the old behavior, where
// every listed problem was simply "today's work," no bonus concept).
export function synthesizeTasksFromLegacyDay(day: {
  dayNumber: number;
  patternId: string | null;
  patternLabel: string;
  studyMode: "learn" | "recognize" | "practice" | "review";
  problemIds: string[];
}): StudyTask[] {
  if (day.studyMode === "review" || day.problemIds.length === 0) {
    return [
      {
        id: `legacy-${day.dayNumber}-review`,
        type: "review",
        priority: "A",
        bucket: "core",
        patternId: null,
        problemId: null,
        title: "Mixed pattern review",
        estimatedMinutes: 20
      }
    ];
  }

  const priority = assignPriority(day.patternId, "general_practice");
  return day.problemIds.map((problemId, index) => ({
    id: `legacy-${day.dayNumber}-${index}`,
    type: day.studyMode === "learn" && index === 0 ? "learn" : "practice",
    priority,
    bucket: "core",
    patternId: day.patternId,
    problemId,
    title: day.patternLabel,
    estimatedMinutes: 25
  }));
}

export function masteryGradeFor(input: MasteryGradeInput): 0 | 1 | 2 | 3 {
  const hintLevel = input.highestHintLevel ?? 0;

  // 0 - Missed: never recognized the pattern on their own.
  if (!input.recognizedCorrectly) return 0;
  if (input.outcome === "confused") return 0;

  // 1 - Partial: recognized it, but needed a meaningful hint or
  // implementation help to get anywhere (Level 4+ hint = pseudocode or
  // code-level help, not just a nudge).
  if (hintLevel >= 4) return 1;
  if (input.outcome === "partial") return hintLevel >= 2 ? 1 : 2;

  // outcome === "solid" from here on.
  // 3 - Strong: recognized quickly, solved independently, no real hesitation.
  if (hintLevel === 0) return 3;
  // 2 - Independent: recognized and solved independently, but with some
  // hesitation/debugging along the way (used a hint or two).
  return 2;
}

// Phase 2A: implementation is deliberately independent from recognition.
// Do not reuse masteryGradeFor here because its first gate is the learner's
// pattern recognition by design.
export function transferImplementationFor(input: {
  codePassed: boolean | null;
  hintsUsed: number;
  highestHintLevel?: number;
  fallbackOutcome: "solid" | "partial" | "confused";
}): { outcome: "solid" | "partial" | "confused"; grade: 0 | 1 | 2 | 3 } {
  const helpDepth = input.highestHintLevel ?? 0;

  if (input.codePassed === true) {
    if (helpDepth >= 2 || input.hintsUsed >= 2) return { outcome: "partial", grade: 1 };
    if (helpDepth === 1 || input.hintsUsed === 1) return { outcome: "partial", grade: 2 };
    return { outcome: "solid", grade: 3 };
  }

  if (input.codePassed === false) {
    return { outcome: input.fallbackOutcome === "confused" ? "confused" : "partial", grade: 0 };
  }

  return {
    outcome: input.fallbackOutcome,
    grade: input.fallbackOutcome === "solid" ? 2 : input.fallbackOutcome === "partial" ? 1 : 0
  };
}

// Phase 2A: the structured, authoritative record of a learner's pre-solve
// pattern guess on a Transfer task - independent of, and persisted
// separately from, the eventual coding attempt (AttemptResult). A null
// predictedPatternId means "I'm not sure," which is itself a valid,
// honest answer, not a missing one. No userId here - implicit via auth,
// same convention as StudyTask/AttemptResult on the client side.
export type PatternPrediction = {
  id: string;
  studyTaskId: string;
  problemId: string;
  predictedPatternId: string | null;
  actualPatternId: string;
  reasoning?: string;
  wasCorrect: boolean;
  createdAt: string;
};
