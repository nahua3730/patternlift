import { RoadmapBrowser } from "@/components/roadmap-browser";
import { requireUser } from "@/lib/auth";

export default async function RoadmapPage() {
  await requireUser("/roadmap");

  return <RoadmapBrowser />;
}
