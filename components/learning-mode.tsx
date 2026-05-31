"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions,
  type AppProblem
} from "@/lib/product";

type LearningModeProps = {
  patternIds: string[];
  coachStyle: "beginner" | "guided" | "optional" | "off";
};

const difficultyRank: Record<string, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  Official: 3
};

export function LearningMode({ patternIds, coachStyle }: LearningModeProps) {
  const [selectedCoachStyle, setSelectedCoachStyle] = useState(coachStyle);
  const selectedPatterns = useMemo(() => {
    return patternOptions.filter((pattern) =>
      patternIds.length > 0 ? patternIds.includes(pattern.id) : true
    );
  }, [patternIds]);

  const selectedPatternIds = selectedPatterns.map((pattern) => pattern.id);

  const suggestedProblems = useMemo(() => {
    return allProblems
      .filter((problem) =>
        selectedPatternIds.length > 0
          ? selectedPatternIds.includes(problem.targetPatternId)
          : true
      )
      .sort((left, right) => {
        const difficultyGap =
          (difficultyRank[left.difficulty] ?? 99) - (difficultyRank[right.difficulty] ?? 99);

        if (difficultyGap !== 0) return difficultyGap;

        const leftOfficial = getOfficialProblemRoadmapMeta(left.id)?.tracks.length ?? 0;
        const rightOfficial = getOfficialProblemRoadmapMeta(right.id)?.tracks.length ?? 0;
        return rightOfficial - leftOfficial || left.title.localeCompare(right.title);
      })
      .slice(0, 18);
  }, [selectedPatternIds]);

  const groupedProblems = useMemo(() => {
    return selectedPatterns.map((pattern) => ({
      pattern,
      problems: suggestedProblems.filter((problem) => problem.targetPatternId === pattern.id).slice(0, 6)
    }));
  }, [selectedPatterns, suggestedProblems]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="uiverse-panel px-6 py-7 md:px-8">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-coral">
            Learning Mode
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            Learn one pattern family at a time.
          </h1>
          <p className="mt-4 text-base leading-7 text-black/70">
            This mode is for focused learning, not just testing yourself. We&apos;ll
            suggest problems from the patterns you picked, and the coach style stays
            on{" "}
            <span className="font-semibold text-ink">
              {selectedCoachStyle === "beginner"
                ? "Beginner Guided"
                : selectedCoachStyle === "guided"
                  ? "Guided"
                  : selectedCoachStyle === "optional"
                    ? "Hints On Demand"
                    : "Coach Off"}
            </span>
            .
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {selectedPatterns.map((pattern) => (
            <span
              key={pattern.id}
              className="rounded-full border border-white/14 bg-coral px-4 py-3 text-sm font-medium text-white shadow-[0_10px_20px_rgba(255,92,92,0.18)]"
            >
              {pattern.label}
            </span>
          ))}
        </div>
      </section>

      <section className="uiverse-panel px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-lg font-semibold text-ink">Choose how the coach behaves</p>
            <p className="mt-1 text-sm leading-6 text-black/64">
              Pick the teaching style first, then open one of the suggested questions below.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                id: "beginner",
                title: "Beginner Guided",
                body: "Stronger teaching, clearer nudges, and more explanation of why choices work."
              },
              {
                id: "guided",
                title: "Guided",
                body: "Balanced support that still leaves the main solving work in your hands."
              },
              {
                id: "optional",
                title: "Hints On Demand",
                body: "Mostly self-driven, with help ready whenever you want it."
              },
              {
                id: "off",
                title: "Coach Off",
                body: "A quieter coding run with no extra teaching until you ask for it."
              }
            ].map((style) => {
              const isActive = selectedCoachStyle === style.id;

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedCoachStyle(style.id as LearningModeProps["coachStyle"])}
                  className={`mode-choice p-5 text-left ${
                    isActive ? "uiverse-choice-active text-white" : "text-ink"
                  }`}
                >
                  <p className="text-sm font-semibold">{style.title}</p>
                  <p className={`mt-3 text-sm leading-6 ${isActive ? "text-white/80" : "text-black/64"}`}>
                    {style.body}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <InfoCard
          title="How this mode teaches"
          body="Start with easier reps, let the coach explain the pattern signals, then move toward harder variants once the core loop feels natural."
        />
        <InfoCard
          title="What the coach should do"
          body="Explain why a structure helps, when your instinct is drifting, and how the brute force path differs from the cleaner optimal path."
        />
        <InfoCard
          title="What you can switch later"
          body="You can always jump into Pattern Recognition or Pure Practice once you no longer want the heavier teaching layer."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {groupedProblems.map(({ pattern, problems }) => (
          <section key={pattern.id} className="pattern-cluster p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-ink">{pattern.label}</p>
                <p className="mt-2 text-sm leading-6 text-black/66">
                  {pattern.coachPrompt}
                </p>
              </div>
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/60">
                {problems.length} suggestions
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {problems.map((problem) => (
                <ProblemSuggestionCard
                  key={problem.id}
                  problem={problem}
                  coachStyle={selectedCoachStyle}
                  patternIds={selectedPatternIds}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ProblemSuggestionCard({
  problem,
  coachStyle,
  patternIds
}: {
  problem: AppProblem;
  coachStyle: "beginner" | "guided" | "optional" | "off";
  patternIds: string[];
}) {
  const roadmapMeta = getOfficialProblemRoadmapMeta(problem.id);
  const params = new URLSearchParams();
  params.set("problem", problem.id);
  params.set("mode", "learn");
  params.set("coach", coachStyle);
  if (patternIds.length > 0) {
    params.set("patterns", patternIds.join(","));
  }
  const practiceHref = `/practice?${params.toString()}`;

  return (
    <div className="rounded-[8px] border border-black/10 bg-white/88 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-black/16">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-ink">{problem.title}</p>
        {roadmapMeta?.leetcodeNumber ? (
          <span className="rounded-full border border-black/10 bg-mist px-2 py-1 text-[11px] font-medium text-black/60">
            #{roadmapMeta.leetcodeNumber}
          </span>
        ) : null}
        {roadmapMeta?.tracks.map((track) => (
          <span
            key={`${problem.id}-${track}`}
            className="rounded-full border border-black/10 bg-mist px-2 py-1 text-[11px] font-medium text-black/60"
          >
            {track === "blind75" ? "75" : "150"}
          </span>
        ))}
        <span className="rounded-full border border-black/10 bg-mist px-2 py-1 text-[11px] font-medium text-black/60">
          {problem.difficulty}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-black/66">{problem.reviewQuestion}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={practiceHref}
          className="uiverse-button inline-flex items-center justify-center px-4 py-2 text-sm font-medium"
        >
          Start with coach
        </Link>
        <Link
          href={`/practice?problem=${encodeURIComponent(problem.id)}&mode=practice&coach=off`}
          className="uiverse-button-secondary inline-flex items-center justify-center px-4 py-2 text-sm font-medium"
        >
          Open as pure practice
        </Link>
      </div>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="uiverse-panel p-6">
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="mt-3 text-sm leading-6 text-black/66">{body}</p>
    </section>
  );
}
