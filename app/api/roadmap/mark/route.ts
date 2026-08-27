import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createId, dbExecute } from "@/lib/db";
import { allProblems } from "@/lib/product";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { problemId?: string };
  const problem = allProblems.find((entry) => entry.id === body.problemId);
  if (!problem) {
    return NextResponse.json({ error: "Unknown problem" }, { status: 400 });
  }

  await dbExecute(`INSERT INTO problem_marks (id, user_id, problem_id) VALUES (?, ?, ?)`, [
    createId("mark"),
    user.id,
    problem.id
  ]);

  return NextResponse.json({ ok: true });
}
