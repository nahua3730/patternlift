import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGuidedPlan } from "@/lib/guided-curriculum";
import { carlPilotDays } from "@/lib/curricula/carl";
import { isPedagogicallyBlindTransfer } from "@/lib/transfer-safety";

function plan() {
  return buildGuidedPlan(carlPilotDays, {
    planId: "test-carl",
    dailyMinutes: 60,
    headline: "Carl's Plan",
    rationale: "test"
  });
}

test("Carl adapter produces a valid CurriculumPlan shape - one day per definition, with tasks", () => {
  const result = plan();
  assert.equal(result.days.length, carlPilotDays.length);
  for (const day of result.days) {
    assert.ok(Array.isArray(day.tasks));
    assert.ok(day.tasks!.length > 0, `day ${day.dayNumber} produced no tasks`);
    // A guided day never claims one authoritative pattern - topicLabel
    // carries the display concept instead.
    assert.equal(day.patternId, null);
    assert.ok(day.topicLabel, `day ${day.dayNumber} is missing a topicLabel`);
  }
});

test("Two Practice problems on one Arrays day can have different authoritative patternIds", () => {
  const result = plan();
  const arraysDay = result.days.find((day) => day.topicLabel === "Arrays" && (day.tasks ?? []).some((t) => t.type === "practice"));
  assert.ok(arraysDay, "expected at least one Arrays day with a practice task");
  const patternIds = new Set(
    (arraysDay!.tasks ?? []).filter((task) => task.problemId).map((task) => task.patternId)
  );
  assert.ok(patternIds.size >= 2, `expected at least two distinct patterns on an Arrays day, got ${[...patternIds]}`);
});

test("A broad Learn resource with no anchor problem produces patternId: null, not a fabricated pattern", () => {
  const result = plan();
  const dayWithBareResource = result.days.find(
    (day) => (day.tasks ?? []).some((task) => task.type === "learn" && task.learnResource && !task.problemId)
  );
  assert.ok(dayWithBareResource, "expected at least one Learn task with a resource but no anchor problem in the pilot data");
  const learnTask = dayWithBareResource!.tasks!.find((task) => task.type === "learn" && !task.problemId);
  assert.equal(learnTask!.patternId, null);
});

test("A Review day produces a single generic review task, no fabricated pattern or problem", () => {
  const result = plan();
  const reviewDay = result.days.find((day) => day.studyMode === "review");
  assert.ok(reviewDay, "expected at least one Review day in the pilot data");
  assert.equal(reviewDay!.patternId, null);
  for (const task of reviewDay!.tasks ?? []) {
    assert.equal(task.patternId, null);
    assert.equal(task.problemId, null);
  }
});

test("Every guided task id is unique across the whole plan (globally unique, embeds the plan id)", () => {
  const result = plan();
  const ids = result.days.flatMap((day) => (day.tasks ?? []).map((task) => task.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.includes("test-carl")));
});

test("The Carl pilot slice generates zero Transfer tasks - deliberately deferred, not auto-scheduled into guided plans yet", () => {
  const result = plan();
  const transferTasks = result.days.flatMap((day) => (day.tasks ?? []).filter((task) => task.type === "transfer"));
  assert.equal(transferTasks.length, 0);
});

test("isPedagogicallyBlindTransfer accepts the guided CurriculumPlan shape without throwing (compatibility check - no guided-specific branch needed there)", () => {
  const result = plan();
  const someDay = result.days[0];
  const fakeTransferTask = { ...someDay.tasks![0], type: "transfer" as const };
  assert.doesNotThrow(() => isPedagogicallyBlindTransfer({ plan: result, day: someDay, task: fakeTransferTask }));
});
