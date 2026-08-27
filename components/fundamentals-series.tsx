import Link from "next/link";
import { StatusBadge } from "@/components/product-system";
import { fundamentalsSeries, fundamentalsSeriesUrl, type FundamentalsEpisode } from "@/lib/fundamentals-series";
import { TIER_LABEL, tierForReps } from "@/lib/mastery-tiers";
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

export function FundamentalsSeriesView({ reps }: { reps: Record<string, number> }) {
  const matchedProblemCount = fundamentalsSeries.reduce((sum, ep) => sum + ep.problemIds.length, 0);
  const practicedCount = fundamentalsSeries.reduce(
    (sum, ep) => sum + ep.problemIds.filter((id) => (reps[id] ?? 0) > 0).length,
    0
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-ember">Curated series</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            A guided walkthrough for beginners, step by step.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-black/72">
            27 steps in a fixed order, each one built around a core technique. Watch the explainer, then
            practice the matching problem here with the live coach - or jump straight to practicing if you
            already know the idea.
          </p>
          <p className="mt-4 text-sm font-medium text-black/60">
            {practicedCount} of {matchedProblemCount} matched problems practiced at least once
          </p>
        </div>

        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-lake">Source Note</p>
          <p className="mt-4 text-sm leading-7 text-black/72">
            This sequence follows the order of the &ldquo;基础算法精讲&rdquo; playlist by 灵茶山艾府 on
            Bilibili. PatternLift doesn&apos;t reproduce or summarize the videos themselves - each step just
            points at the matching problem already in our catalog (when one exists), plus a link back to the
            original video so you can watch the explanation on Bilibili.
          </p>
          <a
            href={fundamentalsSeriesUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full border border-black/10 bg-mist px-4 py-2 text-sm font-medium text-black/72 transition hover:border-black/24"
          >
            Open the playlist on Bilibili ↗
          </a>
        </div>
      </section>

      <section className="grid gap-4">
        {fundamentalsSeries.map((ep) => (
          <article key={ep.episode} className="uiverse-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Step {ep.episode} of {fundamentalsSeries.length}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{ep.titleCn}</h2>
                <p className="text-sm text-black/60">{ep.titleEn}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={episodeVideoUrl(ep)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-black/10 bg-mist px-3 py-2 text-xs font-medium text-black/72 transition hover:border-black/24"
                >
                  Open on Bilibili ↗
                </a>
                <Link
                  href={`/fundamentals/${ep.episode}`}
                  className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:opacity-85"
                >
                  Watch & discuss →
                </Link>
              </div>
            </div>

            {ep.note ? <p className="mt-3 text-sm leading-6 text-black/60">{ep.note}</p> : null}

            {ep.problemIds.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {ep.problemIds.map((problemId) => (
                  <ProblemRow key={problemId} problemId={problemId} reps={reps} />
                ))}
              </div>
            ) : null}

            {ep.relatedProblemIds && ep.relatedProblemIds.length > 0 ? (
              <div className="mt-4 grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
                  Related practice (different problem, same technique)
                </p>
                {ep.relatedProblemIds.map((problemId) => (
                  <ProblemRow key={problemId} problemId={problemId} reps={reps} muted />
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
