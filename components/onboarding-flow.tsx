"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CurriculumPlan, ExperienceLevel } from "@/lib/curriculum-agent";

type Step = "experience" | "deadline" | "time" | "generating" | "reveal" | "error";

type Message = { id: string; speaker: "coach" | "user"; text: string };

type GenerateResponse = { runId: string; plan: CurriculumPlan };

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "new", label: "Never really started" },
  { value: "rusty", label: "Done some, rusty" },
  { value: "comfortable", label: "Fairly comfortable" }
];

const DEADLINE_OPTIONS: { value: number | null; label: string }[] = [
  { value: 2, label: "~2 weeks" },
  { value: 4, label: "~1 month" },
  { value: 8, label: "~2 months" },
  { value: null, label: "No deadline yet" }
];

const TIME_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: "~30 min" },
  { value: 50, label: "~45–60 min" },
  { value: 120, label: "2h+" }
];

const STUDY_MODE_LABEL: Record<string, string> = {
  learn: "Learn",
  recognize: "Recognize",
  practice: "Practice",
  review: "Mixed review"
};

export function OnboardingFlow({ hasExistingPlan = false }: { hasExistingPlan?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("experience");
  const [messages, setMessages] = useState<Message[]>([
    ...(hasExistingPlan
      ? [
          {
            id: "q0",
            speaker: "coach" as const,
            text: "You've already got a plan running — let's rebuild it. Same three quick questions, and your new plan replaces it once you start Day 1."
          }
        ]
      : []),
    { id: "q1", speaker: "coach", text: "Have you solved LeetCode-style problems before, even a few?" }
  ]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [deadlineWeeks, setDeadlineWeeks] = useState<number | null | undefined>(undefined);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  function pushMessage(message: Message) {
    setMessages((current) => [...current, message]);
  }

  function answerExperience(value: ExperienceLevel, label: string) {
    setExperienceLevel(value);
    pushMessage({ id: `a-${value}`, speaker: "user", text: label });
    pushMessage({
      id: "q2",
      speaker: "coach",
      text: "Got it. Do you have an interview coming up, or is this open-ended?"
    });
    setStep("deadline");
  }

  function answerDeadline(value: number | null, label: string) {
    setDeadlineWeeks(value);
    pushMessage({ id: `a-deadline-${label}`, speaker: "user", text: label });
    pushMessage({
      id: "q3",
      speaker: "coach",
      text: "Last one — how long can you realistically study each day?"
    });
    setStep("time");
  }

  async function answerTime(value: number, label: string) {
    pushMessage({ id: `a-time-${label}`, speaker: "user", text: label });
    setStep("generating");
    setError(null);

    try {
      const response = await fetch("/api/curriculum-agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceLevel,
          deadlineWeeks: deadlineWeeks ?? null,
          dailyMinutes: value
        })
      });

      if (!response.ok) throw new Error("Unable to build your plan right now.");
      const payload = (await response.json()) as GenerateResponse;
      setResult(payload);
      setStep("reveal");
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Something went wrong.");
      setStep("error");
    }
  }

  async function startPlan() {
    if (!result) return;
    setLaunching(true);
    try {
      const response = await fetch("/api/curriculum-agent/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: result.runId })
      });
      if (!response.ok) throw new Error("Unable to start your plan right now.");
      const payload = (await response.json()) as { href: string };
      router.push(payload.href);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Something went wrong.");
      setLaunching(false);
    }
  }

  if (step === "reveal" && result) {
    const week1 = result.plan.days.filter((day) => day.weekNumber === 1);
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <section
          className="rounded-[22px] border px-8 py-9 text-white shadow-[0_26px_60px_rgba(15,23,42,0.14)]"
          style={{
            borderColor: "rgba(99,102,241,.18)",
            background:
              "radial-gradient(circle at 10% 15%, rgba(99,102,241,.28), transparent 28rem), linear-gradient(140deg, #0b1020, #111a31 65%, #0c1728)"
          }}
        >
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-indigo-300">
            <span className="h-[7px] w-[7px] rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.8)]" />
            Plan ready
          </div>
          <h1 className="mt-3.5 text-[26px] font-bold leading-tight tracking-tight">{result.plan.headline}</h1>
          <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-300">{result.plan.rationale}</p>

          <div className="mt-6 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="text-xl font-bold">{result.plan.totalWeeks}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-400">weeks</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="text-xl font-bold">{result.plan.days.length}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-400">days planned</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="text-xl font-bold">{result.plan.dailyMinutes}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-400">min / day</div>
            </div>
          </div>

          <button
            type="button"
            onClick={startPlan}
            disabled={launching}
            className="mt-6 inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 shadow-[0_14px_34px_rgba(34,211,238,.16)] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#a5b4fc,#67e8f9)" }}
          >
            {launching ? "Starting…" : "Start Day 1"}
            <span aria-hidden="true">→</span>
          </button>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white p-6">
          <div className="mb-3 text-sm font-bold text-slate-900">Week 1</div>
          <div className="flex flex-col divide-y divide-slate-100">
            {week1.map((day) => (
              <div key={day.dayNumber} className="flex items-center gap-3 py-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-500">
                  {day.dayNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-slate-900">{day.patternLabel}</span>
                  <span className="ml-2 text-xs font-semibold text-indigo-500">{STUDY_MODE_LABEL[day.studyMode]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`coach-message chat-bubble-in ${message.speaker === "coach" ? "coach-message-ai" : "coach-message-user"}`}
            >
              {message.text}
            </div>
          ))}

          {step === "generating" ? (
            <div className="coach-message coach-message-ai flex items-center gap-2">
              <span className="coach-thinking">
                <i />
                <i />
                <i />
              </span>
              Building your plan…
            </div>
          ) : null}

          {step === "error" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error ?? "Something went wrong."}{" "}
              <button type="button" className="ml-1 font-semibold underline" onClick={() => setStep("time")}>
                Try again
              </button>
            </div>
          ) : null}
        </div>

        {step === "experience" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => answerExperience(option.value, option.label)}
                className="uiverse-chip px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === "deadline" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {DEADLINE_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => answerDeadline(option.value, option.label)}
                className="uiverse-chip px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === "time" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => answerTime(option.value, option.label)}
                className="uiverse-chip px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Answer in English or Chinese — the coach follows you either way.
      </p>
    </div>
  );
}
