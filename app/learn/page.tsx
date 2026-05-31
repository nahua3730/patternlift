import { LearningMode } from "@/components/learning-mode";

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

  return <LearningMode patternIds={patternIds} coachStyle={coachStyle} />;
}
