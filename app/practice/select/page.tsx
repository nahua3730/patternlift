import { ProblemSelection } from "@/components/problem-selection";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PracticeQuestionSelectionPage({
  searchParams
}: {
  searchParams?: {
    mode?: "recognize" | "practice";
    coach?: "beginner" | "guided" | "optional" | "off";
  };
}) {
  const params = new URLSearchParams();
  if (searchParams?.mode) params.set("mode", searchParams.mode);
  if (searchParams?.coach) params.set("coach", searchParams.coach);
  await requireUser(`/practice/select${params.toString() ? `?${params.toString()}` : ""}`);

  const mode = searchParams?.mode ?? "practice";
  const coach = searchParams?.coach ?? (mode === "recognize" ? "guided" : "off");

  if (mode !== "recognize" && mode !== "practice") {
    redirect("/practice/setup");
  }

  return <ProblemSelection mode={mode} coachStyle={coach} />;
}
