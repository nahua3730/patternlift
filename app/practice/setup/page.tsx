import { ModeSetup } from "@/components/mode-setup";
import { requireUser } from "@/lib/auth";

export default async function PracticeSetupPage() {
  await requireUser("/practice/setup");
  return <ModeSetup mode="practice" />;
}
