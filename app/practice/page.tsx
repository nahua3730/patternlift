import { PracticePageView } from "@/components/state-views";
import { redirect } from "next/navigation";

export default function PracticePage({
  searchParams
}: {
  searchParams?: {
    problem?: string;
    mode?: "learn" | "recognize" | "practice";
    coach?: "beginner" | "guided" | "optional" | "off";
  };
}) {
  if (!searchParams?.mode && !searchParams?.problem) {
    redirect("/practice/setup");
  }

  return (
    <PracticePageView
      initialProblemId={searchParams?.problem}
      mode={searchParams?.mode}
      coachStyle={searchParams?.coach}
    />
  );
}
