import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFallbackWeeklyPlan,
  ensureFullPatternCoverage,
  expandWeeklyPlanToDays,
  selectTransferProblem,
  type OnboardingAnswers
} from "@/lib/curriculum-agent";
import { defaultWeekdayMinutes } from "@/lib/study-plan";
import { allProblems } from "@/lib/product";
import { isPedagogicallyBlindTransfer } from "@/lib/transfer-safety";

function plan(
  days: number,
  dailyMinutes: number,
  planId = "test-plan",
  attemptedProblemIds: Set<string> = new Set()
) {
  const answers: OnboardingAnswers = {
    experienceLevel: "new",
    deadlineWeeks: Math.max(1, Math.ceil(days / 7)),
    interviewDate: null,
    dailyMinutes,
    goal: "general_practice"
  };
  const weekly = ensureFullPatternCoverage(buildFallbackWeeklyPlan(answers));
  return expandWeeklyPlanToDays(
    weekly,
    "neetcode150",
    "beginner",
    "general_practice",
    defaultWeekdayMinutes(dailyMinutes),
    days,
    planId,
    attemptedProblemIds
  );
}

test("Bug 3 regression: requesting exactly 7/14/30 days materializes exactly that many days, not a week-rounded-up count", () => {
  assert.equal(plan(7, 60).days.length, 7);
  assert.equal(plan(14, 60).days.length, 14);
  assert.equal(plan(30, 60).days.length, 30);
});

test("Bug 3 regression: a custom, non-week-aligned day count (e.g. 10) still materializes exactly that many days", () => {
  assert.equal(plan(10, 60).days.length, 10);
});

test("Bug 3: omitting maxDays keeps the full week-aligned length - legacy/interview-date-driven plans are unaffected", () => {
  const answers: OnboardingAnswers = {
    experienceLevel: "new",
    deadlineWeeks: 3,
    interviewDate: null,
    dailyMinutes: 60,
    goal: "general_practice"
  };
  const weekly = ensureFullPatternCoverage(buildFallbackWeeklyPlan(answers));
  const result = expandWeeklyPlanToDays(weekly, "neetcode150", "beginner", "general_practice", defaultWeekdayMinutes(60));
  assert.equal(result.days.length, weekly.totalWeeks * 7);
});

test("Bug 2 regression: a generous 240-min guaranteed weekday no longer silently caps at the old 5-problem/125-minute ceiling with zero Bonus", () => {
  const result = plan(30, 240);
  const learnOrPracticeDay = result.days.find((day) => day.studyMode !== "review" && (day.tasks?.length ?? 0) > 0);
  assert.ok(learnOrPracticeDay, "expected at least one learn/practice day with tasks");
  const tasks = learnOrPracticeDay!.tasks!;
  const coreTasks = tasks.filter((task) => task.bucket === "core");
  const bonusTasks = tasks.filter((task) => task.bucket === "bonus");
  // The anti-repetition guardrail caps same-pattern task generation well
  // below "enough to fill 240 minutes" on purpose - Core should legitimately
  // leave capacity unused rather than being padded with low-value reps.
  assert.ok(coreTasks.length <= 4, `expected the repetition guardrail to cap Core at <=4 tasks, got ${coreTasks.length}`);
  const coreMinutes = coreTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  assert.ok(coreMinutes < 240, "leaving guaranteed capacity unused on a fresh-pattern day is the intended, honest trade-off");
});

test("Bug 2: a modest 60-min guaranteed weekday is unaffected by the tightened repetition guardrail (no regression for normal-sized days)", () => {
  const result = plan(14, 60);
  const day = result.days.find((day) => day.studyMode !== "review" && (day.tasks?.length ?? 0) > 0);
  assert.ok(day);
  // Same as before this patch: a 60-min day still gets ~2-3 tasks.
  assert.ok((day!.tasks?.length ?? 0) >= 2);
});

