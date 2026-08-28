import { redirect } from "next/navigation";
import { SessionRunner } from "@/components/session-runner";
import { requireUser } from "@/lib/auth";
import { dbOne } from "@/lib/db";

export default async function TodayPage() {
  const user = await requireUser("/today");

  const activePlan = await dbOne<{ id: string }>(
    `SELECT id FROM study_plan_runs WHERE user_id = ? AND status = 'accepted' ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );

  if (!activePlan) {
    redirect("/onboarding");
  }

  return <SessionRunner />;
}
