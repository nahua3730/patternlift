import type { ConfusionPair } from "@/lib/mastery";

// Eight categories from the spec, plus two honest escape hatches:
// null (no failure worth diagnosing - the attempt was solid) and
// "insufficient_evidence" (something was off, but the captured signals
// don't let us say what). Both exist because forcing every attempt into
// one of the eight would mean fabricating precision we don't have.
export type FailureCategory =
  | "recognition_gap"
  | "concept_gap"
  | "reasoning_gap"
  | "transition_gap"
  | "implementation_gap"
  | "edge_case_gap"
  | "recall_gap"
  | "mixed"
  | "insufficient_evidence";

export type RecommendedAction =
  | "recognition_drill"
  | "contrast_drill"
  | "concept_refresh"
  | "reasoning_drill"
  | "guided_retry"
  | "implementation_rep"
  | "independent_retry"
  | "spaced_recall"
  | "transfer_problem";

export type AttemptDiagnosis = {
  primaryFailure: FailureCategory | null;
  secondaryFailure?: FailureCategory;
  confidence: number; // 0-1, honest about how sure this classification is
  evidence: string[]; // short factual notes, e.g. "code did not pass", "explanation score 32/100"
  learnerFacingSummary: string;
  recommendedNextAction: RecommendedAction | null;
};

export type DiagnosisInput = {
  selectedPatternLabel: string;
  actualPatternLabel: string;
  outcome: "solid" | "partial" | "confused";
  explanationScore?: number;
  codePassed?: boolean | null;
  hintsUsed?: number;
  confidence?: number; // learner's self-reported confidence, 1-5
};

export type RetentionContext = {
  isDelayedRetry: boolean; // this attempt landed 3+ days after their first attempt on this pattern
  priorOutcomeWasSolid: boolean;
};

const EXPLANATION_LOW = 50;
const EXPLANATION_HIGH = 75;

