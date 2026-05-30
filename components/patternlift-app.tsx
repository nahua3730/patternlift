"use client";

import { useMemo, useState } from "react";
import { PracticeWorkspace, type AttemptResult } from "@/components/practice-workspace";
import { ProgressPanel } from "@/components/progress-panel";
import { ReviewQueue } from "@/components/review-queue";
import { starterHistory } from "@/lib/product";

type HistoryItem = {
  id: string;
  problemTitle: string;
  selectedPatternLabel: string;
  outcome: "solid" | "partial" | "confused";
  insight: string;
};

type ReviewItem = {
  id: string;
  problemTitle: string;
  targetPatternLabel: string;
  contrastPatternLabel: string;
  reviewQuestion: string;
  urgency: "high" | "medium";
};

const initialReviewQueue: ReviewItem[] = [
  {
    id: "review-1",
    problemTitle: "Binary Tree Level Order Traversal",
    targetPatternLabel: "Breadth-First Search",
    contrastPatternLabel: "Depth-First Search",
    reviewQuestion:
      "Which exact phrase in the prompt forces you to think in levels instead of branches?",
    urgency: "high"
  },
  {
    id: "review-2",
    problemTitle: "Top K Frequent Elements",
    targetPatternLabel: "Heap / Priority Queue",
    contrastPatternLabel: "Dynamic Programming",
    reviewQuestion:
      "What changes when the prompt cares about the current best k items rather than a full optimal table?",
    urgency: "medium"
  }
];

export function PatternLiftApp() {
  const [history, setHistory] = useState<HistoryItem[]>(starterHistory.map((item) => ({
    ...item
  })));
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(initialReviewQueue);
  const [latestAttempt, setLatestAttempt] = useState<AttemptResult | null>(null);

  const totalAttempts = history.length;
  const solidAttempts = history.filter((item) => item.outcome === "solid").length;
  const currentStreak = Math.max(3, solidAttempts + 1);

  const todayPlan = useMemo(
    () => [
      `${reviewQueue.length} review cards waiting`,
      latestAttempt
        ? `Latest attempt score: ${latestAttempt.score}`
        : "Complete one fresh attempt",
      solidAttempts >= 2
        ? "You are ready for a slightly harder contrast pair"
        : "Keep pattern selection and review light today"
    ],
    [latestAttempt, reviewQueue.length, solidAttempts]
  );

  function handleAttemptComplete(result: AttemptResult) {
    setLatestAttempt(result);

    setHistory((current) => [
      {
        id: `attempt-${Date.now()}`,
        problemTitle: result.problemTitle,
        selectedPatternLabel: result.selectedPatternLabel,
        outcome: result.outcome,
        insight:
          result.outcome === "solid"
            ? `Strong match between ${result.selectedPatternLabel} and the prompt clues.`
            : result.outcome === "partial"
              ? `Some useful signals were present, but the contrast with ${result.contrastPatternLabel} still needs reinforcement.`
              : `The prompt was steered toward ${result.correctPatternLabel}, but the attempt drifted away from the strongest clues.`
      },
      ...current
    ].slice(0, 6));

    setReviewQueue((current) => {
      const nextItem: ReviewItem = {
        id: `review-${Date.now()}`,
        problemTitle: result.problemTitle,
        targetPatternLabel: result.correctPatternLabel,
        contrastPatternLabel: result.contrastPatternLabel,
        reviewQuestion: result.reviewQuestion,
        urgency: result.outcome === "solid" ? "medium" : "high"
      };

      const filtered = current.filter((item) => item.problemTitle !== result.problemTitle);
      return [nextItem, ...filtered].slice(0, 4);
    });
  }

  return (
    <main className="min-h-screen px-6 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-black/10 bg-white/75 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-ember">
              PatternLift
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Practice a problem, score the reasoning, and feed the weak edges
              back into review.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-black/72">
              This is the core product loop: one guided attempt, one coaching
              response, and one review queue that gets smarter about what you
              keep mixing up.
            </p>
          </div>

          <div className="rounded-lg border border-black/10 bg-ink p-6 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-lake">
              Today
            </p>
            <div className="mt-4 space-y-3">
              {todayPlan.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/12 bg-white/8 p-4 text-sm leading-6 text-white/78"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <PracticeWorkspace onComplete={handleAttemptComplete} />

        <ProgressPanel
          totalAttempts={totalAttempts}
          solidAttempts={solidAttempts}
          reviewCount={reviewQueue.length}
          currentStreak={currentStreak}
          history={history}
        />

        <ReviewQueue items={reviewQueue} />
      </div>
    </main>
  );
}
