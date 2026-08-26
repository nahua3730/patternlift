import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbExecute, dbOne } from "@/lib/db";
import { validateMasteryAgentPlan } from "@/lib/mastery-agent";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { runId?: string; plan?: unknown };
  if (!body.runId) {
    return NextResponse.json({ error: "Missing recommendation run." }, { status: 400 });
  }
  const run = await dbOne<{ id: string }>(
    `SELECT id FROM mastery_agent_runs WHERE id = ? AND user_id = ? LIMIT 1`,
    [body.runId, user.id]
  );
  if (!run) return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });

  const plan = validateMasteryAgentPlan(body.plan);
  if (!plan) return NextResponse.json({ error: "Invalid session plan." }, { status: 400 });

  await dbExecute(
    `
      UPDATE mastery_agent_runs
      SET status = 'accepted', output_json = ?, accepted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `,
    [JSON.stringify(plan), body.runId, user.id]
  );

  const params = new URLSearchParams({
    problem: plan.problemId,
    mode: plan.studyMode,
    coach: plan.coachStyle,
    patterns: plan.patternId,
    quick: "1",
    agent: body.runId
  });
  return NextResponse.json({ plan, href: `/practice?${params.toString()}` });
}
