import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions,
  type RoadmapTrack
} from "@/lib/product";
import { hasNativeProblemCodeConfig } from "@/lib/problem-code";
import {
  WEEKDAY_ORDER,
  assignPriority,
  bucketTasks,
  defaultWeekdayMinutes,
  type PreparationGoal,
  type StudyTask,
  type WeekdayMinutes
} from "@/lib/study-plan";
import {
  MIN_DAYS_BETWEEN_PRACTICE_AND_TRANSFER,
  MIN_DAYS_BETWEEN_TRANSFERS
} from "@/lib/transfer-policy";
import { isPedagogicallyBlindTransfer } from "@/lib/transfer-safety";

export type ExperienceLevel = "new" | "rusty" | "comfortable";
export type StudyMode = "learn" | "recognize" | "practice" | "review";
export type CoachStyle = "beginner" | "guided" | "optional";

export function coachStyleForExperience(experienceLevel: ExperienceLevel): CoachStyle {
  return experienceLevel === "new" ? "beginner" : experienceLevel === "rusty" ? "guided" : "optional";
}

export type OnboardingAnswers = {
  experienceLevel: ExperienceLevel;
  deadlineWeeks: number | null;
  interviewDate: string | null;
  dailyMinutes: number;
  // Phase 1 additions. Both optional so anything constructing
  // OnboardingAnswers without them (there's nothing left that does, but
  // this keeps the type honest about its own history) still compiles.
  goal?: PreparationGoal;
  weekdayMinutes?: WeekdayMinutes;
};

export type CurriculumWeeklyPlan = {
  headline: string;
  rationale: string;
  totalWeeks: number;
  dailyMinutes: number;
  weeks: {
    weekNumber: number;
    focusPatternIds: string[];
    dominantStudyMode: "learn" | "recognize" | "practice";
    includesReviewDay: boolean;
  }[];
};

export type CurriculumDay = {
  dayNumber: number;
  weekNumber: number;
  patternId: string | null;
  patternLabel: string;
  studyMode: StudyMode;
  // Pilot Foundation: a guided curriculum's own topic/chapter label (e.g.
  // "Arrays"), display-only. A guided day's individual tasks can each
  // carry a DIFFERENT authoritative patternId (from the problem catalog) -
  // topicLabel never substitutes for that. Undefined for generated plans,
  // where patternId/patternLabel already carry a single real pattern.
  topicLabel?: string;
  // problemIds stays exactly as before - it's a summary of this day's
  // CORE tasks (tasks[].bucket === "core"), so every existing reader
  // (session.ts's buildDailySession, /api/today) keeps working unchanged.
  problemIds: string[];
  // Phase 1: optional so old accepted plans (persisted before this
  // change) parse into this type with tasks simply absent - /api/today
  // synthesizes a fallback for those, see lib/study-plan.ts.
  tasks?: StudyTask[];
};

export type CurriculumPlan = {
  headline: string;
  rationale: string;
  totalWeeks: number;
  dailyMinutes: number;
  coachStyle: CoachStyle;
  days: CurriculumDay[];
};

const DAY_TEMPLATE: StudyMode[] = ["learn", "learn", "recognize", "recognize", "practice", "practice", "review"];

export function buildCurriculumPlanSchema(totalWeeks: number, dailyMinutes: number) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["headline", "rationale", "totalWeeks", "dailyMinutes", "weeks"],
    properties: {
      headline: { type: "string" },
      rationale: { type: "string" },
      totalWeeks: { type: "integer", const: totalWeeks },
      dailyMinutes: { type: "integer", const: dailyMinutes },
      weeks: {
        type: "array",
        minItems: totalWeeks,
        maxItems: totalWeeks,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["weekNumber", "focusPatternIds", "dominantStudyMode", "includesReviewDay"],
          properties: {
            weekNumber: { type: "integer", minimum: 1, maximum: totalWeeks },
            focusPatternIds: {
              type: "array",
              minItems: 1,
              maxItems: 3,
              items: { type: "string", enum: patternOptions.map((pattern) => pattern.id) }
            },
            dominantStudyMode: { type: "string", enum: ["learn", "recognize", "practice"] },
            includesReviewDay: { type: "boolean" }
          }
        }
      }
    }
  } as const;
}

