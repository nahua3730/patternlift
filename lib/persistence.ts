import type { AttemptResult } from "@/components/practice-workspace";
import type { HistoryItem, ReviewItem } from "@/components/patternlift-state";

export type PersistenceSnapshot = {
  history: HistoryItem[];
  reviewQueue: ReviewItem[];
};

export function buildHistoryItem(result: AttemptResult): HistoryItem {
  return {
    id: `attempt-${Date.now()}`,
    problemId: result.problemId,
    problemTitle: result.problemTitle,
    selectedPatternLabel: result.selectedPatternLabel,
    outcome: result.outcome,
    insight:
      result.outcome === "solid"
        ? `Strong match between ${result.selectedPatternLabel} and the prompt clues.`
        : result.outcome === "partial"
          ? `Some useful signals were present, but the contrast with ${result.contrastPatternLabel} still needs reinforcement.`
          : `The prompt was steered toward ${result.correctPatternLabel}, but the attempt drifted away from the strongest clues.`
  };
}

export function buildReviewItem(result: AttemptResult): ReviewItem {
  return {
    id: `review-${Date.now()}`,
    problemTitle: result.problemTitle,
    targetPatternLabel: result.correctPatternLabel,
    contrastPatternLabel: result.contrastPatternLabel,
    reviewQuestion: result.reviewQuestion,
    urgency: result.outcome === "solid" ? "medium" : "high"
  };
}
