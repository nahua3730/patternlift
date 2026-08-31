// Pilot Foundation: turns a static guided-curriculum definition (Carl
// today) into the SAME CurriculumPlan/StudyTask shape expandWeeklyPlanToDays
// already produces - Today, buildDailySession, Progress, and
// isPedagogicallyBlindTransfer all consume this shape unmodified. This
// file is the adapter, not a second execution system.
//
// Server-only, deliberately: it value-imports the full problem catalog
// (allProblems, including targetPatternId) to resolve each guided task's
// authoritative pattern. Per the Phase 2A.1 client/server catalog
// boundary, this must never be imported by a "use client" component -
// only by server-side route handlers. A guided task's own patternId is
// derived here, once, from the catalog; downstream code (session.ts,
// /api/today) trusts it and never re-derives it from the day's topic.
import { allProblems, patternOptions } from "@/lib/product";
import type { CarlDayDef } from "@/lib/curricula/carl";
import type { CurriculumDay, CurriculumPlan, StudyMode } from "@/lib/curriculum-agent";
import { bucketTasks, type StudyTask } from "@/lib/study-plan";

const MINUTES_PER_PROBLEM = 25;
const LEARN_RESOURCE_MINUTES = 15;
const REVIEW_MINUTES = 25;

function patternIdForProblem(problemId: string | undefined): string | null {
  if (!problemId) return null;
  return allProblems.find((problem) => problem.id === problemId)?.targetPatternId ?? null;
}

function titleForTask(problemId: string | undefined, patternId: string | null, fallback: string): string {
  const problem = problemId ? allProblems.find((entry) => entry.id === problemId) : undefined;
  if (!problem) return fallback;
  const label = patternId ? patternOptions.find((entry) => entry.id === patternId)?.label : undefined;
  return label ? `${label} — ${problem.title}` : problem.title;
}

function buildGuidedDayTasks(planId: string, day: CarlDayDef, guaranteedMinutes: number): StudyTask[] {
  const raw: Array<Omit<StudyTask, "bucket">> = [];
  let index = 0;
  const nextId = () => `task-${planId}-${day.dayNumber}-${index++}`;

  if (day.isReviewDay) {
    raw.push({
      id: nextId(),
      type: "review",
      priority: "A",
      patternId: null,
      problemId: null,
      title: `Review — ${day.topicLabel}`,
      estimatedMinutes: REVIEW_MINUTES
    });
    return bucketTasks(raw, guaranteedMinutes).map((task) => ({ ...task }));
  }

  if (day.learnResource) {
    // The Learn task's patternId comes from its own anchor problem, when
    // one exists - never fabricated from topicLabel. A broad "Array
    // Fundamentals" lesson with no anchor problem gets patternId: null,
    // and therefore produces no mastery-pattern attribution at all - it
    // is still a real, completable task (via learnResource + Mark
    // Complete), just not evidence for any specific algorithm pattern.
    const anchorPatternId = patternIdForProblem(day.learnAnchorProblemId);
    raw.push({
      id: nextId(),
      type: "learn",
      priority: "A",
      patternId: anchorPatternId,
      problemId: day.learnAnchorProblemId ?? null,
      title: day.learnResource.title,
      estimatedMinutes: day.learnAnchorProblemId ? LEARN_RESOURCE_MINUTES + MINUTES_PER_PROBLEM : LEARN_RESOURCE_MINUTES,
      learnResource: day.learnResource
    });
  }

  for (const problemId of day.practiceProblemIds ?? []) {
    const patternId = patternIdForProblem(problemId);
    raw.push({
      id: nextId(),
      type: "practice",
      priority: "A",
      patternId,
      problemId,
      title: titleForTask(problemId, patternId, day.topicLabel),
      estimatedMinutes: MINUTES_PER_PROBLEM
    });
  }

  // Carl Fidelity Pass: a curriculum-required problem PatternLift can't
  // execute natively (yet). No problemId, no patternId - this must never
  // become mastery/Recognition/Transfer evidence, only curriculum
  // completion. Still Core, still participates in carryover, exactly like
  // every other practice task here.
  for (const external of day.externalProblems ?? []) {
    raw.push({
      id: nextId(),
      type: "practice",
      priority: "A",
      patternId: null,
      problemId: null,
      title: external.title,
      estimatedMinutes: MINUTES_PER_PROBLEM,
      externalProblem: external
    });
  }

  return bucketTasks(raw, guaranteedMinutes).map((task) => ({ ...task }));
}

function studyModeFor(day: CarlDayDef): StudyMode {
  if (day.isReviewDay) return "review";
  if (day.learnResource) return "learn";
  return "practice";
}

export function buildGuidedPlan(
  days: CarlDayDef[],
  opts: { planId: string; dailyMinutes: number; headline: string; rationale: string }
): CurriculumPlan {
  const curriculumDays: CurriculumDay[] = days.map((day) => {
    const tasks = buildGuidedDayTasks(opts.planId, day, opts.dailyMinutes);
    const coreProblemIds = tasks
      .filter((task) => task.bucket === "core" && task.problemId)
      .map((task) => task.problemId as string);
    const allProblemIds = tasks.filter((task) => task.problemId).map((task) => task.problemId as string);

    return {
      dayNumber: day.dayNumber,
      weekNumber: Math.ceil(day.dayNumber / 7),
      // Deliberately null - a guided topic day is not one authoritative
      // pattern (see lib/guided-curriculum.ts module comment). topicLabel
      // carries the display concept instead; patternLabel is set to it too
      // only so existing non-guided-aware call sites (module-scope
      // `patternLabel` in buildDailySession, header text) that treat it as
      // a required string keep rendering something sensible - never
      // attribution.
      patternId: null,
      patternLabel: day.topicLabel,
      topicLabel: day.topicLabel,
      studyMode: studyModeFor(day),
      problemIds: coreProblemIds.length > 0 ? coreProblemIds : allProblemIds.slice(0, 1),
      tasks
    };
  });

  return {
    headline: opts.headline,
    rationale: opts.rationale,
    totalWeeks: Math.ceil(days.length / 7),
    dailyMinutes: opts.dailyMinutes,
    coachStyle: "guided",
    days: curriculumDays
  };
}
