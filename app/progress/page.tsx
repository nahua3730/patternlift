import { ProgressPageView } from "@/components/state-views";
import { requireUser } from "@/lib/auth";

export default async function ProgressPage() {
  await requireUser("/progress");
  return <ProgressPageView />;
}
