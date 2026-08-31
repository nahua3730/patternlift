import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDailySession, type SessionStep } from "@/lib/session";
import { buildRemediationBranch, sessionStorageKey } from "@/lib/session-runtime";
import type { CurriculumDay } from "@/lib/curriculum-agent";
import type { StudyTask } from "@/lib/study-plan";

test("sessionStorageKey: two different accepted plans (different users, or the same user re-generating) never produce the same key for the same day number", () => {
  const keyA = sessionStorageKey("run-account-a", 1);
  const keyB = sessionStorageKey("run-account-b", 1);
  assert.notEqual(keyA, keyB, "Account A's Day 1 progress must never share a localStorage key with Account B's Day 1");

  const oldPlan = sessionStorageKey("run-old-plan", 1);
  const newPlan = sessionStorageKey("run-new-plan", 1);
  assert.notEqual(
    oldPlan,
    newPlan,
    "the same account re-generating a plan must not inherit Day 1 state from an older accepted plan"
  );
});

test("sessionStorageKey: the same plan and day number always produces the same key (refresh preserves progress)", () => {
  assert.equal(sessionStorageKey("run-abc", 1), sessionStorageKey("run-abc", 1));
});

test("sessionStorageKey: different day numbers within the same plan never collide", () => {
  assert.notEqual(sessionStorageKey("run-abc", 1), sessionStorageKey("run-abc", 2));
});

function coreTask(overrides: Partial<StudyTask> & { id: string }): StudyTask {
  return {
    type: "practice",
    priority: "A",
    bucket: "core",
    patternId: "hashing",
    problemId: `problem-${overrides.id}`,
    title: `Task ${overrides.id}`,
    estimatedMinutes: 25,
    ...overrides
  };
}

function learnDay(tasks: StudyTask[]): CurriculumDay {
  return {
    dayNumber: 1,
    weekNumber: 1,
    patternId: "hashing",
    patternLabel: "Hashing",
    studyMode: "learn",
    problemIds: tasks.filter((t) => t.problemId).map((t) => t.problemId as string),
    tasks
  };
}

test("Bug 1 regression: a 240-min day's 5 Core tasks are ALL represented by executable steps, none orphaned", () => {
  const tasks: StudyTask[] = [
    coreTask({ id: "0", type: "learn" }),
    coreTask({ id: "1" }),
    coreTask({ id: "2" }),
    coreTask({ id: "3" }),
    coreTask({ id: "4" })
  ];
  const day = learnDay(tasks);
  const session = buildDailySession(day, [], "guided");

  const stepStudyTaskIds = new Set(session.steps.map((step) => step.studyTaskId).filter(Boolean));
  for (const task of tasks) {
    assert.ok(
      stepStudyTaskIds.has(task.id),
      `task ${task.id} has no executable step - it would be orphaned exactly like the live-QA bug`
    );
  }
  // Every task-tagged step that's meant to run a problem (guided/independent)
  // carries a real problemId - "learn" steps are intentionally problem-less
  // pattern intros, not something to execute.
  for (const step of session.steps) {
    if (step.studyTaskId && (step.type === "guided_problem" || step.type === "independent_problem")) {
      assert.ok(step.problemId, `step ${step.id} for task ${step.studyTaskId} has no problemId to execute`);
    }
  }
});

test("deterministic task<->step mapping: two tasks that happen to share a problemId still map to distinct steps by studyTaskId, not by problemId", () => {
  const sharedProblemId = "lc209";
  const tasks: StudyTask[] = [
    coreTask({ id: "0", type: "learn", problemId: sharedProblemId }),
    coreTask({ id: "1", problemId: sharedProblemId }),
    coreTask({ id: "2", problemId: "other-problem" })
  ];
  const day = learnDay(tasks);
  const session = buildDailySession(day, [], "guided");

  const stepsForTask0 = session.steps.filter((step) => step.studyTaskId === "0");
  const stepsForTask1 = session.steps.filter((step) => step.studyTaskId === "1");
  assert.ok(stepsForTask0.length > 0);
  assert.ok(stepsForTask1.length > 0);
  // Both reference the same problemId, but no step is claimed by both tasks.
  const overlap = stepsForTask0.some((a) => stepsForTask1.some((b) => a.id === b.id));
  assert.equal(overlap, false, "a single step id must never be attributed to two different studyTaskIds");
});

test("review-type Core task's reflection step is tagged with that task's id (null-problemId task is still attributable)", () => {
  const reviewTask = coreTask({ id: "r", type: "review", problemId: undefined as unknown as string, estimatedMinutes: 20 });
  reviewTask.problemId = null as unknown as string;
  const tasks: StudyTask[] = [coreTask({ id: "0" }), reviewTask];
  const day = learnDay(tasks);
  const session = buildDailySession(day, [], "guided");

  const reflection = session.steps.find((step) => step.type === "reflection");
  assert.ok(reflection);
  assert.equal(reflection?.studyTaskId, "r");
});