export function weeksFromDeadline(deadlineWeeks: number | null): number {
  if (deadlineWeeks == null) return 6;
  return Math.min(8, Math.max(2, deadlineWeeks));
}

export function weeksUntilDate(interviewDate: string): number | null {
  const target = new Date(`${interviewDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const daysUntil = Math.ceil((target.getTime() - Date.now()) / 86_400_000);
  return Math.max(1, Math.ceil(daysUntil / 7));
}

export function resolveDeadlineWeeks(answers: Pick<OnboardingAnswers, "deadlineWeeks" | "interviewDate">) {
  if (answers.interviewDate) {
    const fromDate = weeksUntilDate(answers.interviewDate);
    if (fromDate != null) return fromDate;
  }
  return answers.deadlineWeeks;
}

export function formatInterviewDate(interviewDate: string) {
  const date = new Date(`${interviewDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return interviewDate;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const EASY_FIRST_PATTERN_ORDER = [
  "hashing",
  "two-pointers",
  "sliding-window",
  "stack",
  "binary-search",
  "bfs",
  "dfs",
  "intervals",
  "heap",
  "greedy",
  "dynamic-programming"
];

function orderedPatternIds() {
  const known = EASY_FIRST_PATTERN_ORDER.filter((id) => patternOptions.some((pattern) => pattern.id === id));
  const remaining = patternOptions.map((pattern) => pattern.id).filter((id) => !known.includes(id));
  return [...known, ...remaining];
}

export function buildFallbackWeeklyPlan(answers: OnboardingAnswers): CurriculumWeeklyPlan {
  const totalWeeks = weeksFromDeadline(resolveDeadlineWeeks(answers));
  const order = orderedPatternIds();
  const dominantStudyMode: CurriculumWeeklyPlan["weeks"][number]["dominantStudyMode"] =
    answers.experienceLevel === "new" ? "learn" : answers.experienceLevel === "rusty" ? "recognize" : "practice";

  // Size patterns-per-week so every pattern gets covered at least once by the
  // end of the plan (short plans go wider per week; long plans can go deeper).
  const patternsPerWeek = Math.min(3, Math.max(1, Math.ceil(order.length / totalWeeks)));

  const weeks: CurriculumWeeklyPlan["weeks"] = [];
  let cursor = 0;
  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber += 1) {
    const focusPatternIds = Array.from(
      { length: patternsPerWeek },
      (_, offset) => order[(cursor + offset) % order.length]
    );
    cursor += patternsPerWeek;
    weeks.push({
      weekNumber,
      focusPatternIds,
      dominantStudyMode: weekNumber === 1 ? "learn" : dominantStudyMode,
      includesReviewDay: weekNumber > 1
    });
  }

  return {
    headline: answers.interviewDate
      ? `Your path to ${formatInterviewDate(answers.interviewDate)}.`
      : answers.deadlineWeeks == null
        ? `A ${totalWeeks}-week path built around pattern recognition.`
        : `Your ${totalWeeks}-week path to interview-ready.`,
    rationale:
      answers.experienceLevel === "new"
        ? "Starting from the basics — every week begins with guided learning before independent practice."
        : answers.experienceLevel === "rusty"
          ? "Front-loading recognition reps to rebuild instinct fast, then shifting to speed and mixed review."
          : "Mostly practice and mixed review, since the fundamentals are already there.",
    totalWeeks,
    dailyMinutes: answers.dailyMinutes,
    weeks
  };
}

export function validateCurriculumWeeklyPlan(
  value: unknown,
  expectedTotalWeeks: number,
  expectedDailyMinutes: number
): CurriculumWeeklyPlan | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CurriculumWeeklyPlan>;
  const totalWeeks = Math.min(8, Math.max(2, Math.round(expectedTotalWeeks)));
  if (!totalWeeks) return null;
  if (!Array.isArray(candidate.weeks) || candidate.weeks.length < totalWeeks) return null;

  const weeks = candidate.weeks
    .map((week, index) => {
      if (!week || typeof week !== "object") return null;
      const focusPatternIds = Array.isArray(week.focusPatternIds)
        ? week.focusPatternIds
            .filter((id): id is string => patternOptions.some((pattern) => pattern.id === id))
            .slice(0, 3)
        : [];
      if (focusPatternIds.length === 0) return null;
      const dominantStudyMode = (["learn", "recognize", "practice"] as const).includes(
        week.dominantStudyMode as never
      )
        ? (week.dominantStudyMode as "learn" | "recognize" | "practice")
        : "learn";
      return {
        weekNumber: Number(week.weekNumber) || index + 1,
        focusPatternIds,
        dominantStudyMode,
        includesReviewDay: Boolean(week.includesReviewDay)
      };
    })
    .filter((week): week is CurriculumWeeklyPlan["weeks"][number] => Boolean(week))
    .slice(0, totalWeeks);

  if (weeks.length === 0) return null;

  return {
    headline: String(candidate.headline || "Your personalized study path."),
    rationale: String(candidate.rationale || "Sequenced from your onboarding answers."),
    totalWeeks: weeks.length,
    dailyMinutes: expectedDailyMinutes,
    weeks
  };
}

export function ensureFullPatternCoverage(plan: CurriculumWeeklyPlan): CurriculumWeeklyPlan {
  const allIds = patternOptions.map((pattern) => pattern.id);
  const covered = new Set(plan.weeks.flatMap((week) => week.focusPatternIds));
  const missing = allIds.filter((id) => !covered.has(id));
  if (missing.length === 0) return plan;

  const weeks = plan.weeks.map((week) => ({ ...week, focusPatternIds: [...week.focusPatternIds] }));
  let weekIndex = 0;
  for (const patternId of missing) {
    let attempts = 0;
    while (weeks[weekIndex % weeks.length].focusPatternIds.length >= 3 && attempts < weeks.length) {
      weekIndex += 1;
      attempts += 1;
    }
    weeks[weekIndex % weeks.length].focusPatternIds.push(patternId);
    weekIndex += 1;
  }

  return { ...plan, weeks };
}

function difficultyRank(difficulty: string) {
  return difficulty === "Easy" ? 0 : difficulty === "Medium" ? 1 : difficulty === "Hard" ? 2 : 3;
}

// Native problems have real judged test cases; fallback problems only offer a
// "paste your own sample input" harness. Prefer native ones so a learner's plan
// stays testable, especially early on - fall back to non-native only once a
// pattern's native problems are used up.
function pickRank(problem: { id: string; difficulty: string }) {
  const nativeRank = hasNativeProblemCodeConfig(problem.id) ? 0 : 1;
  return nativeRank * 10 + difficultyRank(problem.difficulty);
}

// Phase 2A: deterministic Transfer-problem selection. "Unseen" is judged
// against BOTH plan-generation-time state (scheduledProblemIdsSoFar -
// every problem THIS plan has already placed on an earlier day, even
// though the learner hasn't reached it yet) and persisted learner history
// (attemptedProblemIds). A problem slated for Day 3's Practice is not a
// valid Day 10 Transfer candidate just because the database doesn't know
// about it yet at generation time - the whole plan is generated up front,
// before any of it has been attempted. Deliberately conservative: there is
// no fallback tier that reuses an already-scheduled-this-plan problem -
// an empty result means "generate no Transfer task today," never a
// weakened substitute (a Transfer problem the learner just saw two days
// ago isn't a real test of blind recognition).
// Exported for direct unit testing (same convention as assignPriority/
// bucketTasks) - the exhaustion/preference behavior is easier to verify
// in isolation than only indirectly through a full generated plan.
export function selectTransferProblem(
  patternId: string,
  scheduledProblemIdsSoFar: Set<string>,
  attemptedProblemIds: Set<string>
): string | null {
  const candidates = allProblems
    .filter((problem) => problem.targetPatternId === patternId)
    .filter((problem) => !scheduledProblemIdsSoFar.has(problem.id))
    .sort((left, right) => pickRank(left) - pickRank(right));

  if (candidates.length === 0) return null;

  // Prefer genuinely unseen (never attempted); fall back to "seen before,
  // but not used anywhere in this plan" rather than fabricating a problem.
  const unseen = candidates.find((problem) => !attemptedProblemIds.has(problem.id));
  return (unseen ?? candidates[0]).id;
}

function pickProblem(patternId: string, track: RoadmapTrack, used: Set<string>) {
  const inTrack = allProblems
    .filter((problem) => problem.targetPatternId === patternId)
    .filter((problem) => getOfficialProblemRoadmapMeta(problem.id)?.tracks.includes(track))
    .filter((problem) => !used.has(problem.id))
    .sort((left, right) => pickRank(left) - pickRank(right));

  const anyTrack = allProblems
    .filter((problem) => problem.targetPatternId === patternId)
    .filter((problem) => !used.has(problem.id))
    .sort((left, right) => pickRank(left) - pickRank(right));

  const fallbackReuse = allProblems.filter((problem) => problem.targetPatternId === patternId);

  const chosen = inTrack[0] ?? anyTrack[0] ?? fallbackReuse[0] ?? allProblems[0];
  used.add(chosen.id);
  return chosen;
}

// Rough per-problem time budget (coding + coaching), used only to size how
// many problems a day gets — not a scheduling promise.
const MINUTES_PER_PROBLEM = 25;
// Phase 1.1: this used to be a flat legacy cap sized for the old
// ~45-90 min/day system, which silently capped a generous weekday budget
// (e.g. 240 min) at just 125 min of content with the rest never
// generated. It's now framed as an anti-repetition ceiling instead of a
// capacity ceiling: blocked practice on one pattern is still right for
// early learning, but a wall of 5+ near-identical same-pattern reps in
// one sitting isn't. A big guaranteed budget on a fresh pattern can
// legitimately go under-used - that's an acceptable trade against
// padding with low-value repeats. Once review history exists, the
// existing due-review recall step (session.ts) already introduces
// cross-pattern variety on its own, without any scheduling change here.
const MAX_SAME_PATTERN_TASKS_PER_DAY = 4;

// Slot index within a week doubles as a weekday index (slot 0 = Monday,
// matching DAY_TEMPLATE's own week-shaped layout) purely so a day's
// guaranteed budget can be looked up from the learner's weekdayMinutes -
// the plan doesn't track which real calendar date a slot lands on.
// Phase 2A: extra time budget for a Transfer task beyond a normal
// problem's MINUTES_PER_PROBLEM - it includes an up-front blind
// prediction step before the same solve work.
const TRANSFER_EXTRA_MINUTES = 5;

type PlannedTransfer = { patternId: string; problemId: string };

function buildDayTasks(
  planId: string,
  dayNumber: number,
  studyMode: StudyMode,
  patternId: string | null,
  problemIds: string[],
  goal: PreparationGoal,
  guaranteedMinutes: number,
  // Phase 2A.1: a Transfer may target a DIFFERENT pattern from the host
  // day's focus. That separation is the scheduler's anti-priming boundary.
  transfer?: PlannedTransfer | null
): StudyTask[] {
  const pattern = patternId ? patternOptions.find((entry) => entry.id === patternId) : undefined;

  const raw: Array<Omit<StudyTask, "bucket">> = [];
  if (studyMode === "review" || problemIds.length === 0) {
    raw.push(
      {
        id: `task-${planId}-${dayNumber}-review`,
        type: "review" as const,
        priority: "A" as const,
        patternId: null,
        problemId: null,
        title: "Mixed pattern review",
        estimatedMinutes: Math.max(15, Math.min(30, guaranteedMinutes || 20))
      }
    );
  } else {
    const priority = assignPriority(patternId, goal);
    raw.push(
      ...problemIds.map((problemId, index) => {
        const problem = allProblems.find((entry) => entry.id === problemId);
        return {
          id: `task-${planId}-${dayNumber}-${index}`,
          type: (studyMode === "learn" && index === 0 ? "learn" : "practice") as StudyTask["type"],
          priority,
          patternId,
          problemId,
          title: problem ? `${pattern?.label ?? "Practice"} — ${problem.title}` : (pattern?.label ?? "Practice"),
          estimatedMinutes: MINUTES_PER_PROBLEM
        };
      })
    );
  }

  if (transfer) {
    const transferProblem = allProblems.find((entry) => entry.id === transfer.problemId);
    raw.push({
      id: `task-${planId}-${dayNumber}-transfer`,
      type: "transfer" as StudyTask["type"],
      priority: assignPriority(transfer.patternId, goal),
      patternId: transfer.patternId,
      problemId: transfer.problemId,
      title: `Pattern Challenge — ${transferProblem?.title ?? "Problem"}`,
      estimatedMinutes: MINUTES_PER_PROBLEM + TRANSFER_EXTRA_MINUTES
    });
  }

  return bucketTasks(raw, guaranteedMinutes).map((task) => ({ ...task }));
}

export function expandWeeklyPlanToDays(
  weeklyPlan: CurriculumWeeklyPlan,
  track: RoadmapTrack,
  coachStyle: CoachStyle,
  goal: PreparationGoal = "general_practice",
  weekdayMinutes: WeekdayMinutes = defaultWeekdayMinutes(weeklyPlan.dailyMinutes),
  // Phase 1.1 (Bug 3): weeks stay an internal grouping concept only - a
  // learner who asks for 30 days must get exactly 30 materialized days,
  // not 35 (Math.ceil(30/7)=5 weeks x 7). Undefined means "no explicit
  // day count was requested" (e.g. an interview-date-driven plan), in
  // which case the full week-aligned length is kept, matching today's
  // behavior exactly.
  maxDays?: number,
  // Phase 1.1: embedded into every StudyTask.id this call generates
  // (task-${planId}-${dayNumber}-${index}) so a task's id is globally
  // unique the moment the plan is generated, not just unique within one
  // plan's JSON. Without this, two different accepted plans (different
  // users, or the same user re-generating) would both produce a task id
  // like "task-1-0", and persisting BOTH as the same DB primary key would
  // either collide or force the accept route to mint a fresh id that no
  // longer matches session.ts's studyTaskId - silently breaking the
  // deterministic task<->step link this patch exists to fix. Pass the
  // study_plan_runs row id the caller already generated before calling
  // this. Defaults to "" only for callers that don't persist the result.
  planId = "",
  // Phase 2A: problem ids the learner has ANY persisted history with
  // (attempts or roadmap marks), from getRepCounts(). Used only to prefer
  // a genuinely unseen Transfer candidate over a previously-attempted one
  // - see selectTransferProblem. Defaults to empty for callers that don't
  // have (or don't need) learner history, e.g. tests.
  attemptedProblemIds: Set<string> = new Set()
): CurriculumPlan {
  const used = new Set<string>();
  const days: CurriculumDay[] = [];
  let dayNumber = 0;

  // Phase 2A.1 plan-time history. Repeated Transfers are allowed, but only
  // after deterministic spacing and only while fresh problems/safe host
  // days exist.
  const learnDayByPattern = new Map<string, number>();
  const practiceDayByPattern = new Map<string, number>();
  const lastTransferDayByPattern = new Map<string, number>();

  for (const week of weeklyPlan.weeks) {
    for (let slot = 0; slot < 7; slot += 1) {
      dayNumber += 1;
      const studyMode = DAY_TEMPLATE[slot];
      const patternId = week.focusPatternIds[slot % week.focusPatternIds.length];
      const pattern = patternOptions.find((entry) => entry.id === patternId);
      const guaranteedMinutes = weekdayMinutes[WEEKDAY_ORDER[slot]] ?? weeklyPlan.dailyMinutes;

      // Record today's contribution to this pattern's plan-time history
      // BEFORE deciding Transfer eligibility below, so a day can never
      // qualify using its own same-day learn/practice as the prerequisite.
      if (studyMode !== "review" && studyMode === "learn" && !learnDayByPattern.has(patternId)) {
        learnDayByPattern.set(patternId, dayNumber);
      }
      if (studyMode !== "review" && studyMode === "practice") {
        practiceDayByPattern.set(patternId, dayNumber);
      }

      // One extra problem beyond what the guaranteed budget fits, so
      // there's real content available for the Bonus bucket rather than
      // Bonus always being empty.
      const problemsPerDay =
        studyMode === "review"
          ? 0
          : Math.min(
              MAX_SAME_PATTERN_TASKS_PER_DAY,
              Math.max(1, Math.round(guaranteedMinutes / MINUTES_PER_PROBLEM)) + 1
            );
      const problemIds = Array.from({ length: problemsPerDay }, () => pickProblem(patternId, track, used).id);

      const hostProblemMetadata = problemIds
        .map((problemId) => allProblems.find((problem) => problem.id === problemId))
        .filter((problem): problem is (typeof allProblems)[number] => Boolean(problem));
      let transfer: PlannedTransfer | null = null;
      const candidatePatternIds = patternOptions.map((candidate) => candidate.id).filter((candidatePatternId) => {
        const learnDay = learnDayByPattern.get(candidatePatternId);
        const practiceDay = practiceDayByPattern.get(candidatePatternId);
        const lastTransferDay = lastTransferDayByPattern.get(candidatePatternId);
        if (learnDay == null || practiceDay == null) return false;
        if (dayNumber - Math.max(learnDay, practiceDay) < MIN_DAYS_BETWEEN_PRACTICE_AND_TRANSFER) return false;
        if (lastTransferDay != null && dayNumber - lastTransferDay < MIN_DAYS_BETWEEN_TRANSFERS) return false;
        if (studyMode !== "review" && candidatePatternId === patternId) return false;
        return !hostProblemMetadata.some(
          (problem) =>
            problem.targetPatternId === candidatePatternId || problem.contrastPatternId === candidatePatternId
        );
      });

      for (const candidatePatternId of candidatePatternIds) {
        const transferProblemId = selectTransferProblem(candidatePatternId, used, attemptedProblemIds);
        if (!transferProblemId) continue;
        transfer = { patternId: candidatePatternId, problemId: transferProblemId };
        used.add(transferProblemId);
        lastTransferDayByPattern.set(candidatePatternId, dayNumber);
        break;
      }

      const tasks = buildDayTasks(
        planId,
        dayNumber,
        studyMode,
        studyMode === "review" ? null : patternId,
        problemIds,
        goal,
        guaranteedMinutes,
        transfer
      );
      const coreProblemIds = tasks.filter((task) => task.bucket === "core" && task.problemId).map((task) => task.problemId as string);

      days.push({
        dayNumber,
        weekNumber: week.weekNumber,
        patternId: studyMode === "review" ? null : patternId,
        patternLabel: studyMode === "review" ? "Mixed review" : (pattern?.label ?? "Pattern practice"),
        studyMode,
        // Kept to exactly what today's session flow (session.ts) actually
        // consumes - the day's CORE work, not the Bonus extras.
        problemIds: coreProblemIds.length > 0 ? coreProblemIds : problemIds.slice(0, 1),
        tasks
      });
    }
  }

  const trimmedDays =
    typeof maxDays === "number" && maxDays > 0 && maxDays < days.length ? days.slice(0, maxDays) : days;

  // Post-pass safety net: the per-pattern candidate filter above (learnDay/
  // practiceDay/lastTransferDay maps) is a fast heuristic and can diverge
  // from the canonical isPedagogicallyBlindTransfer predicate - e.g. a
  // pattern's "learn" day also seeds fresh practice-type subtasks for
  // itself (see buildDayTasks), which the heuristic doesn't track by day
  // but the canonical, task-level check does. Rather than keep two
  // implementations of the same invariant in sync, verify every generated
  // Transfer against the canonical check here and demote any that fail it
  // back to ordinary practice before this plan is ever returned - the
  // invariant then holds by construction, using the exact predicate
  // /api/today re-checks at serve time.
  for (const day of trimmedDays) {
    for (const task of day.tasks ?? []) {
      if (task.type !== "transfer") continue;
      if (isPedagogicallyBlindTransfer({ plan: { days: trimmedDays }, day, task })) continue;
      // Demoted to ordinary practice, not a scored recognition test - so it
      // behaves exactly like any other practice task from here on, no
      // special hiding. task.patternId is deliberately left as the
      // Transfer's ORIGINAL target pattern (not overwritten to the host
      // day's pattern, not nulled): this task is now a genuine practice
      // exposure to that pattern, and isPedagogicallyBlindTransfer's own
      // practice-day scan for future days depends on seeing it there - a
      // later scored Transfer for this same pattern must still satisfy
      // normal spacing/anti-priming relative to this exposure.
      task.type = "practice";
      const patternLabel = patternOptions.find((entry) => entry.id === task.patternId)?.label ?? "Practice";
      const problem = task.problemId ? allProblems.find((entry) => entry.id === task.problemId) : undefined;
      task.title = problem ? `${patternLabel} — ${problem.title}` : task.title;
    }
  }

  return {
    headline: weeklyPlan.headline,
    rationale: weeklyPlan.rationale,
    totalWeeks: weeklyPlan.totalWeeks,
    dailyMinutes: weeklyPlan.dailyMinutes,
    coachStyle,
    days: trimmedDays
  };
}
