import assert from "node:assert/strict";
import { test } from "node:test";
import { splitByBudget } from "@/lib/today-schedule";

function task(id: string, estimatedMinutes: number) {
  return { id, estimatedMinutes };
}

test("splitByBudget: everything fits when total is within budget", () => {
  const { active, queued } = splitByBudget([task("a", 20), task("b", 20)], 60);
  assert.deepEqual(active.map((t) => t.id), ["a", "b"]);
  assert.deepEqual(queued, []);
});

test("splitByBudget: overflow beyond the budget stays queued, not dropped", () => {
  const { active, queued } = splitByBudget([task("a", 30), task("b", 30), task("c", 40)], 60);
  assert.deepEqual(active.map((t) => t.id), ["a", "b"]);
  assert.deepEqual(queued.map((t) => t.id), ["c"]);
});

test("splitByBudget: the first task is always active even if it alone exceeds the budget (never leaves the list empty)", () => {
  const { active, queued } = splitByBudget([task("a", 90)], 60);
  assert.deepEqual(active.map((t) => t.id), ["a"]);
  assert.deepEqual(queued, []);
});

test("splitByBudget: ordering is respected - callers control priority by list order (oldest carryover day first)", () => {
  const { active, queued } = splitByBudget([task("old", 40), task("new", 40)], 40);
  assert.deepEqual(active.map((t) => t.id), ["old"]);
  assert.deepEqual(queued.map((t) => t.id), ["new"]);
});

test("splitByBudget: an empty task list produces empty active and queued", () => {
  const { active, queued } = splitByBudget([], 60);
  assert.deepEqual(active, []);
  assert.deepEqual(queued, []);
});
