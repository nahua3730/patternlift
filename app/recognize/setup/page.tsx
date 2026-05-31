import { ModeSetup } from "@/components/mode-setup";
import { requireUser } from "@/lib/auth";

export default async function RecognizeSetupPage() {
  await requireUser("/recognize/setup");
  return <ModeSetup mode="recognize" />;
}
