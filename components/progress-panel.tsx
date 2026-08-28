import Link from "next/link";
import { allProblems, patternOptions } from "@/lib/product";
import { tierForReps } from "@/lib/mastery-tiers";
import type { buildMasteryModel, MasteryAttempt } from "@/lib/mastery";
import type { SkillDimension, TechniqueSkillVector } from "@/lib/skill-vector";
import { SCAFFOLD_LABEL, type ScaffoldLevel } from "@/lib/scaffold";
import { ProductList, ProductRow } from "@/components/product-system";
import { ProgressRing } from "@/components/progress-ring";

// Plain-language labels for the six dimensions - never shown as jargon like
// "implementation: 62" without context. Order matters: this is the display
// order for the expanded breakdown.
const SKILL_LABELS: Record<SkillDimension, string> = {
  recognition: "Recognizing this pattern",
  concept: "Explaining why it fits",
  reasoning: "Reasoning through the invariant",
  implementation: "Turning it into working code",
  independence: "Solving without hints",
  retention: "Remembering it over time"
};
const SKILL_ORDER: SkillDimension[] = [
  "recognition",
  "concept",
  "reasoning",
  "implementation",
  "independence",
  "retention"
];

// Only flag a bottleneck when there's real evidence AND the score is low
// enough to be worth calling out - otherwise every pattern would show a
// "weakest" line even when everything is fine.
function bottleneckFor(skills: TechniqueSkillVector | undefined) {
  if (!skills) return null;
  const withEvidence = SKILL_ORDER.filter((dimension) => skills[dimension].evidenceCount > 0);
  if (withEvidence.length === 0) return null;
  const weakest = withEvidence.reduce((min, dimension) =>
    skills[dimension].score < skills[min].score ? dimension : min
  );
  if (skills[weakest].score >= 70) return null;
  return { dimension: weakest, label: SKILL_LABELS[weakest], score: skills[weakest].score };
}

// V2.3 Part 17: a small, plain-language trend showing whether support is
// fading over time, e.g. "Heavy support → Partial skeleton → Independent".
// attempts is expected newest-first (loadRecentAttempts ordering); only
// consecutive DISTINCT levels are kept so a run of five "Independent"
// attempts in a row doesn't repeat the same word five times.
function supportTrendFor(attempts: MasteryAttempt[], patternLabel: string): string | null {
  const oldestFirst = attempts
    .filter((attempt) => attempt.actualPatternLabel === patternLabel && attempt.scaffoldLevel != null)
    .slice()
    .reverse();
  if (oldestFirst.length < 2) return null;

  const levels: ScaffoldLevel[] = [];
  for (const attempt of oldestFirst) {
    const level = attempt.scaffoldLevel as ScaffoldLevel;
    if (levels[levels.length - 1] !== level) levels.push(level);
  }
  if (levels.length < 2) return null;

  return levels
    .slice(-3)
    .map((level) => SCAFFOLD_LABEL[level])
    .join(" → ");
}

type ProgressPanelProps = {
  totalAttempts: number;
  solidAttempts: number;
  reviewDueCount: number;
  streak: number;
  masteryModel: ReturnType<typeof buildMasteryModel>;
  reps: Record<string, number>;
  recentAttempts: MasteryAttempt[];
};

const STATUS_COPY: Record<
  "new" | "building" | "strong" | "mastered",
  { label: string; className: string }
> = {
  new: { label: "Not started", className: "bg-stone-100 text-stone-700" },
  building: { label: "Building", className: "bg-amber-100 text-amber-700" },
  strong: { label: "Solid", className: "bg-sky-100 text-sky-700" },
  mastered: { label: "Mastered", className: "bg-emerald-100 text-emerald-700" }
};

