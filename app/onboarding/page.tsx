import { OnboardingFlow } from "@/components/onboarding-flow";
import { requireUser } from "@/lib/auth";

export default async function OnboardingPage() {
  await requireUser("/onboarding");

  return <OnboardingFlow />;
}
