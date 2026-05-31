import { PracticePageView } from "@/components/state-views";
import { redirect } from "next/navigation";

export default function PracticePage({
  searchParams
}: {
  searchParams?: {
    problem?: string;
    mode?: "learn" | "recognize" | "practice";
    coach?: "beginner" | "guided" | "optional" | "off";
    patterns?: string;
  };
}) {
  if (!searchParams?.problem) {
    if (searchParams?.mode === "recognize" || searchParams?.mode === "practice") {
      const params = new URLSearchParams();
      params.set("mode", searchParams.mode);
      if (searchParams.coach) params.set("coach", searchParams.coach);
      redirect(`/practice/select?${params.toString()}`);
    }

    redirect("/practice/setup");
  }

  return (
    <PracticePageView
      initialProblemId={searchParams?.problem}
      mode={searchParams?.mode}
      coachStyle={searchParams?.coach}
      selectedPatternIds={searchParams?.patterns?.split(",").filter(Boolean) ?? []}
    />
  );
}