test("legacy fallback: a day with no tasks[] behaves exactly as before - no studyTaskId anywhere, only primary/secondary problemIds used", () => {
  const day: CurriculumDay = {
    dayNumber: 3,
    weekNumber: 1,
    patternId: "hashing",
    patternLabel: "Hashing",
    studyMode: "practice",
    problemIds: ["p1", "p2", "p3"]
    // no tasks - legacy shape
  };
  const session = buildDailySession(day, [], "guided");

  assert.ok(session.steps.every((step) => step.studyTaskId === undefined));
  const problemIdsUsed = new Set(session.steps.map((step) => step.problemId).filter(Boolean));
  // Legacy behavior only ever surfaces the first two problemIds (primary/secondary) -
  // the third is never referenced, matching pre-Phase-1.1 behavior exactly.
  assert.ok(problemIdsUsed.has("p1"));
  assert.ok(problemIdsUsed.has("p2"));
  assert.ok(!problemIdsUsed.has("p3"));
});

test("remediation retry and remediation steps inherit studyTaskId from the original step", () => {
  const originalStep: SessionStep = {
    id: "guided-0",
    type: "guided_problem",
    studyTaskId: "0",
    title: "Guided: X",
    estimatedMinutes: 10,
    problemId: "problem-0",
    problemTitle: "X"
  };
  const branch = buildRemediationBranch({
    originalStep,
    activity: {
      id: "recognition_gap-generic",
      failureType: "recognition_gap",
      title: "Repair",
      estimatedMinutes: 3,
      kind: "binary_choice",
      nextAction: "retry_same_problem"
    } as never,
    supportPlan: { coachStyle: "guided", scaffoldLevel: 1, maxHintLevel: 3 } as never
  });

  assert.equal(branch[0].studyTaskId, "0");
  assert.equal(branch[1].studyTaskId, "0");
});

// Phase 2A: Transfer blindness + task ownership.

const ALLOWED_TRANSFER_ENCOUNTER_KEYS = new Set(["id", "type", "studyTaskId", "problemId", "title", "estimatedMinutes"]);

test("Phase 2A.1 blindness: the opaque transfer_encounter carries no answer-adjacent fields", () => {
  const transferTask = coreTask({ id: "t", type: "transfer", problemId: "lc128", estimatedMinutes: 30 });
  const tasks: StudyTask[] = [coreTask({ id: "0", type: "learn" }), transferTask];
  const day = learnDay(tasks);
  const session = buildDailySession(day, [], "guided");

  const blindStep = session.steps.find((step) => step.type === "transfer_encounter");
  assert.ok(blindStep, "expected one opaque transfer_encounter for the transfer task");

  // No patternId, patternLabel, contrastPatternId, contrastPatternLabel,
  // prompt, coachStyle, or any other field beyond the allowed minimum -
  // enumerate every OWN key actually present and check none are outside
  // the allow-list, rather than checking a few fields are falsy (which
  // would pass even if e.g. patternLabel were set to an empty string).
  const presentKeys = Object.keys(blindStep as object).filter(
    (key) => (blindStep as Record<string, unknown>)[key] !== undefined
  );
  for (const key of presentKeys) {
    assert.ok(
      ALLOWED_TRANSFER_ENCOUNTER_KEYS.has(key),
      `transfer_encounter must not carry "${key}" - it is not in the sanitized allow-list`
    );
  }
  assert.equal(blindStep!.studyTaskId, "t");
  assert.equal(blindStep!.problemId, "lc128");
});

test("Phase 2A.1 task ownership: session construction emits exactly one task-owned opaque encounter, never preconstructed solve/result steps", () => {
  const transferTask = coreTask({ id: "t", type: "transfer", problemId: "lc128", estimatedMinutes: 30 });
  const tasks: StudyTask[] = [coreTask({ id: "0", type: "learn" }), transferTask];
  const day = learnDay(tasks);
  const session = buildDailySession(day, [], "guided");

  const transferSteps = session.steps.filter((step) => step.studyTaskId === "t");
  const types = transferSteps.map((step) => step.type).sort();
  assert.deepEqual(types, ["transfer_encounter"]);
  assert.ok(!session.steps.some((step) => step.type === "blind_prediction" || step.type === "transfer_result"));
  assert.ok(!transferSteps.some((step) => step.patternId || step.patternLabel || step.contrastPatternId));
});

test("Phase 2A.1: a day with no transfer task generates no Transfer step (backward compat)", () => {
  const tasks: StudyTask[] = [coreTask({ id: "0", type: "learn" }), coreTask({ id: "1" })];
  const day = learnDay(tasks);
  const session = buildDailySession(day, [], "guided");
  assert.ok(!session.steps.some((step) => step.type === "blind_prediction" || step.type === "transfer_result" || step.type === "transfer_encounter"));
});

