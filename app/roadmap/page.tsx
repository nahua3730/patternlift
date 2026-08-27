import { RoadmapBrowser } from "@/components/roadmap-browser";
import { requireUser } from "@/lib/auth";
import { getRepCounts } from "@/lib/rep-counts";

export default async function RoadmapPage() {
  const user = await requireUser("/roadmap");
  const initialReps = await getRepCounts(user.id);

  return <RoadmapBrowser initialReps={initialReps} />;
}
