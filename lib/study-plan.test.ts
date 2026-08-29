import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assignPriority,
  bucketTasks,
  masteryGradeFor,
  synthesizeTasksFromLegacyDay,
  type Priority
} from "@/lib/study-plan";

test("assignPriority: base high-frequency patterns are A regardless of goal", () => {
  assert.equal(assignPriority("hashing", "general_practice"), "A");
  assert.equal(assignPriority("two-pointers", "oa_prep"), "A");
  assert.equal(assignPriority("sliding-window", "swe_internship"), "A");
});

test("assignPriority: goal overrides shift priority deterministically", () => {
  assert.equal(assignPriority("dynamic-programming", "general_practice"), "B");
  assert.equal(assignPriority("dynamic-programming", "swe_internship"), "A");
  assert.equal(assignPriority("dynamic-programming", "new_grad"), "A");
  assert.equal(assignPriority("dynamic-programming", "oa_prep"), "C");
  assert.equal(assignPriority("greedy", "general_practice"), "B");
  assert.equal(assignPriority("greedy", "oa_prep"), "A");
});

test("assignPriority: unknown/null pattern defaults to B, never crashes", () => {
  assert.equal(assignPriority(null, "general_practice"), "B");
  assert.equal(assignPriority("not-a-real-pattern", "general_practice"), "B");
});

function task(priority: Priority, estimatedMinutes: number) {
  return { priority, estimatedMinutes };
}

test("bucketTasks: fills Core with A tasks first, up to the guaranteed budget", () => {
  const tasks = [task("A", 25), task("A", 25), task("B", 25)];
  const result = bucketTasks(tasks, 50);
  assert.deepEqual(
    result.map((t) => t.bucket),
    ["core", "core", "bonus"]
  );
});

test("bucketTasks: B tasks only enter Core once A tasks are placed, and B comes before C in Bonus ordering", () => {
  const tasks = [task("C", 20), task("B", 20), task("A", 20)];
  const result = bucketTasks(tasks, 20);
  // Only one A task fits the guaranteed budget - it goes to Core; B and C
  // both spill to Bonus, but B is still ordered ahead of C within Bonus.
  const core = result.filter((t) => t.bucket === "core");
  const bonus = result.filter((t) => t.bucket === "bonus");
  assert.equal(core.length, 1);
  assert.equal(core[0].priority, "A");
  assert.deepEqual(
    bonus.map((t) => t.priority),
    ["B", "C"]
  );
});

test("bucketTasks: Core is never empty when at least one task exists, even over a tight budget", () => {
  const tasks = [task("A", 90)];
  const result = bucketTasks(tasks, 30);
  assert.equal(result[0].bucket, "core");
});

test("bucketTasks: empty task list returns empty result without error", () => {
  assert.deepEqual(bucketTasks([], 120), []);
});

// masteryGradeFor - one representative case per grade, per the spec's own
// four definitions.
test("masteryGradeFor: 0 - never recognized the pattern", () => {
  assert.equal(masteryGradeFor({ recognizedCorrectly: false, outcome: "confused" }), 0);
  // Even a "solid" outcome can't overcome not recognizing the pattern -
  // grade 0 is specifically about recognition, not final code quality.
  assert.equal(masteryGradeFor({ recognizedCorrectly: false, outcome: "solid", highestHintLevel: 0 }), 0);
});

test("masteryGradeFor: 0 - recognized but ended up confused anyway", () => {
  assert.equal(masteryGradeFor({ recognizedCorrectly: true, outcome: "confused", highestHintLevel: 1 }), 0);
});

test("masteryGradeFor: 1 - recognized the direction but needed a meaningful hint", () => {
  assert.equal(masteryGradeFor({ recognizedCorrectly: true, outcome: "solid", highestHintLevel: 4 }), 1);
  assert.equal(masteryGradeFor({ recognizedCorrectly: true, outcome: "partial", highestHintLevel: 2 }), 1);
});

test("masteryGradeFor: 2 - recognized and solved independently, but with some hesitation", () => {
  assert.equal(masteryGradeFor({ recognizedCorrectly: true, outcome: "solid", highestHintLevel: 2 }), 2);
  assert.equal(masteryGradeFor({ recognizedCorrectly: true, outcome: "partial", highestHintLevel: 1 }), 2);
  assert.equal(masteryGradeFor({ recognizedCorrectly: true, outcome: "partial", highestHintLevel: 0 }), 2);
});

test("masteryGradeFor: 3 - recognized quickly and solved independently with no hesitation", () => {
  assert.equal(masteryGradeFor({ recognizedCorrectly: true, outcome: "solid", highestHintLevel: 0 }), 3);
  assert.equal(masteryGradeFor({ recognizedCorrectly: true, outcome: "solid" }), 3);
});

test("synthesizeTasksFromLegacyDay: old-shape practice day becomes core tasks, one per problem", () => {
  const tasks = synthesizeTasksFromLegacyDay({
    dayNumber: 3,
    patternId: "hashing",
    patternLabel: "Hash Map / Set",
    studyMode: "practice",
    problemIds: ["two-sum", "contains-duplicate"]
  });
  assert.equal(tasks.length, 2);
  assert.ok(tasks.every((t) => t.bucket === "core"));
  assert.ok(tasks.every((t) => t.type === "practice"));
});

test("synthesizeTasksFromLegacyDay: old-shape learn day marks the first task as learn", () => {
  const tasks = synthesizeTasksFromLegacyDay({
    dayNumber: 1,
    patternId: "hashing",
    patternLabel: "Hash Map / Set",
    studyMode: "learn",
    problemIds: ["two-sum", "contains-duplicate"]
  });
  assert.equal(tasks[0].type, "learn");
  assert.equal(tasks[1].type, "practice");
});

test("synthesizeTasksFromLegacyDay: old-shape review day (no problemIds) synthesizes one review task", () => {
  const tasks = synthesizeTasksFromLegacyDay({
    dayNumber: 7,
    patternId: null,
    patternLabel: "Mixed review",
    studyMode: "review",
    problemIds: []
  });
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].type, "review");
});

test("masteryGradeFor: three different learner profiles land on three different grades", () => {
  const strong = masteryGradeFor({ recognizedCorrectly: true, outcome: "solid", highestHintLevel: 0 });
  const shaky = masteryGradeFor({ recognizedCorrectly: true, outcome: "solid", highestHintLevel: 2 });
  const missed = masteryGradeFor({ recognizedCorrectly: false, outcome: "confused" });
  assert.equal(new Set([strong, shaky, missed]).size, 3);
});
