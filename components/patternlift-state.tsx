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

export type HistoryItem = {
  id: string;
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

const STORAGE_KEY = "patternlift-state-v1";

const PatternLiftStateContext = createContext<PatternLiftStateValue | null>(null);

export function PatternLiftStateProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>(starterHistory.map((item) => ({ ...item })));
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(initialReviewQueue);
  const [latestAttempt, setLatestAttempt] = useState<AttemptResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          history?: HistoryItem[];
          reviewQueue?: ReviewItem[];
          latestAttempt?: AttemptResult | null;
        };
        if (parsed.history) setHistory(parsed.history);
        if (parsed.reviewQueue) setReviewQueue(parsed.reviewQueue);
        if (parsed.latestAttempt !== undefined) setLatestAttempt(parsed.latestAttempt);
      }
    } catch {
      // Ignore broken local state and keep defaults.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ history, reviewQueue, latestAttempt })
    );
  }, [history, hydrated, latestAttempt, reviewQueue]);

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

  function addAttempt(result: AttemptResult) {
    setLatestAttempt(result);

    setHistory((current) =>
      [
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
      ].slice(0, 6)
    );

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
