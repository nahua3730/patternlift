"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePatternLiftState } from "@/components/patternlift-state";
import {
  ProductEmptyState,
  ProductList,
  ProductRow,
  ProductSurface,
  SegmentedControl,
  StatusBadge
} from "@/components/product-system";
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

      <ProductSurface className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <label className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Search problems
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="uiverse-field mt-2 block w-full px-4 py-3 text-sm font-normal normal-case tracking-normal text-ink"
              placeholder="Try: graph, substring, dp, binary search..."
            />
          </label>

          <SegmentedControl
            value={roadmapFilter}
            onChange={setRoadmapFilter}
            options={[
              { value: "all", label: "All" },
              { value: "official", label: "Official" },
              { value: "blind75", label: "Blind 75" },
              { value: "neetcode150", label: "NC 150" }
            ]}
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3 text-xs text-slate-500">
          <span>{filteredProblems.length} problems</span>
          <span>{completedProblemIds.size} practiced</span>
        </div>

        {filteredProblems.length > 0 ? <ProductList>{filteredProblems.map(({ problem }) => {
          const meta = getOfficialProblemRoadmapMeta(problem.id);
          const params = new URLSearchParams(baseParams);
          params.set("problem", problem.id);
          const href = `/practice?${params.toString()}`;

          const pattern = patternOptions.find((entry) => entry.id === problem.targetPatternId);
          return (
            <Link key={problem.id} href={href} className="product-row-link">
              <ProductRow
                leading={<span className="problem-row-index">{meta?.leetcodeNumber ?? problem.title.slice(0, 2).toUpperCase()}</span>}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{problem.title}</span>
                    {completedProblemIds.has(problem.id) ? <StatusBadge tone="success">Practiced</StatusBadge> : null}
                    <StatusBadge tone={problem.difficulty === "Hard" ? "attention" : problem.difficulty === "Easy" ? "success" : "neutral"}>{problem.difficulty}</StatusBadge>
                  </span>
                }
                description={<span className="line-clamp-2">{problem.prompt}</span>}
                meta={<span>{pattern?.label ?? problem.category}</span>}
                trailing={<span className="product-row-arrow" aria-hidden="true">→</span>}
              />
            </Link>
          );
        })}</ProductList> : (
          <ProductEmptyState title="No matching problems" description="Try a broader search or switch back to all roadmaps." />
        )}
      </ProductSurface>
    </div>
  );
}