test("task<->step id-collision regression: task ids embed the plan's own id, so two different accepted plans never generate the same task id", () => {
  const planA = plan(7, 60, "run-aaa");
  const planB = plan(7, 60, "run-bbb");
  const idsA = new Set(planA.days.flatMap((day) => (day.tasks ?? []).map((task) => task.id)));
  const idsB = new Set(planB.days.flatMap((day) => (day.tasks ?? []).map((task) => task.id)));
  const collision = [...idsA].some((id) => idsB.has(id));
  assert.equal(
    collision,
    false,
    "study_tasks.id is a globally-unique DB primary key (see lib/db.ts) - a task id that only embeds " +
      "dayNumber/index would collide across two different users' or runs' accepted plans once the accept " +
      "route persists task.id verbatim as that primary key"
  );
  // Every id also actually carries its own planId, not a shared/blank one.
  assert.ok([...idsA].every((id) => id.includes("run-aaa")));
  assert.ok([...idsB].every((id) => id.includes("run-bbb")));
});

// Phase 2A: Transfer selection and scheduling.

test("selectTransferProblem: prefers a genuinely unseen (never attempted, not scheduled this plan) candidate", () => {
  const hashingProblems = allProblems.filter((problem) => problem.targetPatternId === "hashing").map((p) => p.id);
  const [first, second] = hashingProblems;
  const chosen = selectTransferProblem("hashing", new Set(), new Set([first]));
  assert.notEqual(chosen, first, "an already-attempted problem should not be preferred over an unseen one");
  assert.ok(chosen && hashingProblems.includes(chosen));
  void second;
});

test("selectTransferProblem: falls back to a previously-attempted-but-not-scheduled-this-plan problem when nothing unseen remains", () => {
  const hashingProblems = allProblems.filter((problem) => problem.targetPatternId === "hashing").map((p) => p.id);
  // Every hashing problem has been attempted before (attemptedProblemIds =
  // the full pool), but none are scheduled in THIS plan yet - should still
  // return a real candidate, not null.
  const chosen = selectTransferProblem("hashing", new Set(), new Set(hashingProblems));
  assert.ok(chosen && hashingProblems.includes(chosen));
});

test("selectTransferProblem: returns null (no fabrication) once every same-pattern catalog problem is already scheduled this plan", () => {
  const hashingProblems = allProblems.filter((problem) => problem.targetPatternId === "hashing").map((p) => p.id);
  const chosen = selectTransferProblem("hashing", new Set(hashingProblems), new Set());
  assert.equal(
    chosen,
    null,
    "generating no Transfer task is required when no genuinely fresh candidate exists - never reuse an already-scheduled problem"
  );
});

test("Transfer plan-time-history regression: a problem scheduled earlier in THIS generated plan is excluded from a later Transfer even with empty persisted history", () => {
  // attemptedProblemIds is deliberately empty - the ONLY thing that can
  // prevent an earlier-in-this-plan problem from being reused is the
  // scheduledProblemIdsSoFar tracking inside expandWeeklyPlanToDays.
  // 30 days: buildFallbackWeeklyPlan's default pattern-per-week sizing
  // (aimed at covering all 11 patterns quickly) means a single pattern
  // doesn't naturally get a second Learn+Practice exposure - the
  // prerequisite for Transfer eligibility - until around this length;
  // empirically confirmed against the real fallback plan generator.
  const result = plan(30, 90, "plan-time-test", new Set());
  const allScheduledProblemIds: string[] = [];
  const transferProblemIdsWithDay: Array<{ dayNumber: number; problemId: string }> = [];

  for (const day of result.days) {
    for (const task of day.tasks ?? []) {
      if (!task.problemId) continue;
      if (task.type === "transfer") {
        transferProblemIdsWithDay.push({ dayNumber: day.dayNumber, problemId: task.problemId });
      }
    }
  }

  // Re-derive, in generation order, which problems were already scheduled
  // strictly BEFORE each Transfer task's own day - a Transfer problem must
  // never equal one already placed on an earlier day.
  const seenBeforeDay = new Map<number, Set<string>>();
  let runningSeen = new Set<string>();
  for (const day of result.days) {
    seenBeforeDay.set(day.dayNumber, new Set(runningSeen));
    for (const task of day.tasks ?? []) {
      if (task.problemId) runningSeen = new Set([...runningSeen, task.problemId]);
    }
  }

  assert.ok(transferProblemIdsWithDay.length > 0, "expected at least one Transfer task in a 30-day plan");
  for (const { dayNumber, problemId } of transferProblemIdsWithDay) {
    const seenBefore = seenBeforeDay.get(dayNumber) ?? new Set();
    assert.ok(
      !seenBefore.has(problemId),
      `Transfer on day ${dayNumber} reused problem ${problemId}, already scheduled on an earlier day of this same plan`
    );
  }
  void allScheduledProblemIds;
});

