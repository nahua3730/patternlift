import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allProblems } from "@/lib/product";
import { getOrCreateProblemStatement } from "@/lib/problem-statement-service";

export async function GET(request: Request, { params }: { params: { problemId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const problem = allProblems.find((entry) => entry.id === params.problemId);
  if (!problem) return NextResponse.json({ error: "Unknown problem" }, { status: 404 });

  const result = await getOrCreateProblemStatement(problem);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error.startsWith("Missing") ? 503 : 500 });
  }

  return NextResponse.json({ source: result.source, statement: result.statement });
}
