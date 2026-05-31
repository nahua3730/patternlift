import { LearningMode } from "@/components/learning-mode";
import { redirect } from "next/navigation";

export default function LearnPage({
  searchParams
}: {
  searchParams?: {
    patterns?: string;
    coach?: "beginner" | "guided" | "optional" | "off";
  };
}) {
  const patternIds = searchParams?.patterns?.split(",").filter(Boolean) ?? [];
  const coachStyle = searchParams?.coach ?? "guided";

  if (patternIds.length === 0) {
    redirect("/learn/setup");
  }

  return <LearningMode patternIds={patternIds} coachStyle={coachStyle} />;
}
