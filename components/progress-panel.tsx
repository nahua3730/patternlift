"use client";

import { useMemo, useState } from "react";
import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions,
  roadmapTrackTotals
} from "@/lib/product";

type HistoryItem = {
  id: string;
  problemId: string;
  problemTitle: string;
  selectedPatternLabel: string;
  outcome: "solid" | "partial" | "confused";
  insight: string;
};

type ProgressPanelProps = {
  totalAttempts: number;
  solidAttempts: number;
  reviewCount: number;
  currentStreak: number;
  history: HistoryItem[];
};

type LaneFilter = "all" | "active" | "needs-review" | "mastered";
type LaneStatus = "fresh" | "active" | "needs-review" | "mastered";
type RoadmapLane = {
  id: string;
  label: string;
  coachPrompt: string;
  completed: number;
  total: number;
  solid: number;
  needsReview: number;
  percent: number;
  strengthPercent: number;
  status: LaneStatus;
};

export function ProgressPanel({
  totalAttempts,
  solidAttempts,
  reviewCount,
  currentStreak,
  history
}: ProgressPanelProps) {
  const [laneFilter, setLaneFilter] = useState<LaneFilter>("all");

  const accuracy =
    totalAttempts === 0 ? 0 : Math.round((solidAttempts / totalAttempts) * 100);

  const latestByProblem = useMemo(() => {
    const map = new Map<string, HistoryItem>();
    history.forEach((item) => {
      if (!map.has(item.problemId)) {
        map.set(item.problemId, item);
      }
    });
    return map;
  }, [history]);

  const attemptedProblemIds = useMemo(
    () => new Set(history.map((item) => item.problemId)),
    [history]
  );

  const officialTrackProgress = useMemo(() => {
    const attemptedBlind75 = new Set<string>();
    const attemptedNeetCode150 = new Set<string>();

    attemptedProblemIds.forEach((problemId) => {
      const meta = getOfficialProblemRoadmapMeta(problemId);
      if (!meta) return;
      if (meta.tracks.includes("blind75")) attemptedBlind75.add(problemId);
      if (meta.tracks.includes("neetcode150")) attemptedNeetCode150.add(problemId);
    });

    return [
      {
        id: "blind75",
        label: "Blind 75",
        completed: attemptedBlind75.size,
        total: roadmapTrackTotals.blind75
      },
      {
        id: "neetcode150",
        label: "NeetCode 150",
        completed: attemptedNeetCode150.size,
        total: roadmapTrackTotals.neetcode150
      }
    ];
  }, [attemptedProblemIds]);

  const roadmapLanes = useMemo(() => {
    return patternOptions
      .flatMap<RoadmapLane>((pattern) => {
        const problems = allProblems.filter((problem) => problem.targetPatternId === pattern.id);
        if (problems.length === 0) return [];

        const attempted = problems.filter((problem) => attemptedProblemIds.has(problem.id));
        const solid = attempted.filter(
          (problem) => latestByProblem.get(problem.id)?.outcome === "solid"
        );
        const needsReview = attempted.filter(
          (problem) => latestByProblem.get(problem.id)?.outcome !== "solid"
        );

        const completed = attempted.length;
        const total = problems.length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        const strengthPercent =
          completed === 0 ? 0 : Math.round((solid.length / completed) * 100);

        const status: LaneStatus =
          completed === 0
            ? "fresh"
            : completed === total && needsReview.length === 0
              ? "mastered"
              : needsReview.length > 0
                ? "needs-review"
                : "active";

        return [{
          id: pattern.id,
          label: pattern.label,
          coachPrompt: pattern.coachPrompt,
          completed,
          total,
          solid: solid.length,
          needsReview: needsReview.length,
          percent,
          strengthPercent,
          status
        }];
      });
  }, [attemptedProblemIds, latestByProblem]);

  const filteredLanes = roadmapLanes.filter((lane) => {
    if (laneFilter === "all") return true;
    return lane.status === laneFilter;
  });

  const nextFocusLane =
    roadmapLanes
      .filter((lane) => lane.needsReview > 0)
      .sort((left, right) => right.needsReview - left.needsReview)[0] ??
    roadmapLanes.find((lane) => lane.completed === 0) ??
    roadmapLanes[0];

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Progress snapshot
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink">
            Your roadmap should show momentum, not just leftovers.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/68">
            This board tracks where you have already touched the roadmap, how solid
            those reps look, and which pattern lane deserves your next clean pass.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Attempts logged" value={String(totalAttempts)} />
            <StatCard label="Strong reps" value={String(solidAttempts)} />
            <StatCard label="Review cards" value={String(reviewCount)} />
            <StatCard label="Current streak" value={`${currentStreak} days`} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <RoadmapMetric
              label="Pattern accuracy"
              value={`${accuracy}%`}
              body="A quick read on how often your latest attempt ended in a strong pattern match."
              percent={accuracy}
              tone="coral"
            />
            <RoadmapMetric
              label="Next focus lane"
              value={nextFocusLane?.label ?? "Pick a fresh lane"}
              body={
                nextFocusLane
                  ? nextFocusLane.needsReview > 0
                    ? `${nextFocusLane.needsReview} recent reps still feel shaky here.`
                    : "You can start this lane from a clean slate next."
                  : "You have room to start anywhere."
              }
              percent={nextFocusLane?.percent ?? 0}
              tone="lake"
            />
          </div>
        </div>

        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
            Official roadmap coverage
          </p>
          <div className="mt-4 space-y-4">
            {officialTrackProgress.map((track) => {
              const percent =
                track.total === 0 ? 0 : Math.round((track.completed / track.total) * 100);

              return (
                <article
                  key={track.id}
                  className="rounded-[8px] border border-black/10 bg-white/86 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-ink">{track.label}</h3>
                      <p className="mt-1 text-sm text-black/62">
                        {track.completed} of {track.total} problems touched
                      </p>
                    </div>
                    <span className="text-2xl font-semibold text-ink">{percent}%</span>
                  </div>
                  <ProgressBar percent={percent} tone="coral" className="mt-4" />
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="uiverse-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
                Pattern roadmap
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">
                Follow the lanes that are opening up.
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All lanes" },
                { id: "active", label: "Active" },
                { id: "needs-review", label: "Needs review" },
                { id: "mastered", label: "Mastered" }
              ].map((filter) => {
                const active = laneFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setLaneFilter(filter.id as LaneFilter)}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-ink text-white"
                        : "border border-black/10 bg-white text-black/68"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredLanes.map((lane) => (
              <article
                key={lane.id}
                className="rounded-[8px] border border-black/10 bg-white/88 p-4 shadow-[0_8px_18px_rgba(17,17,17,0.04)] transition hover:-translate-y-[1px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-ink">{lane.label}</h4>
                    <p className="mt-2 text-sm leading-6 text-black/62">
                      {lane.coachPrompt}
                    </p>
                  </div>
                  <LaneStatus status={lane.status} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-black/72">
                      {lane.completed} of {lane.total} roadmap problems
                    </span>
                    <span className="text-black/52">{lane.percent}%</span>
                  </div>
                  <ProgressBar percent={lane.percent} tone="coral" className="mt-2" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniMetric label="Strong reps" value={String(lane.solid)} />
                  <MiniMetric label="Needs review" value={String(lane.needsReview)} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-black/72">Confidence in attempted reps</span>
                    <span className="text-black/52">{lane.strengthPercent}%</span>
                  </div>
                  <ProgressBar percent={lane.strengthPercent} tone="lake" className="mt-2" />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
            Recent reps
          </p>
          <div className="mt-4 space-y-3">
            {history.map((item) => {
              const meta = getOfficialProblemRoadmapMeta(item.problemId);
              return (
                <article
                  key={item.id}
                  className="rounded-[8px] border border-black/10 bg-white/86 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-ink">{item.problemTitle}</h4>
                      <p className="mt-1 text-sm text-black/62">
                        {meta?.leetcodeNumber
                          ? `LeetCode #${meta.leetcodeNumber}`
                          : item.selectedPatternLabel}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.outcome === "solid"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.outcome === "partial"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {item.outcome === "solid"
                        ? "Strong"
                        : item.outcome === "partial"
                          ? "Mixed"
                          : "Needs review"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-black/74">
                    Pattern guessed: {item.selectedPatternLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/62">{item.insight}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-black/10 bg-white/88 p-4">
      <p className="text-sm text-black/58">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function RoadmapMetric({
  label,
  value,
  body,
  percent,
  tone
}: {
  label: string;
  value: string;
  body: string;
  percent: number;
  tone: "coral" | "lake";
}) {
  return (
    <div className="rounded-[8px] border border-black/10 bg-white/88 p-4">
      <p className="text-sm font-semibold text-black/62">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-black/62">{body}</p>
      <ProgressBar percent={percent} tone={tone} className="mt-4" />
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-black/10 bg-[#faf8f4] p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-black/44">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function LaneStatus({
  status
}: {
  status: LaneStatus;
}) {
  const copy = {
    fresh: {
      label: "Fresh",
      className: "bg-stone-100 text-stone-700"
    },
    active: {
      label: "Active",
      className: "bg-sky-100 text-sky-700"
    },
    "needs-review": {
      label: "Needs review",
      className: "bg-rose-100 text-rose-700"
    },
    mastered: {
      label: "Mastered",
      className: "bg-emerald-100 text-emerald-700"
    }
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${copy.className}`}>
      {copy.label}
    </span>
  );
}
