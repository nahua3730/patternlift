"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePatternLiftState } from "@/components/patternlift-state";
import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions,
  type RoadmapTrack
} from "@/lib/product";

type RoadmapFilter = "all" | "official" | RoadmapTrack;
type SetupMode = "recognize" | "practice";
type CoachStyle = "beginner" | "guided" | "optional" | "off";

export function ProblemSelection({
  mode,
  coachStyle,
  patternIds = []
}: {
  mode: SetupMode | "learn";
  coachStyle: CoachStyle;
  patternIds?: string[];
}) {
  const { history } = usePatternLiftState();
  const [query, setQuery] = useState("");
  const [roadmapFilter, setRoadmapFilter] = useState<RoadmapFilter>("all");
  const completedProblemIds = useMemo(
    () => new Set(history.map((item) => item.problemId)),
    [history]
  );

  const selectedPatterns = patternOptions.filter((pattern) => patternIds.includes(pattern.id));
  const narrowedProblems = useMemo(() => {
    return allProblems.filter((problem) =>
      patternIds.length > 0 ? patternIds.includes(problem.targetPatternId) : true
    );
  }, [patternIds]);

  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return narrowedProblems
      .filter((problem) => {
        if (roadmapFilter === "all") return true;
        const meta = getOfficialProblemRoadmapMeta(problem.id);
        if (roadmapFilter === "official") return Boolean(meta);
        return Boolean(meta?.tracks.includes(roadmapFilter));
      })
      .map((problem) => {
        const haystack = [
          problem.title,
          problem.category,
          problem.prompt,
          problem.targetPatternId,
          problem.difficulty
        ]
          .join(" ")
          .toLowerCase();

        const score =
          (problem.title.toLowerCase().includes(normalizedQuery) ? 4 : 0) +
          (problem.category.toLowerCase().includes(normalizedQuery) ? 2 : 0) +
          (problem.prompt.toLowerCase().includes(normalizedQuery) ? 1 : 0) +
          (haystack.includes(normalizedQuery) ? 1 : 0);

        return { problem, score };
      })
      .filter((entry) => (normalizedQuery ? entry.score > 0 : true))
      .sort(
        (left, right) =>
          right.score - left.score || left.problem.title.localeCompare(right.problem.title)
      );
  }, [narrowedProblems, query, roadmapFilter]);

  const baseParams = new URLSearchParams();
  baseParams.set("mode", mode === "learn" ? "learn" : mode);
  baseParams.set("coach", coachStyle);
  if (patternIds.length > 0) {
    baseParams.set("patterns", patternIds.join(","));
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="uiverse-panel px-6 py-7 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">
          {mode === "learn" ? "Choose a problem" : mode === "recognize" ? "Pick a question to read" : "Pick a question to solve"}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          {mode === "learn"
            ? "Choose one problem and let the coach take it from there."
            : "Pick the problem before you enter the workspace."}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/68">
          Once you open the workspace, the screen stays focused on the conversation and your code.
          We keep the choosing here so the coach page can feel calm.
        </p>

        {selectedPatterns.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {selectedPatterns.map((pattern) => (
              <span
                key={pattern.id}
                className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-black/70"
              >
                {pattern.label}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="uiverse-panel px-6 py-6 md:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="text-sm text-black/68">
            Search questions
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="uiverse-field mt-2 block w-full px-4 py-3 text-sm text-ink"
              placeholder="Try: graph, substring, dp, binary search..."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all" as const, label: "All" },
              { id: "official" as const, label: "Official" },
              { id: "blind75" as const, label: "75" },
              { id: "neetcode150" as const, label: "150" }
            ].map((filterOption) => {
              const isActive = roadmapFilter === filterOption.id;
              return (
                <button
                  key={filterOption.id}
                  type="button"
                  onClick={() => setRoadmapFilter(filterOption.id)}
                  className={`coach-chip px-4 py-3 text-sm font-medium ${
                    isActive ? "border-coral/18 bg-coral text-white" : "text-black/68"
                  }`}
                >
                  {filterOption.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProblems.map(({ problem }) => {
          const meta = getOfficialProblemRoadmapMeta(problem.id);
          const params = new URLSearchParams(baseParams);
          params.set("problem", problem.id);
          const href = `/practice?${params.toString()}`;

          return (
            <Link key={problem.id} href={href} className="pattern-card text-left">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-ink">{problem.title}</p>
                {completedProblemIds.has(problem.id) ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                    Practiced
                  </span>
                ) : null}
                {meta?.leetcodeNumber ? (
                  <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-black/60">
                    #{meta.leetcodeNumber}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 line-clamp-4 text-sm leading-7 text-black/66">
                {problem.prompt}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/62">
                  {problem.category}
                </span>
                <span className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/62">
                  {problem.difficulty}
                </span>
                {meta?.tracks.map((track) => (
                  <span
                    key={`${problem.id}-${track}`}
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/62"
                  >
                    {track === "blind75" ? "Blind 75" : "NeetCode 150"}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm font-medium text-ink">
                <span>Open workspace</span>
                <span aria-hidden="true">→</span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
