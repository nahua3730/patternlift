import type { ConfusionPair, MasteryAttempt } from "@/lib/mastery";

// Six dimensions instead of one blended mastery number, so "62%" can mean
// something specific: strong recognition but weak implementation reads very
// differently from weak recognition but strong implementation, even though
// both could average to the same overall score.
export type SkillDimension =
  | "recognition"
  | "concept"
  | "reasoning"
  | "implementation"
  | "independence"
  | "retention";

export type DimensionScore = {
  score: number; // 0-100
  // 0-1. Evidence QUANTITY/QUALITY, distinct from the score itself - a 92
  // built on one attempt and a 92 built on twelve attempts are not equally
  // trustworthy, even though the score is identical.
  confidence: number;
  evidenceCount: number;
};

export type TechniqueSkillVector = {
  recognition: DimensionScore;
  concept: DimensionScore;
  reasoning: DimensionScore;
  implementation: DimensionScore;
  independence: DimensionScore;
  retention: DimensionScore;
  overall: number; // derived from the six dimensions below, not an independent signal
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

// Weighted averages produce fractional noise (44.04145077720207) that
// reads as false precision on a percentage - every displayed score is a
// whole number.
function clampRound(value: number, min = 0, max = 100) {
  return Math.round(clamp(value, min, max));
}

// More recent attempts count more, but old evidence is never fully erased -
// the floor keeps a long history from vanishing to zero influence.
function recencyWeight(indexFromNewest: number) {
  return Math.max(0.45, 1 - indexFromNewest * 0.07);
}

function weightedAverage(items: Array<{ value: number; weight: number }>) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

// Evidence confidence grows with sample size but saturates - by ~8 attempts,
// more data refines the estimate rather than fundamentally changing how much
// to trust it. This is a simple interpretable curve, not a real Bayesian
// posterior - deliberately, per the "don't overbuild" instruction.
function evidenceConfidence(count: number) {
  if (count === 0) return 0;
  return clamp(Math.min(1, count / 8), 0, 1);
}

function emptyDimension(): DimensionScore {
  return { score: 0, confidence: 0, evidenceCount: 0 };
}

function scoreRecognition(attempts: MasteryAttempt[], patternLabel: string, confusions: ConfusionPair[]): DimensionScore {
  if (attempts.length === 0) return emptyDimension();

  const weighted = attempts.map((attempt, index) => {
    const recognized = attempt.selectedPatternLabel === patternLabel;
    let value = recognized ? 100 : 15;
    // Confidently wrong is worse evidence of recognition than a hesitant
    // wrong guess - the learner thought they knew, and didn't.
    if (!recognized && (attempt.confidence ?? 2) >= 3) value -= 8;
    return { value: clamp(value), weight: recencyWeight(index) };
  });

  let score = weightedAverage(weighted);

  // A recurring confusion pair for THIS pattern is stronger, more specific
  // evidence of a recognition gap than isolated misses would be.
  const dominant = confusions.find((pair) => pair.actual === patternLabel);
  if (dominant && dominant.count >= 2) {
    score = clamp(score - Math.min(20, dominant.count * 5));
  }

  return { score: clampRound(score), confidence: evidenceConfidence(attempts.length), evidenceCount: attempts.length };
}

function scoreConcept(attempts: MasteryAttempt[]): DimensionScore {
  const withExplanation = attempts.filter((attempt) => typeof attempt.explanationScore === "number");
  if (withExplanation.length === 0) return emptyDimension();

  const weighted = withExplanation.map((attempt, index) => ({
    value: clamp(attempt.explanationScore ?? 0),
    weight: recencyWeight(index)
  }));

  return {
    score: clampRound(weightedAverage(weighted)),
    confidence: evidenceConfidence(withExplanation.length),
    evidenceCount: withExplanation.length
  };
}

// Conservative by design: we only score reasoning on attempts where the
// learner recognized the right technique in the first place - if they
// picked the wrong pattern, we can't tell anything about their invariant
// reasoning for the right one. Among recognized-correct attempts, the
// outcome (solid vs partial vs confused) is the best proxy we actually
// have for "did the reasoning hold up," per the instruction not to infer
// invariant quality from code alone.
function scoreReasoning(attempts: MasteryAttempt[], patternLabel: string): DimensionScore {
  const recognized = attempts.filter((attempt) => attempt.selectedPatternLabel === patternLabel);
  if (recognized.length === 0) return emptyDimension();

  const weighted = recognized.map((attempt, index) => {
    const value = attempt.outcome === "solid" ? 100 : attempt.outcome === "partial" ? 55 : 20;
    return { value, weight: recencyWeight(index) };
  });

  return {
    score: clampRound(weightedAverage(weighted)),
    confidence: evidenceConfidence(recognized.length),
    evidenceCount: recognized.length
  };
}

function scoreImplementation(attempts: MasteryAttempt[]): DimensionScore {
  const withCode = attempts.filter((attempt) => attempt.codePassed !== null && attempt.codePassed !== undefined);
  if (withCode.length === 0) return emptyDimension();

  const weighted = withCode.map((attempt, index) => ({
    value: attempt.codePassed ? 100 : 30,
    weight: recencyWeight(index)
  }));

  return {
    score: clampRound(weightedAverage(weighted)),
    confidence: evidenceConfidence(withCode.length),
    evidenceCount: withCode.length
  };
}

function scoreIndependence(attempts: MasteryAttempt[]): DimensionScore {
  const withHints = attempts.filter((attempt) => typeof attempt.hintsUsed === "number");
  if (withHints.length === 0) return emptyDimension();

  const weighted = withHints.map((attempt, index) => ({
    value: clamp(100 - (attempt.hintsUsed ?? 0) * 20, 10, 100),
    weight: recencyWeight(index)
  }));

  return {
    score: clampRound(weightedAverage(weighted)),
    confidence: evidenceConfidence(withHints.length),
    evidenceCount: withHints.length
  };
}

// Retention is deliberately NOT a copy of overall mastery. It only scores
// "delayed" attempts - a second-or-later attempt on this pattern that
// landed 3+ days after the learner's first attempt on it. A same-day or
// next-day repeat proves nothing about recall; a solid attempt after a
// week-long gap does. With no delayed attempts yet, there is genuinely no
// retention evidence, so this returns an empty (not defaulted-high) score.
const RETENTION_GAP_DAYS = 3;

function scoreRetention(attempts: MasteryAttempt[]): DimensionScore {
  const withDates = attempts
    .filter((attempt) => attempt.createdAt)
    .map((attempt) => ({ ...attempt, time: new Date(attempt.createdAt as string).getTime() }))
    .sort((a, b) => a.time - b.time);

  if (withDates.length < 2) return emptyDimension();

  const firstAttemptTime = withDates[0].time;
  const delayed = withDates.slice(1).filter(
    (attempt) => attempt.time - firstAttemptTime >= RETENTION_GAP_DAYS * 86_400_000
  );
  if (delayed.length === 0) return emptyDimension();

  const weighted = delayed.map((attempt, index) => {
    const value = attempt.outcome === "solid" ? 100 : attempt.outcome === "partial" ? 55 : 20;
    return { value, weight: recencyWeight(delayed.length - 1 - index) };
  });

  return {
    score: clampRound(weightedAverage(weighted)),
    confidence: evidenceConfidence(delayed.length),
    evidenceCount: delayed.length
  };
}

// Overall is derived from the six dimensions, not scored independently.
// Weights roughly mirror the emphasis in the original single-score
// formula (recognition mattered most, then a mix of understanding and
// execution) - documented here rather than left implicit.
const OVERALL_WEIGHTS: Record<SkillDimension, number> = {
  recognition: 0.3,
  concept: 0.15,
  reasoning: 0.2,
  implementation: 0.2,
  independence: 0.1,
  retention: 0.05
};

export function buildSkillVector(
  attempts: MasteryAttempt[],
  patternLabel: string,
  confusions: ConfusionPair[]
): TechniqueSkillVector {
  const patternAttempts = attempts.filter((attempt) => attempt.actualPatternLabel === patternLabel);

  const recognition = scoreRecognition(patternAttempts, patternLabel, confusions);
  const concept = scoreConcept(patternAttempts);
  const reasoning = scoreReasoning(patternAttempts, patternLabel);
  const implementation = scoreImplementation(patternAttempts);
  const independence = scoreIndependence(patternAttempts);
  const retention = scoreRetention(patternAttempts);

  const dimensions: Record<SkillDimension, DimensionScore> = {
    recognition,
    concept,
    reasoning,
    implementation,
    independence,
    retention
  };

  // Only dimensions with real evidence contribute to overall - a dimension
  // with zero evidence is excluded rather than dragging the average to 0,
  // and weights are renormalized over whatever evidence actually exists.
  const contributing = (Object.keys(dimensions) as SkillDimension[]).filter(
    (key) => dimensions[key].evidenceCount > 0
  );
  const overall =
    contributing.length === 0
      ? 0
      : Math.round(
          contributing.reduce((sum, key) => sum + dimensions[key].score * OVERALL_WEIGHTS[key], 0) /
            contributing.reduce((sum, key) => sum + OVERALL_WEIGHTS[key], 0)
        );

  return { recognition, concept, reasoning, implementation, independence, retention, overall };
}
