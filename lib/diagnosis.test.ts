import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnoseAttempt } from "@/lib/diagnosis";

// Six cases, each a distinct learner profile - the point is not just that
// each classifies "correctly" in isolation, but that DIFFERENT profiles
// produce DIFFERENT diagnoses and DIFFERENT recommended actions, per the
// spec's own acceptance criterion.

test("A: correct recognition, solid outcome, low hints -> no failure to diagnose", () => {
  const result = diagnoseAttempt({
    selectedPatternLabel: "Sliding Window",
    actualPatternLabel: "Sliding Window",
    outcome: "solid",
    explanationScore: 88,
    codePassed: true,
    hintsUsed: 0
  });
  assert.equal(result.primaryFailure, null);
  assert.equal(result.recommendedNextAction, null);
});

test("B: wrong recognition with high confidence -> recognition_gap, contrast_drill", () => {
  const result = diagnoseAttempt({
    selectedPatternLabel: "Two Pointers",
    actualPatternLabel: "Sliding Window",
    outcome: "confused",
    confidence: 4
  });
  assert.equal(result.primaryFailure, "recognition_gap");
  assert.equal(result.recommendedNextAction, "contrast_drill");
});

test("C: correct recognition, good explanation, heavy hints, eventually solid -> no acute failure, but flags independence", () => {
  const result = diagnoseAttempt({
    selectedPatternLabel: "Sliding Window",
    actualPatternLabel: "Sliding Window",
    outcome: "solid",
    explanationScore: 80,
    codePassed: true,
    hintsUsed: 3
  });
  assert.equal(result.primaryFailure, null);
  assert.equal(result.recommendedNextAction, "independent_retry");
});

test("D: correct recognition, low explanation score -> concept_gap, concept_refresh", () => {
  const result = diagnoseAttempt({
    selectedPatternLabel: "Sliding Window",
    actualPatternLabel: "Sliding Window",
    outcome: "partial",
    explanationScore: 35,
    codePassed: false
  });
  assert.equal(result.primaryFailure, "concept_gap");
  assert.equal(result.recommendedNextAction, "concept_refresh");
});

test("E: correct recognition, strong explanation, code fails -> implementation_gap, implementation_rep", () => {
  const result = diagnoseAttempt({
    selectedPatternLabel: "Sliding Window",
    actualPatternLabel: "Sliding Window",
    outcome: "partial",
    explanationScore: 82,
    codePassed: false
  });
  assert.equal(result.primaryFailure, "implementation_gap");
  assert.equal(result.recommendedNextAction, "implementation_rep");
});

test("F: delayed retry regression after a prior solid outcome -> recall_gap, spaced_recall (overrides recognition_gap)", () => {
  const result = diagnoseAttempt(
    {
      selectedPatternLabel: "Two Pointers",
      actualPatternLabel: "Sliding Window",
      outcome: "confused"
    },
    { isDelayedRetry: true, priorOutcomeWasSolid: true }
  );
  assert.equal(result.primaryFailure, "recall_gap");
  assert.equal(result.recommendedNextAction, "spaced_recall");
});

test("code failed with no explanation data -> honestly insufficient_evidence, not a fabricated guess", () => {
  const result = diagnoseAttempt({
    selectedPatternLabel: "Sliding Window",
    actualPatternLabel: "Sliding Window",
    outcome: "confused",
    codePassed: false
  });
  assert.equal(result.primaryFailure, "insufficient_evidence");
  assert.ok(result.confidence < 0.4);
});

test("code passed but outcome only partial -> edge_case_gap", () => {
  const result = diagnoseAttempt({
    selectedPatternLabel: "Sliding Window",
    actualPatternLabel: "Sliding Window",
    outcome: "partial",
    explanationScore: 78,
    codePassed: true
  });
  assert.equal(result.primaryFailure, "edge_case_gap");
});

test("wrong recognition combined with very low explanation -> mixed, not a false-precision single category", () => {
  const result = diagnoseAttempt({
    selectedPatternLabel: "Two Pointers",
    actualPatternLabel: "Sliding Window",
    outcome: "confused",
    explanationScore: 15
  });
  assert.equal(result.primaryFailure, "mixed");
});
