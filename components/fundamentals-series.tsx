"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/product-system";
import { fundamentalsSeries, fundamentalsSeriesUrl, type FundamentalsEpisode } from "@/lib/fundamentals-series";
import { TIER_LABEL, tierForReps } from "@/lib/mastery-tiers";
import { openSideBySideWindow } from "@/lib/popup-window";
import { allProblems } from "@/lib/product";

const DEFAULT_HREF_PARAMS = "mode=practice&coach=guided";

const problemsById = new Map(allProblems.map((problem) => [problem.id, problem]));

const TIER_TONE = {
  none: "neutral",
  seen: "info",
  practiced: "info",
  mastered: "success"
} as const;

export function episodeVideoUrl(ep: FundamentalsEpisode) {
  return ep.bvid ? `https://www.bilibili.com/video/${ep.bvid}/` : fundamentalsSeriesUrl;
}

export function ProblemRow({ problemId, reps, muted = false }: { problemId: string; reps: Record<string, number>; muted?: boolean }) {
  const problem = problemsById.get(problemId);
  if (!problem) return null;
  const tier = tierForReps(reps[problemId] ?? 0);
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
        muted ? "border-dashed border-black/12 bg-white/30" : "border-black/8 bg-white/60"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{problem.title}</p>
        <p className="text-xs text-black/50">{problem.difficulty}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge tone={TIER_TONE[tier]}>{TIER_LABEL[tier]}</StatusBadge>
        <Link
          href={`/practice?${DEFAULT_HREF_PARAMS}&problem=${problemId}`}
          className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:opacity-85"
        >
          Practice →
        </Link>
      </div>
    </div>
  );
}

function episodeDone(ep: FundamentalsEpisode, reps: Record<string, number>) {
  return [...ep.problemIds, ...(ep.relatedProblemIds ?? [])].some((id) => (reps[id] ?? 0) > 0);
}

export function FundamentalsSeriesView({ reps }: { reps: Record<string, number> }) {
  const doneCount = fundamentalsSeries.filter((ep) => episodeDone(ep, reps)).length;
  const nextEpisode = fundamentalsSeries.find((ep) => !episodeDone(ep, reps));

  return (
    <div className="grid gap-6">
      <div className="uiverse-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-ember">Curated series</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink">
          A guided walkthrough for beginners, step by step.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
          One video, one matching problem, then the coach - in that order, 27 times. {doneCount} of{" "}
          {fundamentalsSeries.length} done.{" "}
          <button
            type="button"
            onClick={() => openSideBySideWindow(fundamentalsSeriesUrl, "bilibili-playlist")}
            className="underline"
          >
            Source playlist ↗
          </button>
        </p>

        {nextEpisode ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                Continue - step {nextEpisode.episode} of {fundamentalsSeries.length}
              </p>
              <p className="mt-0.5 truncate text-base font-semibold text-white">{nextEpisode.titleEn}</p>
            </div>
            <Link
              href={`/fundamentals/${nextEpisode.episode}`}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90"
            >
              Continue →
            </Link>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
            You&apos;ve been through all 27 steps. Revisit any of them below anytime.
          </p>
        )}
      </div>

      <section className="grid gap-3">
        {fundamentalsSeries.map((ep) => {
          const done = episodeDone(ep, reps);
          return (
            <Link
              key={ep.episode}
              href={`/fundamentals/${ep.episode}`}
              className="uiverse-panel flex items-center justify-between gap-4 p-4 transition hover:border-black/20"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    done ? "bg-emerald-100 text-emerald-700" : "bg-mist text-black/50"
                  }`}
                >
                  {done ? "✓" : ep.episode}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{ep.titleCn}</p>
                  <p className="truncate text-xs text-black/50">{ep.titleEn}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm text-black/40">→</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
