import { notFound } from "next/navigation";
import { FundamentalsEpisodeView } from "@/components/fundamentals-episode-view";
import { requireUser } from "@/lib/auth";
import { fundamentalsSeries } from "@/lib/fundamentals-series";
import { getRepCounts } from "@/lib/rep-counts";

export default async function FundamentalsEpisodePage({
  params
}: {
  params: { episode: string };
}) {
  const episodeNumber = Number(params.episode);
  const episode = fundamentalsSeries.find((ep) => ep.episode === episodeNumber);
  if (!episode) notFound();

  const user = await requireUser(`/fundamentals/${episodeNumber}`);
  const reps = await getRepCounts(user.id);

  return <FundamentalsEpisodeView episode={episode} reps={reps} />;
}
