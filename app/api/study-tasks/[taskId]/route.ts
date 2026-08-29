import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbExecute } from "@/lib/db";

// Marks a single Study Plan task done (or skipped). Synthesized legacy
// tasks (ids prefixed "legacy-", from an old-shape accepted plan with no
// real study_tasks rows) simply match zero rows here - harmless no-op,
// their "done" state is tracked client-side from step completion instead.
export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { status?: "pending" | "done" | "skipped" };
  const status = body.status === "done" || body.status === "skipped" ? body.status : "pending";

  await dbExecute(
    `
      UPDATE study_tasks
      SET status = ?, completed_at = CASE WHEN ? = 'done' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ? AND user_id = ?
    `,
    [status, status, params.taskId, user.id]
  );

  return NextResponse.json({ ok: true });
}
