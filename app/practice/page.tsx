import { PracticePageView } from "@/components/state-views";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PracticePage({
  searchParams
}: {
  searchParams?: {
    problem?: string;
    mode?: "learn" | "recognize" | "practice";
    coach?: "beginner" | "guided" | "optional" | "off";
    patterns?: string;
  };
}) {
  const params = new URLSearchParams();
  if (searchParams?.problem) params.set("problem", searchParams.problem);
  if (searchParams?.mode) params.set("mode", searchParams.mode);
  if (searchParams?.coach) params.set("coach", searchParams.coach);
  if (searchParams?.patterns) params.set("patterns", searchParams.patterns);
  await requireUser(`/practice${params.toString() ? `?${params.toString()}` : ""}`);

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