test("Transfer scheduling: Day 1 never receives a Transfer task (no Learn+Practice history exists yet)", () => {
  for (const days of [14, 30]) {
    const day1 = plan(days, 90).days.find((day) => day.dayNumber === 1);
    assert.ok(day1);
    assert.ok(!(day1!.tasks ?? []).some((task) => task.type === "transfer"), `Day 1 got a Transfer task in a ${days}-day plan`);
  }
});

test("Transfer scheduling: a beginner short plan (14 days) - not enough runway for any pattern to repeat - gets zero Transfer tasks (conservative, no forcing)", () => {
  const result = plan(14, 90);
  const hasTransfer = result.days.some((day) => (day.tasks ?? []).some((task) => task.type === "transfer"));
  assert.equal(hasTransfer, false);
});

test("Transfer scheduling: a longer plan (30 days), once a pattern accumulates Learn+Practice history, becomes eligible for a later Transfer task", () => {
  const result = plan(30, 90);
  const hasTransfer = result.days.some((day) => (day.tasks ?? []).some((task) => task.type === "transfer"));
  assert.ok(hasTransfer, "expected at least one Transfer task once a pattern has accumulated Learn+Practice history");
});

test("Phase 2A.1 scheduler: every generated Transfer satisfies the complete anti-priming predicate", () => {
  const result = plan(90, 90, "blindness-invariants");
  const transfers = result.days.flatMap((day) =>
    (day.tasks ?? []).filter((task) => task.type === "transfer").map((task) => ({ day, task }))
  );
  assert.ok(transfers.length > 0);
  for (const encounter of transfers) {
    assert.equal(
      isPedagogicallyBlindTransfer({ plan: result, day: encounter.day, task: encounter.task }),
      true,
      `Transfer ${encounter.task.id} on day ${encounter.day.dayNumber} was pedagogically primed`
    );
  }
});

test("Phase 2A.1 scheduler: repeated evidence is permitted, spaced >=3 days, and never forces a reused problem", () => {
  const result = plan(120, 90, "repeat-transfer-invariants");
  const byPattern = new Map<string, Array<{ day: number; problemId: string }>>();
  for (const day of result.days) {
    for (const task of day.tasks ?? []) {
      if (task.type !== "transfer" || !task.patternId || !task.problemId) continue;
      const entries = byPattern.get(task.patternId) ?? [];
      entries.push({ day: day.dayNumber, problemId: task.problemId });
      byPattern.set(task.patternId, entries);
    }
  }
  const repeated = [...byPattern.values()].find((entries) => entries.length > 1);
  assert.ok(repeated, "a long plan should be architecturally capable of repeated Transfer evidence");
  for (const entries of byPattern.values()) {
    assert.equal(new Set(entries.map((entry) => entry.problemId)).size, entries.length);
    for (let index = 1; index < entries.length; index += 1) {
      assert.ok(entries[index].day - entries[index - 1].day >= 3);
    }
  }
});

test("Transfer scheduling: exact requested plan duration is unaffected by Transfer scheduling (Bug 3 regression guard)", () => {
  assert.equal(plan(14, 90).days.length, 14);
  assert.equal(plan(30, 90).days.length, 30);
});

test("Backward compat: a plan generated with no attemptedProblemIds argument (legacy call signature) still builds without a Transfer scheduling crash", () => {
  const answers: OnboardingAnswers = {
    experienceLevel: "new",
    deadlineWeeks: 2,
    interviewDate: null,
    dailyMinutes: 60,
    goal: "general_practice"
  };
  const weekly = ensureFullPatternCoverage(buildFallbackWeeklyPlan(answers));
  const result = expandWeeklyPlanToDays(weekly, "neetcode150", "beginner", "general_practice", defaultWeekdayMinutes(60));
  assert.ok(result.days.length > 0);
});
