import { ProblemSelection } from "@/components/problem-selection";
import { redirect } from "next/navigation";

export default function PracticeQuestionSelectionPage({
  searchParams
}: {
  searchParams?: {
    mode?: "recognize" | "practice";
    coach?: "beginner" | "guided" | "optional" | "off";
  };
}) {
  const mode = searchParams?.mode ?? "practice";
  const coach = searchParams?.coach ?? (mode === "recognize" ? "guided" : "off");

  if (mode !== "recognize" && mode !== "practice") {
    redirect("/practice/setup");
  }

  return <ProblemSelection mode={mode} coachStyle={coach} />;
}
