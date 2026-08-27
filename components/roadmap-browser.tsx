"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { usePatternLiftState } from "@/components/patternlift-state";
import {
  ProductEmptyState,
  ProductSurface,
  SegmentedControl,
  StatusBadge
} from "@/components/product-system";
import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions,
  type AppProblem,
  type RoadmapTrack
} from "@/lib/product";
import { TIER_LABEL, tierForReps } from "@/lib/mastery-tiers";

const DEFAULT_HREF_PARAMS = "mode=practice&coach=guided";
const DIFFICULTY_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

function difficultyRank(difficulty: string) {
  return DIFFICULTY_ORDER[difficulty] ?? 3;
}

export function RoadmapBrowser({ initialReps }: { initialReps: Record<string, number> }) {
  const router = useRouter();
  const { history } = usePatternLiftState();
  const [track, setTrack] = useState<RoadmapTrack>("neetcode150");
  const [query, setQuery] = useState("");
  const [reps, setReps] = useState<Record<string, number>>(initialReps);
  const [detailProblem, setDetailProblem] = useState<AppProblem | null>(null);
  const [gateChoice, setGateChoice] = useState<string | null>(null);
  const [gateReason, setGateReason] = useState("");
  const [marking, setMarking] = useState(false);

  const completedProblemIds = useMemo(
    () => new Set(history.map((item) => item.problemId)),
    [history]
  );

  const normalizedQuery = query.trim().toLowerCase();

  const groups = useMemo(() => {
    return patternOptions
      .map((pattern) => {
        const problems = allProblems.filter((problem) => {
          if (problem.targetPatternId !== pattern.id) return false;
          const meta = getOfficialProblemRoadmapMeta(problem.id);
          if (!meta?.tracks.includes(track)) return false;
          if (!normalizedQuery) return true;
          const haystack = `${problem.title} ${problem.category} ${pattern.label}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        });
        return { pattern, problems };
      })
      .filter((group) => group.problems.length > 0);
  }, [normalizedQuery, track]);

  const totalProblems = groups.reduce((sum, group) => sum + group.problems.length, 0);

  function hrefFor(problemId: string) {
    return `/practice?${DEFAULT_HREF_PARAMS}&problem=${problemId}`;
  }

  function openProblem(problem: AppProblem) {
    setDetailProblem(problem);
    setGateChoice(null);
    setGateReason("");
  }

  function closeProblem() {
    setDetailProblem(null);
    setGateChoice(null);
    setGateReason("");
  }

  function commitGate() {
    if (!detailProblem) return;
    router.push(hrefFor(detailProblem.id));
  }

  async function markRep() {
    if (!detailProblem || marking) return;
    const problemId = detailProblem.id;
    setMarking(true);
    setReps((current) => ({ ...current, [problemId]: (current[problemId] ?? 0) + 1 }));
    try {
      const response = await fetch("/api/roadmap/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId })
      });
      if (!response.ok) throw new Error("Failed to mark");
    } catch {
      setReps((current) => ({ ...current, [problemId]: Math.max(0, (current[problemId] ?? 1) - 1) }));
    } finally {
      setMarking(false);
    }
  }

  const gateOptions = useMemo(() => {
    if (!detailProblem) return [];
    const target = patternOptions.find((pattern) => pattern.id === detailProblem.targetPatternId);
    const contrast = patternOptions.find((pattern) => pattern.id === detailProblem.contrastPatternId);
    const extra = patternOptions.find(
      (pattern) => pattern.id !== target?.id && pattern.id !== contrast?.id
    );
    return [target, contrast, extra].filter((pattern): pattern is (typeof patternOptions)[number] => Boolean(pattern));
  }, [detailProblem]);

  const detailReps = detailProblem ? reps[detailProblem.id] ?? 0 : 0;
  const detailTier = tierForReps(detailReps);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="uiverse-panel px-6 py-7 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">Browse by pattern</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          Grouped by pattern, not problem number.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/68">
          Knowing which bucket a problem lives in is half the interview. {totalProblems} problems ·{" "}
          {completedProblemIds.size} practiced.
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-black/56">
          Each node below is one problem — it lights up more as you repeat it: one rep, two reps, three or
          more counts as mastered.
        </p>
      </section>

      <ProductSurface className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <label className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Search problems or patterns
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="uiverse-field mt-2 block w-full px-4 py-3 text-sm font-normal normal-case tracking-normal text-ink"
              placeholder="Try: two pointers, dp, graph..."
            />
          </label>

          <SegmentedControl
            value={track}
            onChange={setTrack}
            options={[
              { value: "blind75", label: "Blind 75" },
              { value: "neetcode150", label: "NeetCode 150" }
            ]}
          />
        </div>
      </ProductSurface>

      {groups.length === 0 ? (
        <ProductEmptyState
          title="No matching problems"
          description="Try a broader search or switch tracks."
        />
      ) : (
        groups.map(({ pattern, problems }) => {
          const doneCount = problems.filter((problem) => (reps[problem.id] ?? 0) > 0).length;
          const progress = Math.round((doneCount / problems.length) * 100);

          const byDifficulty = new Map<string, AppProblem[]>();
          for (const problem of problems) {
            const bucket = byDifficulty.get(problem.difficulty) ?? [];
            bucket.push(problem);
            byDifficulty.set(problem.difficulty, bucket);
          }
          const orderedDifficulties = Array.from(byDifficulty.keys()).sort(
            (left, right) => difficultyRank(left) - difficultyRank(right)
          );

          return (
            <div key={pattern.id}>
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <StatusBadge tone="info">{pattern.label}</StatusBadge>
                  <span className="text-xs font-medium text-slate-500">
                    {doneCount} of {problems.length} done
                  </span>
                </div>
                <div className="pattern-progress-track w-28">
                  <div className="pattern-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                {orderedDifficulties.map((difficulty) => (
                  <div key={difficulty} className="mb-3.5 last:mb-0">
                    <div className="roadmap-difficulty-label">{difficulty}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(byDifficulty.get(difficulty) ?? []).map((problem) => {
                        const meta = getOfficialProblemRoadmapMeta(problem.id);
                        const tier = tierForReps(reps[problem.id] ?? 0);
                        return (
                          <button
                            key={problem.id}
                            type="button"
                            onClick={() => openProblem(problem)}
                            title={problem.title}
                            className={`roadmap-node roadmap-node-${tier}`}
                          >
                            {meta?.leetcodeNumber ?? problem.title.slice(0, 2).toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {detailProblem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={closeProblem}
        >
          <div
            className="uiverse-panel w-full max-w-lg overflow-hidden bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-500">
                  {detailReps === 0 ? "Before you open it" : TIER_LABEL[detailTier]}
                </span>
                <StatusBadge
                  tone={
                    detailProblem.difficulty === "Hard"
                      ? "attention"
                      : detailProblem.difficulty === "Easy"
                        ? "success"
                        : "neutral"
                  }
                >
                  {detailProblem.difficulty}
                </StatusBadge>
              </div>
              <h3 className="text-lg font-semibold text-ink">{detailProblem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-black/64">{detailProblem.prompt}</p>
            </div>

            {detailReps === 0 ? (
              <div className="px-6 py-5">
                <p className="mb-3 text-sm font-semibold text-ink">Which pattern do you think this is?</p>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  {gateOptions.map((pattern) => (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => setGateChoice(pattern.id)}
                      className={`uiverse-chip px-3.5 py-3 text-left text-sm font-semibold ${
                        gateChoice === pattern.id ? "uiverse-chip-active" : "text-slate-700"
                      }`}
                    >
                      {pattern.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setGateChoice("unsure")}
                    className={`uiverse-chip px-3.5 py-3 text-left text-sm font-semibold ${
                      gateChoice === "unsure" ? "uiverse-chip-active" : "text-slate-700"
                    }`}
                  >
                    Not sure yet
                  </button>
                </div>

                <label className="mb-5 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Why do you think that? (optional)
                  </span>
                  <textarea
                    value={gateReason}
                    onChange={(event) => setGateReason(event.target.value)}
                    rows={2}
                    className="uiverse-field mt-2 block w-full px-3.5 py-2.5 text-sm text-ink"
                    placeholder="One sentence — helps the coach calibrate today"
                  />
                </label>

                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={commitGate} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                    Skip — just let me look
                  </button>
                  <button
                    type="button"
                    onClick={commitGate}
                    disabled={!gateChoice}
                    className="uiverse-button px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Commit &amp; open editor
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5">
                <p className="mb-4 text-sm text-slate-500">
                  You&apos;ve logged {detailReps} rep{detailReps === 1 ? "" : "s"} on this one.
                </p>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={markRep}
                    disabled={marking}
                    className="uiverse-chip px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    I did this again
                  </button>
                  <button
                    type="button"
                    onClick={commitGate}
                    className="uiverse-button px-5 py-2.5 text-sm font-semibold"
                  >
                    Practice again →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