// transition_gap ("knows the invariant but updates it wrong in code") needs
// finer-grained signal than we currently capture - e.g. which specific step
// of the algorithm broke. We keep the category in the type for when richer
// per-step data exists, but this classifier never emits it, on purpose:
// guessing between transition_gap and reasoning_gap from a single
// pass/fail boolean would be exactly the fabricated precision Part 6 warns
// against.
export function diagnoseAttempt(input: DiagnosisInput, retention?: RetentionContext): AttemptDiagnosis {
  const recognized = input.selectedPatternLabel === input.actualPatternLabel;
  const evidence: string[] = [];

  // Forgetting something you previously had solid is a distinct, well-
  // evidenced signal - it takes priority over how THIS attempt looks,
  // because the root cause (recall, not fresh confusion) is what should
  // drive the recommendation.
  if (retention?.isDelayedRetry && retention.priorOutcomeWasSolid && input.outcome !== "solid") {
    evidence.push("this pattern was solid before, but not on this delayed retry");
    return {
      primaryFailure: "recall_gap",
      confidence: 0.7,
      evidence,
      learnerFacingSummary: "You had this solid before - this looks like forgetting over time, not a new gap.",
      recommendedNextAction: "spaced_recall"
    };
  }

  if (!recognized) {
    evidence.push(`selected "${input.selectedPatternLabel}" instead of "${input.actualPatternLabel}"`);
    const overconfident = (input.confidence ?? 2) >= 4;
    if (overconfident) evidence.push("marked high confidence despite the miss");

    // Very low explanation quality on top of a wrong guess signals broad
    // confusion rather than a crisp, isolated recognition slip.
    if (typeof input.explanationScore === "number" && input.explanationScore < 30) {
      evidence.push(`explanation score ${input.explanationScore}/100`);
      return {
        primaryFailure: "mixed",
        confidence: 0.5,
        evidence,
        learnerFacingSummary: "Recognition and explanation were both shaky here - this looks like broad unfamiliarity, not one specific gap.",
        recommendedNextAction: "guided_retry"
      };
    }

    return {
      primaryFailure: "recognition_gap",
      confidence: overconfident ? 0.75 : 0.65,
      evidence,
      learnerFacingSummary: "You picked a different technique than the one that actually fits here.",
      recommendedNextAction: "contrast_drill"
    };
  }

  // Recognized correctly, and it held up - nothing to diagnose. Hint
  // dependency (if any) is a skill-vector signal (independence), not a
  // per-attempt failure.
  if (input.outcome === "solid") {
    const leanedOnHints = (input.hintsUsed ?? 0) >= 3;
    return {
      primaryFailure: null,
      confidence: 0.8,
      evidence: leanedOnHints ? ["solid outcome, but used several hints to get there"] : [],
      learnerFacingSummary: leanedOnHints
        ? "Solid outcome - worth trying a similar problem with less help next time."
        : "Solid outcome, correctly recognized.",
      recommendedNextAction: leanedOnHints ? "independent_retry" : null
    };
  }

  evidence.push(`recognized "${input.actualPatternLabel}" correctly`, `outcome: ${input.outcome}`);

  const hasExplanationScore = typeof input.explanationScore === "number";
  if (hasExplanationScore && (input.explanationScore as number) < EXPLANATION_LOW) {
    evidence.push(`explanation score ${input.explanationScore}/100`);
    return {
      primaryFailure: "concept_gap",
      confidence: 0.6,
      evidence,
      learnerFacingSummary: "You picked the right technique, but the explanation suggests the core idea isn't fully solid yet.",
      recommendedNextAction: "concept_refresh"
    };
  }

  if (input.codePassed === false) {
    if (hasExplanationScore && (input.explanationScore as number) >= EXPLANATION_HIGH) {
      // Reasoning was clearly articulated; the code just didn't work.
      evidence.push(`explanation score ${input.explanationScore}/100`, "code did not pass");
      return {
        primaryFailure: "implementation_gap",
        confidence: 0.6,
        evidence,
        learnerFacingSummary: "Your reasoning was solid - the gap is translating that plan into working code.",
        recommendedNextAction: "implementation_rep"
      };
    }
    if (hasExplanationScore) {
      evidence.push(`explanation score ${input.explanationScore}/100`, "code did not pass");
      return {
        primaryFailure: "reasoning_gap",
        confidence: 0.5,
        evidence,
        learnerFacingSummary: "The explanation wasn't fully crisp and the code didn't pass - likely a gap in the underlying reasoning.",
        recommendedNextAction: "reasoning_drill"
      };
    }
    evidence.push("code did not pass", "no explanation data to narrow this down further");
    return {
      primaryFailure: "insufficient_evidence",
      confidence: 0.3,
      evidence,
      learnerFacingSummary: "Recognition was right but the code didn't pass - not enough detail here to say exactly why.",
      recommendedNextAction: "guided_retry"
    };
  }

  if (input.codePassed === true) {
    // Code runs, recognition was right, but outcome still wasn't solid -
    // the closest honest read with current signals is edge-case handling.
    evidence.push("code passed, but outcome was only partial");
    return {
      primaryFailure: "edge_case_gap",
      confidence: 0.45,
      evidence,
      learnerFacingSummary: "Your code passed, but something kept this from being fully solid - likely edge cases worth double-checking.",
      recommendedNextAction: "implementation_rep"
    };
  }

  evidence.push("no code-run data available");
  return {
    primaryFailure: "insufficient_evidence",
    confidence: 0.25,
    evidence,
    learnerFacingSummary: "Recognition was right, but the outcome wasn't solid and we don't have enough detail to say why.",
    recommendedNextAction: "guided_retry"
  };
}

export function dominantConfusionFor(patternLabel: string, confusions: ConfusionPair[]): ConfusionPair | null {
  const match = confusions.find((pair) => pair.actual === patternLabel && pair.count >= 2);
  return match ?? null;
}
