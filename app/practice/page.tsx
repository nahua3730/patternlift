import { PracticePageView } from "@/components/state-views";

export default function PracticePage({
  searchParams
}: {
  searchParams?: {
    problem?: string;
    mode?: "learn" | "recognize" | "practice";
    coach?: "beginner" | "guided" | "optional" | "off";
  };
}) {
  return (
    <PracticePageView
      initialProblemId={searchParams?.problem}
      mode={searchParams?.mode}
      coachStyle={searchParams?.coach}
    />
  );
}