export function ProgressPanel({
  totalAttempts,
  solidAttempts,
  reviewDueCount,
  streak,
  masteryModel,
  reps,
  recentAttempts
}: ProgressPanelProps) {
  const accuracy = totalAttempts === 0 ? 0 : Math.round((solidAttempts / totalAttempts) * 100);
  const masteryById = new Map(masteryModel.mastery.map((pattern) => [pattern.id, pattern]));

  const patternRows = patternOptions.map((pattern) => {
    const problems = allProblems.filter((problem) => problem.targetPatternId === pattern.id);
    const total = problems.length;
    let masteredCount = 0;
    let touchedCount = 0;
    for (const problem of problems) {
      const tier = tierForReps(reps[problem.id] ?? 0);
      if (tier !== "none") touchedCount += 1;
      if (tier === "mastered") masteredCount += 1;
    }
    const percentMastered = total === 0 ? 0 : Math.round((masteredCount / total) * 100);
    const evidence = masteryById.get(pattern.id);

    return {
      id: pattern.id,
      label: pattern.label,
      total,
      masteredCount,
      touchedCount,
      percentMastered,
      attempts: evidence?.attempts ?? 0,
      status: evidence?.status ?? "new",
      diagnosis:
        evidence && evidence.attempts > 0
          ? evidence.diagnosis
          : touchedCount > 0
            ? `${touchedCount} of ${total} problems touched. Keep repeating to build mastery.`
            : "Not started yet.",
      recommendedProblemId: evidence?.recommendedProblemId ?? null,
      skills: evidence?.skills,
      bottleneck: bottleneckFor(evidence?.skills),
      supportTrend: supportTrendFor(recentAttempts, pattern.label)
    };
  });

  const rankedPatternRows = [...patternRows].sort((left, right) => {
    if (left.attempts > 0 && right.attempts > 0) {
      return (masteryById.get(left.id)?.mastery ?? 0) - (masteryById.get(right.id)?.mastery ?? 0);
    }
    if (left.attempts > 0) return -1;
    if (right.attempts > 0) return 1;
    return right.touchedCount - left.touchedCount;
  });

  const overallRingSegments = ["Easy", "Medium", "Hard"].map((difficulty, index) => {
    const color = ["#059669", "#f59e0b", "#e11d48"][index];
    const problems = allProblems.filter((problem) => problem.difficulty === difficulty);
    const done = problems.filter((problem) => (reps[problem.id] ?? 0) > 0).length;
    return { label: difficulty, color, done, total: problems.length };
  });

  const latestPerProblem = new Map<string, MasteryAttempt>();
  for (const attempt of recentAttempts) {
    if (!latestPerProblem.has(attempt.problemId)) {
      latestPerProblem.set(attempt.problemId, attempt);
    }
  }
  const recentDistinct = [...latestPerProblem.values()].slice(0, 5);

  return (
    <section className="grid gap-6">
      <div className="uiverse-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">Progress</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-ink">
              Where you stand, and what to fix next.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-black/60">
              Ranked by pattern, weakest first — so you always know what to practice next instead of
              guessing.
            </p>
            <Link
              href="/today"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lake"
            >
              Continue today&apos;s plan <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing segments={overallRingSegments.filter((segment) => segment.total > 0)} />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Stat label="Day streak" value={String(streak)} />
              <Stat label="Attempts" value={String(totalAttempts)} />
              <Stat label="Recognized cleanly" value={`${accuracy}%`} />
              <Stat label="Reviews due" value={String(reviewDueCount)} />
            </dl>
          </div>
        </div>
      </div>

      <div className="uiverse-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
              Pattern strength
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">Your weakest patterns, ranked.</h3>
          </div>
        </div>

        <ProductList className="mt-5">
          {rankedPatternRows.map((pattern) => {
            const statusCopy = STATUS_COPY[pattern.status];
            return (
              <ProductRow
                key={pattern.id}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {pattern.label}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusCopy.className}`}>
                      {statusCopy.label}
                    </span>
                  </span>
                }
                description={
                  <>
                    <span>
                      {pattern.masteredCount} of {pattern.total} mastered · {pattern.touchedCount} touched
                    </span>
                    <ProgressBar percent={pattern.percentMastered} tone="lake" className="mt-2" />
                    <span className="mt-2 block">{pattern.diagnosis}</span>
                    {pattern.bottleneck ? (
                      <span className="mt-2 block text-xs font-semibold text-coral">
                        Weakest link: {pattern.bottleneck.label} ({pattern.bottleneck.score}%)
                      </span>
                    ) : null}
                    {pattern.supportTrend ? (
                      <span className="mt-2 block text-xs font-medium text-emerald-700">
                        Support needed: {pattern.supportTrend}
                      </span>
                    ) : null}
                    {pattern.skills ? <SkillBreakdown skills={pattern.skills} /> : null}
                  </>
                }
                trailing={
                  <Link
                    href={
                      pattern.recommendedProblemId
                        ? `/practice?problem=${pattern.recommendedProblemId}&mode=recognize&coach=guided`
                        : "/roadmap"
                    }
                    className="row-action"
                  >
                    {pattern.touchedCount === 0 ? "Start →" : "Next drill →"}
                  </Link>
                }
              />
            );
          })}
        </ProductList>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Where you get confused
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">Contrast these before your next solve.</h3>
          <ProductList className="mt-5">
            {masteryModel.confusions.length > 0 ? (
              masteryModel.confusions.slice(0, 3).map((pair) => (
                <ProductRow
                  key={`${pair.predicted}-${pair.actual}`}
                  title={`${pair.predicted} → ${pair.actual}`}
                  description="You picked the first pattern when the second one actually fit."
                  meta={`${pair.count} miss${pair.count === 1 ? "" : "es"}`}
                />
              ))
            ) : (
              <div className="rounded-[8px] border border-dashed border-black/12 bg-white/60 p-5 text-sm leading-6 text-black/58">
                No mix-ups yet. This shows up once a guessed pattern differs from the actual one.
              </div>
            )}
          </ProductList>
        </div>

        <div className="uiverse-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
              Recent activity
            </p>
            <Link href="/roadmap" className="text-sm font-semibold text-lake">
              Full roadmap →
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {recentDistinct.length > 0 ? (
              recentDistinct.map((item) => (
                <Link
                  key={`${item.problemId}-${item.createdAt}`}
                  href={`/practice?problem=${item.problemId}&mode=recognize&coach=guided`}
                  className="block rounded-[8px] border border-black/10 bg-white/86 p-4 transition hover:border-black/20 hover:bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-ink">{item.problemTitle}</h4>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.outcome === "solid"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.outcome === "partial"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {item.outcome === "solid" ? "Strong" : item.outcome === "partial" ? "Mixed" : "Needs review"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-black/58">{item.actualPatternLabel ?? item.selectedPatternLabel}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-[8px] border border-dashed border-black/12 bg-white/60 p-5 text-sm leading-6 text-black/58">
                Nothing logged yet. Solve a problem in the workspace to see it here.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SkillBreakdown({ skills }: { skills: TechniqueSkillVector }) {
  const withEvidence = SKILL_ORDER.filter((dimension) => skills[dimension].evidenceCount > 0);
  if (withEvidence.length === 0) return null;
  return (
    <details className="mt-3 text-xs text-black/58">
      <summary className="cursor-pointer select-none font-semibold text-black/70">
        Full skill breakdown
      </summary>
      <div className="mt-3 space-y-2">
        {withEvidence.map((dimension) => {
          const dim = skills[dimension];
          return (
            <div key={dimension}>
              <div className="flex items-center justify-between">
                <span>{SKILL_LABELS[dimension]}</span>
                <span className="font-semibold text-black/70">{dim.score}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/6">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7bd3ff,#4b86f8)]"
                  style={{ width: `${Math.max(4, dim.score)}%`, opacity: 0.4 + dim.confidence * 0.6 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-black/45">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ProgressBar({
  percent,
  tone,
  className = ""
}: {
  percent: number;
  tone: "coral" | "lake";
  className?: string;
}) {
  return (
    <div className={`h-3 overflow-hidden rounded-full bg-black/6 ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${
          tone === "coral"
            ? "bg-[linear-gradient(90deg,#ff9088,#ff5c5c)]"
            : "bg-[linear-gradient(90deg,#7bd3ff,#4b86f8)]"
        }`}
        style={{ width: `${percent === 0 ? 0 : Math.max(4, percent)}%` }}
      />
    </div>
  );
}
