import assert from "node:assert/strict";
import { test } from "node:test";
import { getReviewSchedule } from "@/lib/review-schedule";

test("getReviewSchedule: default behavior (no options) is unchanged - confused/partial/solid curve", () => {
  assert.equal(getReviewSchedule("confused").intervalDays, 1);
  assert.equal(getReviewSchedule("partial", 0).intervalDays, 2);
  assert.equal(getReviewSchedule("solid", 0).intervalDays, 7);
  assert.equal(getReviewSchedule("solid", 7).intervalDays, 14);
});

test("getReviewSchedule: 1-3-7 seed - first A-priority solid review is scheduled 3 days out", () => {
  const first = getReviewSchedule("solid", 0, { isPriorityA: true, repetitions: 0 });
  assert.equal(first.intervalDays, 3);
});

test("getReviewSchedule: 1-3-7 seed - second A-priority solid review lands around day 7", () => {
  const second = getReviewSchedule("solid", 3, { isPriorityA: true, repetitions: 1 });
  assert.equal(second.intervalDays, 4);
});

test("getReviewSchedule: 1-3-7 seed only applies to a genuinely solid outcome", () => {
  const confused = getReviewSchedule("confused", 0, { isPriorityA: true, repetitions: 0 });
  assert.equal(confused.intervalDays, 1);
  const partial = getReviewSchedule("partial", 0, { isPriorityA: true, repetitions: 0 });
  assert.notEqual(partial.intervalDays, 3);
});

test("getReviewSchedule: after two A-priority repetitions, falls back to the normal expanding curve", () => {
  const third = getReviewSchedule("solid", 4, { isPriorityA: true, repetitions: 2 });
  assert.equal(third.intervalDays, 8);
});

test("getReviewSchedule: mastery >= 2 (solid outcome) trends toward LONGER intervals, mastery 0-1 (confused) toward SHORTER", () => {
  const weak = getReviewSchedule("confused", 10);
  const strong = getReviewSchedule("solid", 10);
  assert.ok(weak.intervalDays < strong.intervalDays);
});