// Pilot Foundation: a guided curriculum day (e.g. Carl's "Arrays") has no
// single day-level pattern - day.patternId is null, day.patternLabel is a
// topic label. The FIRST task-driven step of the day must still derive its
// own patternId/patternLabel from that specific task, never from the day -
// exactly like every subsequent task-driven step (pushIndependentForTask)
// already does. Regression for the latent asymmetry found during the Carl
// pilot's architecture review.
function guidedDay(tasks: StudyTask[], studyMode: CurriculumDay["studyMode"] = "learn"): CurriculumDay {
  return {
    dayNumber: 1,
    weekNumber: 1,
    patternId: null,
    patternLabel: "Arrays",
    topicLabel: "Arrays",
    studyMode,
    problemIds: tasks.filter((t) => t.problemId).map((t) => t.problemId as string),
    tasks
  };
}

test("Guided curriculum: the first task's guided_problem step uses the TASK's own patternId, not the day's null/topic patternId", () => {
  const learnTask = coreTask({
    id: "0",
    type: "learn",
    patternId: "binary-search",
    problemId: "binary-search"
  });
  const day = guidedDay([learnTask], "learn");
  const session = buildDailySession(day, [], "guided");

  const guidedStep = session.steps.find((step) => step.type === "guided_problem" && step.studyTaskId === "0");
  assert.ok(guidedStep, "expected a guided_problem step for the anchored Learn task");
  assert.equal(guidedStep!.patternId, "binary-search");
  assert.equal(guidedStep!.patternLabel, "Binary Search");
  assert.notEqual(guidedStep!.patternLabel, "Arrays", "must not fall back to the day's topic label");
});

test("Guided curriculum: a broad Learn resource with no anchor problem gets patternId undefined, not a fabricated pattern", () => {
  const learnTask: StudyTask = {
    id: "0",
    type: "learn",
    priority: "A",
    bucket: "core",
    patternId: null,
    problemId: null,
    title: "Array Fundamentals",
    estimatedMinutes: 15,
    learnResource: { title: "Array Fundamentals", url: "https://example.com/arrays", provider: "Carl" }
  };
  const day = guidedDay([learnTask], "learn");
  const session = buildDailySession(day, [], "guided");

  const learnStep = session.steps.find((step) => step.type === "learn" && step.studyTaskId === "0");
  assert.ok(learnStep, "expected a learn step");
  assert.equal(learnStep!.patternId, undefined, "no anchor problem means no pattern to attribute mastery evidence to");
  assert.deepEqual(learnStep!.learnResource, learnTask.learnResource);
  // No guided_problem step should be generated - there is no problem to solve.
  assert.ok(!session.steps.some((step) => step.type === "guided_problem" && step.studyTaskId === "0"));
});

test("Guided curriculum: the learn step's curriculumContext carries the topic label, distinct from the anchor problem's authoritative pattern", () => {
  const learnTask = coreTask({
    id: "0",
    type: "learn",
    patternId: "two-pointers",
    problemId: "reverse-linked-list"
  });
  const day = guidedDay([learnTask], "learn");
  const session = buildDailySession(day, [], "guided");

  const learnStep = session.steps.find((step) => step.type === "learn" && step.studyTaskId === "0");
  assert.ok(learnStep);
  assert.equal(learnStep!.curriculumContext, "Arrays", "curriculumContext must carry the day's topic, not the pattern");
  assert.equal(learnStep!.patternId, "two-pointers", "the authoritative pattern must still be preserved for technique content/evidence");
  assert.equal(learnStep!.patternLabel, "Two Pointers");
  assert.notEqual(learnStep!.curriculumContext, learnStep!.patternLabel);
});

test("Generated plans: curriculumContext stays undefined, learn step behavior unchanged", () => {
  const learnTask = coreTask({ id: "0", type: "learn", patternId: "hashing", problemId: "two-sum" });
  const day = learnDay([learnTask]);
  const session = buildDailySession(day, [], "guided");

  const learnStep = session.steps.find((step) => step.type === "learn" && step.studyTaskId === "0");
  assert.ok(learnStep);
  assert.equal(learnStep!.curriculumContext, undefined);
});

test("Guided curriculum: two Practice problems on one topic day can carry different authoritative patternIds", () => {
  const taskA = coreTask({ id: "a", type: "practice", patternId: "binary-search", problemId: "binary-search" });
  const taskB = coreTask({ id: "b", type: "practice", patternId: "two-pointers", problemId: "three-sum" });
  const day = guidedDay([taskA, taskB], "practice");
  const session = buildDailySession(day, [], "guided");

  const stepA = session.steps.find((step) => step.studyTaskId === "a");
  const stepB = session.steps.find((step) => step.studyTaskId === "b");
  assert.ok(stepA && stepB);
  assert.equal(stepA!.patternId, "binary-search");
  assert.equal(stepB!.patternId, "two-pointers");
  assert.notEqual(stepA!.patternId, stepB!.patternId, "one topic day must not collapse distinct problems onto one pattern");
});
