import assert from "node:assert/strict";
import { test } from "node:test";
import { pickRemediation } from "@/lib/remediation";
import { buildRemediationBranch } from "@/lib/session";
import type { SessionStep } from "@/lib/session";
import type { SupportPlan } from "@/lib/support-plan";
import type { FailureCategory } from "@/lib/diagnosis";

const ALL_FAILURE_TYPES: FailureCategory[] = [
  "recognition_gap",
  "concept_gap",
  "reasoning_gap",
  "transition_gap",
  "implementation_gap",
  "edge_case_gap",
  "recall_gap",
  "mixed"
];

// Case A: recognition_gap should get a contrast-style choice drill, not a
// code-writing task - the point is deciding WHICH technique fits, not
// implementing anything yet.
test("A: recognition_gap remediation is a choice, never a code-writing interaction", () => {
  const activity = pickRemediation("sliding-window", "recognition_gap");
  assert.ok(activity);
  assert.notEqual(activity!.interactionType, "code_fragment");
  assert.notEqual(activity!.interactionType, "micro_implementation");
});

test("recognition_gap remediation reuses generic fallback for a technique with no hand-authored entry", () => {
  const activity = pickRemediation("union-find", "recognition_gap");
  assert.ok(activity);
  assert.equal(activity!.techniqueId, "generic");
});

test("insufficient_evidence gets no remediation drill - honest, not a guess", () => {
  const activity = pickRemediation("sliding-window", "insufficient_evidence");
  assert.equal(activity, null);
});

test("every real failure type has at least a generic fallback drill", () => {
  for (const failureType of ALL_FAILURE_TYPES) {
    const activity = pickRemediation(null, failureType);
    assert.ok(activity, `expected a remediation for ${failureType}`);
  }
});

// Case G: a retry step produced by the branch builder always carries
// retryOfStepId - that's the structural mechanism session-runner uses to
// refuse to branch a second time off the same original step, which is
// what actually prevents an infinite remediation loop.
test("G: a remediation retry step is marked so it can never branch again", () => {
  const originalStep: SessionStep = {
    id: "guided-1",
    type: "guided_problem",
    title: "Guided: Minimum Size Subarray Sum",
    estimatedMinutes: 9,
    patternId: "sliding-window",
    patternLabel: "Sliding Window",
    problemId: "min-size-subarray",
    problemTitle: "Minimum Size Subarray Sum"
  };
  const activity = pickRemediation("sliding-window", "reasoning_gap");
  assert.ok(activity);
  const supportPlan: SupportPlan = { scaffoldLevel: 2, maxHintLevel: 4, coachStyle: "guided", reason: "test" };

  const [remediationStep, retryStep] = buildRemediationBranch({
    originalStep,
    activity: activity!,
    supportPlan
  });

  assert.equal(remediationStep.type, "remediation");
  assert.equal(remediationStep.failureType, "reasoning_gap");
  assert.equal(retryStep.retryOfStepId, originalStep.id);
  assert.equal(retryStep.problemId, originalStep.problemId);
  assert.equal(retryStep.supportPlan, supportPlan);

  // A second branch attempt off the RETRY step is what session-runner
  // refuses (it checks retryOfStepId before ever calling this again) -
  // assert the flag that check relies on is actually set.
  assert.ok(retryStep.retryOfStepId, "retry step must be flagged to prevent re-branching");
});

test("fresh_problem remediation uses the supplied fresh problem for the retry", () => {
  const originalStep: SessionStep = {
    id: "recall-1",
    type: "recall",
    title: "Recall: Two Sum",
    estimatedMinutes: 3,
    patternId: "sliding-window",
    patternLabel: "Sliding Window",
    problemId: "min-size-subarray",
    problemTitle: "Minimum Size Subarray Sum"
  };
  const activity = pickRemediation("sliding-window", "recall_gap");
  assert.ok(activity);
  assert.equal(activity!.nextAction, "fresh_problem");
  const supportPlan: SupportPlan = { scaffoldLevel: 1, maxHintLevel: 3, coachStyle: "guided", reason: "test" };

  const [, retryStep] = buildRemediationBranch({
    originalStep,
    activity: activity!,
    supportPlan,
    freshProblemId: "longest-substring",
    freshProblemTitle: "Longest Substring Without Repeating Characters"
  });

  assert.equal(retryStep.problemId, "longest-substring");
  assert.notEqual(retryStep.problemId, originalStep.problemId);
});
