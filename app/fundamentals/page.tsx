import { FundamentalsSeriesView } from "@/components/fundamentals-series";
import { requireUser } from "@/lib/auth";
import { getRepCounts } from "@/lib/rep-counts";

export default async function FundamentalsPage() {
  const user = await requireUser("/fundamentals");
  const reps = await getRepCounts(user.id);

  return <FundamentalsSeriesView reps={reps} />;
}
