"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductList, ProductRow, StatusBadge } from "@/components/product-system";
import { tierForReps } from "@/lib/mastery-tiers";

type TodayResponse = {
  plan: {
    headline: string;
    rationale: string;
    totalWeeks: number;
    dailyMinutes: number;
    totalDays: number;
    coachStyle: "beginner" | "guided" | "optional";
  };
  today: {
    dayNumber: number;
    weekNumber: number;
    patternLabel: string;
    studyMode: "learn" | "recognize" | "practice" | "review";
    problems: { id: string; title: string; difficulty: string; reps: number }[];
  };
  dueReviews: {
    id: string;
    problemId?: string;
    problemTitle: string;
    patternLabel: string;
    reviewQuestion: string;
    urgency: string;
  }[];
  streak: number;
  checkins: string[];
};

const STUDY_MODE_LABEL: Record<TodayResponse["today"]["studyMode"], string> = {
  learn: "Learn",
  recognize: "Recognize",
  practice: "Practice",
  review: "Mixed review"
};

function hrefFor(problemId: string, coachStyle: string) {
  return `/practice?mode=practice&coach=${coachStyle}&problem=${problemId}`;
}

function lastFourteenDays() {
  const days: string[] = [];
  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

export function TodayDashboard() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/today")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load today's plan.");
        return (await response.json()) as TodayResponse;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-sm text-slate-400">
        Loading today&apos;s plan…
      </div>
    );
  }

  const days = lastFourteenDays();
  const checkinSet = new Set(data.checkins);
  const isReviewDay = data.today.studyMode === "review";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section
        className="relative overflow-hidden rounded-[22px] border px-8 py-9 shadow-[0_26px_60px_rgba(15,23,42,0.14)]"
        style={{
          borderColor: "rgba(99,102,241,.18)",
          background:
            "radial-gradient(circle at 10% 15%, rgba(99,102,241,.28), transparent 28rem), linear-gradient(140deg, #0b1020, #111a31 65%, #0c1728)"
        }}
      >
        <Link
          href="/onboarding"
          className="absolute right-6 top-6 text-xs font-semibold text-slate-400 transition hover:text-white"
        >
          Rebuild plan
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-indigo-300">
              <span className="h-[7px] w-[7px] rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.8)]" />
              Day {data.today.dayNumber} of {data.plan.totalDays} · Week {data.today.weekNumber}
            </div>
            <h1 className="mt-3.5 text-[28px] font-bold leading-tight tracking-tight text-white">
              {isReviewDay ? "Today is a mixed review day." : `${data.today.patternLabel} is today's focus.`}
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-slate-300">
              {isReviewDay
                ? `Light recall only, no new material — about ${data.plan.dailyMinutes} minutes.`
                : `${STUDY_MODE_LABEL[data.today.studyMode]} mode, about ${data.plan.dailyMinutes} minutes.`}
              {data.dueReviews.length > 0 ? ` Plus ${data.dueReviews.length} review${data.dueReviews.length === 1 ? "" : "s"} due.` : ""}
            </p>
            {data.today.problems[0] ? (
              <Link
                href={hrefFor(data.today.problems[0].id, data.plan.coachStyle)}
                className="mt-5 inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 shadow-[0_14px_34px_rgba(34,211,238,.16)]"
                style={{ background: "linear-gradient(135deg,#a5b4fc,#67e8f9)" }}
              >
                Start today&apos;s session
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-sm font-bold text-slate-900">Today&apos;s items</div>
            <div className="text-xs font-semibold text-slate-400">
              {data.today.problems.length + data.dueReviews.length} items
            </div>
          </div>

          {data.today.problems.length === 0 && data.dueReviews.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Nothing scheduled today — a good day to browse the{" "}
              <Link href="/roadmap" className="font-semibold text-indigo-600">
                Roadmap
              </Link>{" "}
              instead.
            </div>
          ) : (
            <ProductList>
              {data.today.problems.map((problem) => (
                <Link key={problem.id} href={hrefFor(problem.id, data.plan.coachStyle)} className="product-row-link">
                  <ProductRow
                    leading={
                      <span className="problem-row-index" style={{ background: "#eef2ff", borderColor: "#c7d2fe", color: "#4f46e5" }}>
                        NEW
                      </span>
                    }
                    title={
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={`tier-dot tier-dot-${tierForReps(problem.reps)}`} title={`${problem.reps} rep${problem.reps === 1 ? "" : "s"}`} />
                        <span>{problem.title}</span>
                        <StatusBadge tone="info">{data.today.patternLabel}</StatusBadge>
                        <StatusBadge
                          tone={problem.difficulty === "Hard" ? "attention" : problem.difficulty === "Easy" ? "success" : "neutral"}
                        >
                          {problem.difficulty}
                        </StatusBadge>
                      </span>
                    }
                    trailing={
                      <span className="product-row-arrow" aria-hidden="true">
                        →
                      </span>
                    }
                  />
                </Link>
              ))}
              {data.dueReviews.map((review) => {
                const row = (
                  <div className="product-row">
                    <div className="product-row-leading">
                      <span className="problem-row-index" style={{ background: "#f0f9ff", borderColor: "#bae6fd", color: "#0284c7" }}>
                        ⟳
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                        <span>{review.problemTitle}</span>
                        <StatusBadge tone="info">{review.patternLabel}</StatusBadge>
                        <StatusBadge tone="neutral">Review · due</StatusBadge>
                      </div>
                      <div className="mt-1 line-clamp-1 text-sm text-slate-500">{review.reviewQuestion}</div>
                    </div>
                  </div>
                );
                return review.problemId ? (
                  <Link
                    key={review.id}
                    href={`/practice?mode=recognize&coach=guided&problem=${review.problemId}`}
                    className="product-row-link"
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={review.id}>{row}</div>
                );
              })}
            </ProductList>
          )}
        </div>

        <div
          className="rounded-[18px] border p-[22px]"
          style={{ borderColor: "rgba(99,102,241,.16)", background: "radial-gradient(circle at 100% 0, rgba(34,211,238,.1), transparent 16rem), #0d1426" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300">Streak</div>
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-cyan-300">
              {data.streak} day{data.streak === 1 ? "" : "s"}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-[5px]">
            {days.map((day) => (
              <div
                key={day}
                className="aspect-square rounded-[4px]"
                style={{ background: checkinSet.has(day) ? "#67e8f9" : "rgba(255,255,255,.06)" }}
              />
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4 text-xs leading-6 text-slate-300">
            {data.plan.rationale}
          </div>
        </div>
      </div>
    </div>
  );
}
