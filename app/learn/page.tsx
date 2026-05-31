import { LearningMode } from "@/components/learning-mode";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LearnPage({
  searchParams
}: {
  searchParams?: {
    patterns?: string;
    coach?: "beginner" | "guided" | "optional" | "off";
  };
}) {
  const params = new URLSearchParams();
  if (searchParams?.patterns) params.set("patterns", searchParams.patterns);
  if (searchParams?.coach) params.set("coach", searchParams.coach);
  await requireUser(`/learn${params.toString() ? `?${params.toString()}` : ""}`);

  const patternIds = searchParams?.patterns?.split(",").filter(Boolean) ?? [];
  const coachStyle = searchParams?.coach ?? "guided";

  if (patternIds.length === 0) {
    redirect("/learn/setup");
  }

  return <LearningMode patternIds={patternIds} coachStyle={coachStyle} />;
}
