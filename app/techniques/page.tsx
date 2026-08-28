import { TechniquesPageView } from "@/components/state-views";
import { getCurrentUser } from "@/lib/auth";
import { getRepCounts } from "@/lib/rep-counts";

export default async function TechniquesPage() {
  const user = await getCurrentUser();
  const reps = user ? await getRepCounts(user.id) : {};

  return <TechniquesPageView reps={reps} />;
}
