import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbExecute, dbOne } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { runId?: string };
  if (!body.runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const run = await dbOne<{ id: string }>(
    `SELECT id FROM study_plan_runs WHERE id = ? AND user_id = ?`,
    [body.runId, user.id]
  );
  if (!run) {
    return NextResponse.json({ error: "Study plan run not found" }, { status: 404 });
  }

  await dbExecute(
    `UPDATE study_plan_runs SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    [body.runId, user.id]
  );

  return NextResponse.json({ href: "/today" });
}
