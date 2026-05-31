import { LearnSetup } from "@/components/learn-setup";
import { requireUser } from "@/lib/auth";

export default async function LearnSetupPage() {
  await requireUser("/learn/setup");
  return <LearnSetup />;
}
