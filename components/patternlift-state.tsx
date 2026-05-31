"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { starterHistory } from "@/lib/product";
import type { AttemptResult } from "@/components/practice-workspace";
import type { PersistenceSnapshot } from "@/lib/persistence";

export type HistoryItem = {
  id: string;
  problemId: string;
  problemTitle: string;
  selectedPatternLabel: string;
  outcome: "solid" | "partial" | "confused";
  insight: string;
};

export type ReviewItem = {
  id: string;
  problemTitle: string;
  targetPatternLabel: string;
  contrastPatternLabel: string;
  reviewQuestion: string;
  urgency: "high" | "medium";
};

type PatternLiftStateValue = {
  history: HistoryItem[];
  reviewQueue: ReviewItem[];
  latestAttempt: AttemptResult | null;
  totalAttempts: number;
  solidAttempts: number;
  reviewCount: number;
  currentStreak: number;
  todayPlan: string[];
  addAttempt: (result: AttemptResult) => void;
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

const PatternLiftStateContext = createContext<PatternLiftStateValue | null>(null);

export function PatternLiftStateProvider({
  children,
  isAuthenticated
}: {
  children: ReactNode;
  isAuthenticated: boolean;
}) {
  const [history, setHistory] = useState<HistoryItem[]>(starterHistory.map((item) => ({ ...item })));
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(initialReviewQueue);
  const [latestAttempt, setLatestAttempt] = useState<AttemptResult | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setHistory(starterHistory.map((item) => ({ ...item })));
      setReviewQueue(initialReviewQueue.map((item) => ({ ...item })));
      setLatestAttempt(null);
      return;
    }

    async function loadState() {
      try {
        const response = await fetch("/api/state");
        if (!response.ok) return;

        const parsed = (await response.json()) as PersistenceSnapshot;
        if (parsed.history) setHistory(parsed.history);
        if (parsed.reviewQueue) setReviewQueue(parsed.reviewQueue);
      } catch {
        // Keep starter data if server fetch fails.
      }
    }

    void loadState();
  }, [isAuthenticated]);

  const totalAttempts = history.length;
  const solidAttempts = history.filter((item) => item.outcome === "solid").length;
  const currentStreak = Math.max(3, solidAttempts + 1);

  const todayPlan = useMemo(
    () => [
      `${reviewQueue.length} review cards waiting`,
      latestAttempt ? `Latest attempt score: ${latestAttempt.score}` : "Complete one fresh attempt",
      solidAttempts >= 2
        ? "You are ready for a slightly harder contrast pair"
        : "Keep pattern selection and review light today"
    ],
    [latestAttempt, reviewQueue.length, solidAttempts]
  );

  async function addAttempt(result: AttemptResult) {
    setLatestAttempt(result);

    const optimisticHistoryItem: HistoryItem = {
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

    setHistory((current) => [optimisticHistoryItem, ...current].slice(0, 6));

    const optimisticReviewItem: ReviewItem = {
      id: `review-${Date.now()}`,
      problemTitle: result.problemTitle,
      targetPatternLabel: result.correctPatternLabel,
      contrastPatternLabel: result.contrastPatternLabel,
      reviewQuestion: result.reviewQuestion,
      urgency: result.outcome === "solid" ? "medium" : "high"
    };

    setReviewQueue((current) => {
      const filtered = current.filter((item) => item.problemTitle !== result.problemTitle);
      return [optimisticReviewItem, ...filtered].slice(0, 4);
    });

    try {
      await fetch("/api/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
      });
    } catch {
      // Keep optimistic UI state even if persistence fails for now.
    }
  }

  const value: PatternLiftStateValue = {
    history,
    reviewQueue,
    latestAttempt,
    totalAttempts,
    solidAttempts,
    reviewCount: reviewQueue.length,
    currentStreak,
    todayPlan,
    addAttempt
  };

  return (
    <PatternLiftStateContext.Provider value={value}>
      {children}
    </PatternLiftStateContext.Provider>
  );
}

export function usePatternLiftState() {
  const context = useContext(PatternLiftStateContext);

  if (!context) {
    throw new Error("usePatternLiftState must be used within PatternLiftStateProvider");
  }

  return context;
}
