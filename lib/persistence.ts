import type { AttemptResult } from "@/components/practice-workspace";
import type { HistoryItem, ReviewItem } from "@/components/patternlift-state";
import { getReviewSchedule } from "@/lib/mastery";

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
    actualPatternLabel: result.correctPatternLabel,
    outcome: result.outcome,
    insight:
      result.outcome === "solid"
        ? `Strong match between ${result.selectedPatternLabel} and the prompt clues.`
        : result.outcome === "partial"
          ? `Some useful signals were present, but the contrast with ${result.contrastPatternLabel} still needs reinforcement.`
          : `The prompt was steered toward ${result.correctPatternLabel}, but the attempt drifted away from the strongest clues.`,
    score: result.score,
    hintsUsed: result.hintsUsed,
    codePassed: result.codePassed,
    confidence: result.confidence,
    confusedWith: result.confusedWith,
    inputMethod: result.inputMethod,
    createdAt: new Date().toISOString()
  };
}

export function buildReviewItem(result: AttemptResult): ReviewItem {
  const schedule = getReviewSchedule(result.outcome);
  return {
    id: `review-${Date.now()}`,
    problemTitle: result.problemTitle,
    targetPatternLabel: result.correctPatternLabel,
    contrastPatternLabel: result.contrastPatternLabel,
    reviewQuestion: result.reviewQuestion,
    urgency: result.outcome === "solid" ? "medium" : "high",
    dueAt: schedule.dueAt,
    intervalDays: schedule.intervalDays,
    repetitions: 0
  };
}
