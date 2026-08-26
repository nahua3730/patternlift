import { MasteryAgentStart } from "@/components/mastery-agent-start";
import { requireUser } from "@/lib/auth";

export default async function StartPage() {
  await requireUser("/start");
  return <MasteryAgentStart />;
}
