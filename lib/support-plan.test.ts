import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseSupportPlan } from "@/lib/support-plan";
import { nextScaffoldLevel } from "@/lib/scaffold";
import type { TechniqueSkillVector, DimensionScore } from "@/lib/skill-vector";

function dim(score: number, evidenceCount = 5): DimensionScore {
  return { score, confidence: 0.8, evidenceCount };
}
function empty(): DimensionScore {
  return { score: 0, confidence: 0, evidenceCount: 0 };
}

function vector(overrides: Partial<TechniqueSkillVector>): TechniqueSkillVector {
  const base: TechniqueSkillVector = {
    recognition: empty(),
    concept: empty(),
    reasoning: empty(),
    implementation: empty(),
    independence: empty(),
    retention: empty(),
    overall: 0
  };
  return { ...base, ...overrides };
}

// Case B: reasoning_gap with strong recognition -> heavier scaffold and at
// least "guided" support, since a shaky invariant needs more help, not less.
test("B: weak reasoning with strong recognition raises the support floor", () => {
  const plan = chooseSupportPlan({
    skills: vector({ recognition: dim(90), reasoning: dim(40), overall: 60 }),
    defaultCoachStyle: "optional"
  });
  assert.equal(plan.scaffoldLevel, 3);
  assert.notEqual(plan.coachStyle, "optional");
});

// Case C: implementation_gap with strong reasoning -> partial skeleton
// (level 2), not the heaviest scaffold - the concept is fine, only the
// code construction needs support.
test("C: strong recognition + reasoning, weak implementation -> partial skeleton, not full reteach", () => {
  const plan = chooseSupportPlan({
    skills: vector({
      recognition: dim(90),
      concept: dim(85),
      reasoning: dim(85),
      implementation: dim(35),
      overall: 65
    }),
    defaultCoachStyle: "guided"
  });
  assert.equal(plan.scaffoldLevel, 2);
});

// Case D: strong implementation but weak independence -> reduce scaffold
// and hint depth, push toward an independent retry.
test("D: strong implementation, weak independence -> reduced scaffold and hint cap", () => {
  const plan = chooseSupportPlan({
    skills: vector({
      recognition: dim(90),
      concept: dim(85),
      reasoning: dim(85),
      implementation: dim(88),
      independence: dim(35),
      overall: 75
    }),
    defaultCoachStyle: "guided"
  });
  assert.ok(plan.scaffoldLevel <= 1);
  assert.ok(plan.maxHintLevel <= 2);
  assert.equal(plan.coachStyle, "optional");
});

// Case E: successful scaffold progression fades toward independence.
test("E: two consecutive successes fade the scaffold level down", () => {
  const afterFirst = nextScaffoldLevel(3, true);
  assert.equal(afterFirst, 2);
  const afterSecond = nextScaffoldLevel(afterFirst, true);
  assert.ok(afterSecond <= 1);
});

// Case F: recall_gap after prior mastery -> light support (recall nudge),
// explicitly NOT a return to heavy beginner scaffold.
test("F: regression after prior mastery gets light support, not heavy scaffold", () => {
  const plan = chooseSupportPlan({
    skills: vector({ recognition: dim(80), overall: 70 }),
    defaultCoachStyle: "guided",
    recentFailureAfterPriorMastery: true
  });
  assert.equal(plan.scaffoldLevel, 1);
  assert.notEqual(plan.scaffoldLevel, 3);
});

test("no evidence yet falls back to the existing default experience", () => {
  const plan = chooseSupportPlan({ defaultCoachStyle: "guided" });
  assert.equal(plan.scaffoldLevel, 2);
  assert.equal(plan.maxHintLevel, 5);
});

test("consistently strong overall -> independent, minimal support", () => {
  const plan = chooseSupportPlan({
    skills: vector({
      recognition: dim(92),
      concept: dim(88),
      reasoning: dim(90),
      implementation: dim(90),
      independence: dim(85),
      overall: 90
    }),
    defaultCoachStyle: "guided"
  });
  assert.equal(plan.scaffoldLevel, 0);
  assert.equal(plan.coachStyle, "optional");
});

// Three distinct learner profiles from the spec's own success criteria
// must land on visibly different plans, not the same "default" support.
test("three learner profiles (A/B/C from the spec) get visibly different plans", () => {
  const learnerA = chooseSupportPlan({
    skills: vector({ recognition: dim(90), reasoning: dim(40), overall: 60 }),
    defaultCoachStyle: "guided"
  });
  const learnerB = chooseSupportPlan({
    skills: vector({ recognition: dim(90), concept: dim(85), reasoning: dim(85), implementation: dim(35), overall: 65 }),
    defaultCoachStyle: "guided"
  });
  const learnerC = chooseSupportPlan({
    skills: vector({
      recognition: dim(90),
      concept: dim(85),
      reasoning: dim(85),
      implementation: dim(88),
      independence: dim(35),
      overall: 75
    }),
    defaultCoachStyle: "guided"
  });

  const signatures = [learnerA, learnerB, learnerC].map((plan) => `${plan.scaffoldLevel}-${plan.maxHintLevel}-${plan.coachStyle}`);
  assert.equal(new Set(signatures).size, 3, `expected three distinct plans, got ${signatures.join(", ")}`);
});
