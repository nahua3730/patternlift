import { OnboardingFlow } from "@/components/onboarding-flow";
import { requireUser } from "@/lib/auth";
import { dbOne } from "@/lib/db";

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");

  const activePlan = await dbOne<{ id: string }>(
    `SELECT id FROM study_plan_runs WHERE user_id = ? AND status = 'accepted' ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );

  return <OnboardingFlow hasExistingPlan={Boolean(activePlan)} />;
}
