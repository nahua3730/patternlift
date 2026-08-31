import assert from "node:assert/strict";
import { test } from "node:test";
import type { CurriculumDay, CurriculumPlan } from "@/lib/curriculum-agent";
import type { StudyTask } from "@/lib/study-plan";
import { isPedagogicallyBlindTransfer } from "@/lib/transfer-safety";

function task(id: string, type: StudyTask["type"], patternId: string | null, problemId: string | null): StudyTask {
  return { id, type, priority: "A", bucket: "core", patternId, problemId, title: id, estimatedMinutes: 20 };
}

function day(dayNumber: number, patternId: string | null, tasks: StudyTask[]): CurriculumDay {
  return {
    dayNumber,
    weekNumber: 1,
    patternId,
    patternLabel: patternId ?? "Mixed review",
    studyMode: patternId ? "practice" : "review",
    problemIds: tasks.flatMap((entry) => entry.problemId ? [entry.problemId] : []),
    tasks
  };
}

function safePlan() {
  const target = "hashing";
  const transfer = task("transfer", "transfer", target, "official-valid-anagram");
  const days = [
    day(1, target, [task("learn", "learn", target, "two-sum"), task("practice", "practice", target, "contains-duplicate")]),
    day(2, null, [task("review", "review", null, null)]),
    day(3, "binary-search", [task("host", "practice", "binary-search", "binary-search"), transfer])
  ];
  return { plan: { days } as CurriculumPlan, day: days[2], task: transfer };
}

test("pedagogically blind Transfer accepts prior Learn+Practice, an intervening day, and a different clean host", () => {
  assert.equal(isPedagogicallyBlindTransfer(safePlan()), true);
});

test("same-day target teaching/practice contaminates an otherwise eligible Transfer", () => {
  const input = safePlan();
  input.day.tasks!.unshift(task("prime", "practice", "hashing", "two-sum"));
  assert.equal(isPedagogicallyBlindTransfer(input), false);
});

test("same-target host day and missing intervening day both fail closed", () => {
  const sameHost = safePlan();
  sameHost.day.patternId = "hashing";
  assert.equal(isPedagogicallyBlindTransfer(sameHost), false);

  const noGap = safePlan();
  noGap.plan.days[0].dayNumber = 2;
  assert.equal(isPedagogicallyBlindTransfer(noGap), false);
});

test("repeated Transfer for one pattern is allowed only after at least three plan days", () => {
  const input = safePlan();
  const previous = task("previous-transfer", "transfer", "hashing", "official-group-anagrams");
  input.plan.days.splice(2, 0, day(2, "binary-search", [previous]));
  assert.equal(isPedagogicallyBlindTransfer(input), false);

  input.plan.days.find((entry) => entry.tasks?.some((entryTask) => entryTask.id === "previous-transfer"))!.dayNumber = 0;
  assert.equal(isPedagogicallyBlindTransfer(input), true);
});

// Phase 2A.1 follow-up: a Transfer demoted to ordinary practice (task.type
// becomes "practice", patternId is deliberately left as the real target
// pattern - see the generation-time post-pass in curriculum-agent.ts) must
// still count as a genuine exposure to that pattern for any LATER scored
// Transfer of the same pattern - otherwise a demoted encounter could be
// followed immediately by a "blind" Transfer the learner was just shown.
test("a Transfer demoted to ordinary practice still counts as a practice-day exposure for a later scored Transfer", () => {
  const target = "hashing";
  const baseDays = () => [
    day(1, target, [task("learn", "learn", target, "two-sum"), task("practice", "practice", target, "contains-duplicate")]),
    day(2, null, [task("review", "review", null, null)]),
    day(3, "binary-search", [
      task("host3", "practice", "binary-search", "binary-search"),
      task("demoted", "practice", target, "official-group-anagrams")
    ])
  ];

  // Day 4: only 1 day after the demoted exposure - insufficient spacing,
  // must fail closed exactly like it would against a genuine practice day.
  const tooSoon = task("too-soon-transfer", "transfer", target, "official-valid-anagram");
  const day4 = day(4, "two-pointers", [task("host4", "practice", "two-pointers", "two-pointers"), tooSoon]);
  assert.equal(
    isPedagogicallyBlindTransfer({ plan: { days: [...baseDays(), day4] } as CurriculumPlan, day: day4, task: tooSoon }),
    false,
    "a scored Transfer just 1 day after a demoted-practice exposure to the same pattern must still fail closed"
  );

  // Day 5: 2 days after the demoted exposure (day4 above was a rejected
  // candidate, never actually part of this plan - a real candidate that
  // fails this check gets demoted at generation time, not left as a
  // pending Transfer) - spacing is satisfied, safe to score again.
  const safeAgain = task("safe-transfer", "transfer", target, "official-valid-anagram");
  const day5 = day(5, "two-pointers", [task("host5", "practice", "two-pointers", "two-pointers"), safeAgain]);
  assert.equal(
    isPedagogicallyBlindTransfer({ plan: { days: [...baseDays(), day5] } as CurriculumPlan, day: day5, task: safeAgain }),
    true,
    "once spacing since the demoted-practice exposure is satisfied, a scored Transfer is safe again"
  );
});
