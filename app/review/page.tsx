import { ReviewPageView } from "@/components/state-views";
import { requireUser } from "@/lib/auth";

export default async function ReviewPage() {
  await requireUser("/review");
  return <ReviewPageView />;
}
