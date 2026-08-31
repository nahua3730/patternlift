import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPredictionAckResponse,
  confusionLabelForPrediction,
  resolvePrediction
} from "@/lib/pattern-predictions";

const VALID_PATTERN_IDS = ["hashing", "sliding-window", "two-pointers"];

test("resolvePrediction: a correct prediction is stored correctly - wasCorrect true, predictedPatternId preserved", () => {
  const result = resolvePrediction({
    requestedPredictedPatternId: "sliding-window",
    actualPatternId: "sliding-window",
    requestedReasoning: undefined,
    validPatternIds: VALID_PATTERN_IDS
  });
  assert.equal(result.predictedPatternId, "sliding-window");
  assert.equal(result.actualPatternId, "sliding-window");
  assert.equal(result.wasCorrect, true);
});

test("resolvePrediction: a wrong prediction is stored correctly - wasCorrect false, the WRONG guess is still preserved (not overwritten)", () => {
  const result = resolvePrediction({
    requestedPredictedPatternId: "two-pointers",
    actualPatternId: "sliding-window",
    requestedReasoning: undefined,
    validPatternIds: VALID_PATTERN_IDS
  });
  assert.equal(result.predictedPatternId, "two-pointers");
  assert.equal(result.actualPatternId, "sliding-window");
  assert.equal(result.wasCorrect, false);
});

test('resolvePrediction: "I\'m not sure" (null) is stored as null, never coerced into a guess, and never counted correct', () => {
  const result = resolvePrediction({
    requestedPredictedPatternId: null,
    actualPatternId: "sliding-window",
    requestedReasoning: undefined,
    validPatternIds: VALID_PATTERN_IDS
  });
  assert.equal(result.predictedPatternId, null);
  assert.equal(result.wasCorrect, false);
});

test("resolvePrediction: an invalid/unknown predictedPatternId (not in the catalog) is treated as null, not stored verbatim", () => {
  const result = resolvePrediction({
    requestedPredictedPatternId: "not-a-real-pattern",
    actualPatternId: "sliding-window",
    requestedReasoning: undefined,
    validPatternIds: VALID_PATTERN_IDS
  });
  assert.equal(result.predictedPatternId, null);
  assert.equal(result.wasCorrect, false);
});

test("resolvePrediction: reasoning is trimmed and optional - blank/whitespace-only reasoning becomes null, never required", () => {
  const blank = resolvePrediction({
    requestedPredictedPatternId: "hashing",
    actualPatternId: "hashing",
    requestedReasoning: "   ",
    validPatternIds: VALID_PATTERN_IDS
  });
  assert.equal(blank.reasoning, null);

  const real = resolvePrediction({
    requestedPredictedPatternId: "hashing",
    actualPatternId: "hashing",
    requestedReasoning: "  need fast lookup  ",
    validPatternIds: VALID_PATTERN_IDS
  });
  assert.equal(real.reasoning, "need fast lookup");
});

test("resolvePrediction: reasoning is capped at 500 characters", () => {
  const long = "x".repeat(600);
  const result = resolvePrediction({
    requestedPredictedPatternId: "hashing",
    actualPatternId: "hashing",
    requestedReasoning: long,
    validPatternIds: VALID_PATTERN_IDS
  });
  assert.equal(result.reasoning?.length, 500);
});

test("recognition vs. solving stay separate signals: resolvePrediction never reads or depends on any solve/implementation outcome - its result is purely a function of predicted vs. actual pattern", () => {
  // resolvePrediction's signature has no outcome/codePassed/hintsUsed
  // parameter at all - a correct-prediction-but-failed-implementation
  // case and a wrong-prediction-but-solved case are indistinguishable to
  // this function by design, because recognition correctness must never
  // be computed FROM solve success.
  const recognizedButWillLaterFailToSolve = resolvePrediction({
    requestedPredictedPatternId: "sliding-window",
    actualPatternId: "sliding-window",
    requestedReasoning: undefined,
    validPatternIds: VALID_PATTERN_IDS
  });
  const notRecognizedButWillLaterSolve = resolvePrediction({
    requestedPredictedPatternId: "two-pointers",
    actualPatternId: "sliding-window",
    requestedReasoning: undefined,
    validPatternIds: VALID_PATTERN_IDS
  });
  assert.equal(recognizedButWillLaterFailToSolve.wasCorrect, true);
  assert.equal(notRecognizedButWillLaterSolve.wasCorrect, false);
});

test("buildPredictionAckResponse: the prediction-submission response contract is exactly {id} - never wasCorrect or actualPatternId", () => {
  const response = buildPredictionAckResponse("prediction-123");
  assert.deepEqual(Object.keys(response), ["id"]);
  assert.equal(response.id, "prediction-123");
});

test("structured wrong prediction preserves the concrete ConfusionPair label", () => {
  assert.equal(confusionLabelForPrediction("Two Pointers", "Hash Map / Set"), "Two Pointers");
  assert.equal(confusionLabelForPrediction("Hash Map / Set", "Hash Map / Set"), null);
  assert.equal(confusionLabelForPrediction("Still exploring", "Hash Map / Set"), null);
});
