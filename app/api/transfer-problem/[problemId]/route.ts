import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allProblems } from "@/lib/product";
import { buildBlindProblemPreview } from "@/lib/transfer-problem";

// Phase 2A: the blind-prediction preview endpoint for a Transfer problem.
// Deliberately returns ONLY {id, title, difficulty, prompt} - never
// targetPatternId, contrastPatternId, recommendedClues, recommendedFirstStep,
// or category (itself pattern-revealing, e.g. "Sliding Window"). This is
// the one place PatternPredictor is allowed to fetch problem data from, so
// the response shape here is the actual blindness guarantee, not just UI
// discipline in the component that renders it.
export async function GET(request: Request, { params }: { params: { problemId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const problem = allProblems.find((entry) => entry.id === params.problemId);
  if (!problem) return NextResponse.json({ error: "Unknown problem" }, { status: 404 });

  return NextResponse.json(buildBlindProblemPreview(problem));
}
