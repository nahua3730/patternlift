import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { starterHistory } from "@/lib/product";
import type { PersistenceSnapshot } from "@/lib/persistence";

const starterReviewQueue = [
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
] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts = db
    .prepare(
      `
        SELECT id, problem_id, problem_title, selected_pattern_label, outcome, insight
        FROM attempts
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT 6
      `
    )
    .all(user.id) as Array<{
    id: string;
    problem_id: string;
    problem_title: string;
    selected_pattern_label: string;
    outcome: string;
    insight: string;
  }>;

  const reviewItems = db
    .prepare(
      `
        SELECT id, problem_title, target_pattern_label, contrast_pattern_label, review_question, urgency
        FROM review_items
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT 4
      `
    )
    .all(user.id) as Array<{
    id: string;
    problem_title: string;
    target_pattern_label: string;
    contrast_pattern_label: string;
    review_question: string;
    urgency: string;
  }>;

  const history =
    attempts.length > 0
      ? attempts.map((attempt) => ({
          id: attempt.id,
          problemId: attempt.problem_id,
          problemTitle: attempt.problem_title,
          selectedPatternLabel: attempt.selected_pattern_label,
          outcome: attempt.outcome as "solid" | "partial" | "confused",
          insight: attempt.insight
        }))
      : starterHistory.map((item) => ({ ...item }));

  const reviewQueue =
    reviewItems.length > 0
      ? reviewItems.map((item) => ({
          id: item.id,
          problemTitle: item.problem_title,
          targetPatternLabel: item.target_pattern_label,
          contrastPatternLabel: item.contrast_pattern_label,
          reviewQuestion: item.review_question,
          urgency: item.urgency as "high" | "medium"
        }))
      : starterReviewQueue.map((item) => ({ ...item }));

  const snapshot: PersistenceSnapshot = {
    history,
    reviewQueue
  };

  return NextResponse.json(snapshot);
}
