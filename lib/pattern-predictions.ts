// Phase 2A: the pure decision logic behind a Transfer blind prediction -
// deliberately factored out of app/api/pattern-predictions/route.ts so it
// can be unit-tested the same way every other deterministic engine in this
// codebase is (lib/*.test.ts, no DB mocking needed).
//
// SECURITY-BOUNDARY-STYLE INVARIANT: resolvePrediction's signature has no
// parameter for a client-supplied "actual pattern" - actualPatternId must
// be passed in already resolved from a trusted server-side source (the
// study_tasks row the prediction belongs to). There is structurally no
// way to call this function with an untrusted answer.
export type ResolvedPrediction = {
  predictedPatternId: string | null;
  actualPatternId: string;
  wasCorrect: boolean;
  reasoning: string | null;
};

const MAX_REASONING_LENGTH = 500;

export function resolvePrediction(input: {
  requestedPredictedPatternId: unknown;
  // Trusted - resolved by the caller from study_tasks.pattern_id, never
  // from the request body.
  actualPatternId: string;
  requestedReasoning: unknown;
  validPatternIds: string[];
}): ResolvedPrediction {
  const predictedPatternId =
    typeof input.requestedPredictedPatternId === "string" &&
    input.validPatternIds.includes(input.requestedPredictedPatternId)
      ? input.requestedPredictedPatternId
      : null;

  const wasCorrect = predictedPatternId !== null && predictedPatternId === input.actualPatternId;

  const reasoning =
    typeof input.requestedReasoning === "string" && input.requestedReasoning.trim()
      ? input.requestedReasoning.trim().slice(0, MAX_REASONING_LENGTH)
      : null;

  return { predictedPatternId, actualPatternId: input.actualPatternId, wasCorrect, reasoning };
}

// The prediction-submission response contract: deliberately ONLY {id}.
// wasCorrect/actualPatternId must never appear here - see §7 of the
// Phase 2A plan ("immediate-reveal avoidance"). Routing every response
// through this function (rather than hand-building the JSON body inline)
// makes that contract enforceable by a unit test, not just readable in
// the route source.
export function buildPredictionAckResponse(id: string): { id: string } {
  return { id };
}

export function confusionLabelForPrediction(predictedLabel: string, actualLabel: string) {
  if (predictedLabel === "Still exploring" || predictedLabel === actualLabel) return null;
  return predictedLabel;
}
