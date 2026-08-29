"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CurriculumPlan, ExperienceLevel } from "@/lib/curriculum-agent";
import {
  PREPARATION_GOALS,
  WEEKDAY_LABEL,
  WEEKDAY_ORDER,
  defaultWeekdayMinutes,
  type PreparationGoal,
  type WeekdayKey,
  type WeekdayMinutes
} from "@/lib/study-plan";

type Step = "goal" | "experience" | "duration" | "time" | "generating" | "reveal" | "error";

type Message = { id: string; speaker: "coach" | "user"; text: string };

type GenerateResponse = { runId: string; plan: CurriculumPlan };

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "new", label: "Never really started" },
  { value: "rusty", label: "Done some, rusty" },
  { value: "comfortable", label: "Fairly comfortable" }
];

// Duration is asked in days now (7/14/30/custom) rather than weeks - kept
// alongside an exact-date option for anyone who prefers naming their
// actual interview date. Both convert to totalWeeks server-side.
const DURATION_OPTIONS: { days: number; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" }
];

// Each preset's VALUE is the lower bound of its range - stored as the
// guaranteed Core budget for that weekday, per the approved "guaranteed
// budget = lower bound, extra time becomes Bonus" design.
const WEEKDAY_TIME_PRESETS: { value: number; label: string }[] = [
  { value: 0, label: "Off" },
  { value: 60, label: "1–2h" },
  { value: 120, label: "2–3h" },
  { value: 180, label: "3–4h" },
  { value: 240, label: "4–5h" }
];

const STUDY_MODE_LABEL: Record<string, string> = {
  learn: "Learn",
  recognize: "Recognize",
  practice: "Practice",
  review: "Mixed review"
};

export function OnboardingFlow({ hasExistingPlan = false }: { hasExistingPlan?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("goal");
  const [messages, setMessages] = useState<Message[]>([
    ...(hasExistingPlan
      ? [
          {
            id: "q0",
            speaker: "coach" as const,
            text: "You've already got a plan running — let's rebuild it. Same quick questions, and your new plan replaces it once you start Day 1."
          }
        ]
      : []),
    { id: "q1", speaker: "coach", text: "What's your main goal right now?" }
  ]);
  const [goal, setGoal] = useState<PreparationGoal | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [studyDurationDays, setStudyDurationDays] = useState<number | null>(null);
  const [interviewDate, setInterviewDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState("");
  const [showCustomDays, setShowCustomDays] = useState(false);
  const [customDays, setCustomDays] = useState("");
  const [weekdayMinutes, setWeekdayMinutes] = useState<WeekdayMinutes>(() => defaultWeekdayMinutes(60));
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  function pushMessage(message: Message) {
    setMessages((current) => [...current, message]);
  }

  function answerGoal(value: PreparationGoal, label: string) {
    setGoal(value);
    pushMessage({ id: `a-goal-${value}`, speaker: "user", text: label });
    pushMessage({ id: "q1b", speaker: "coach", text: "Have you solved LeetCode-style problems before, even a few?" });
    setStep("experience");
  }

  function answerExperience(value: ExperienceLevel, label: string) {
    setExperienceLevel(value);
    pushMessage({ id: `a-${value}`, speaker: "user", text: label });
    pushMessage({
      id: "q2",
      speaker: "coach",
      text: "Got it. How long are you preparing for?"
    });
    setStep("duration");
  }

  function answerDuration(days: number, label: string) {
    setStudyDurationDays(days);
    setInterviewDate(null);
    setShowCustomDays(false);
    pushMessage({ id: `a-duration-${days}`, speaker: "user", text: label });
    pushMessage({
      id: "q3",
      speaker: "coach",
      text: "Last one — how much time can you study each day? Adjust any day that's different, then continue."
    });
    setStep("time");
  }

  function confirmCustomDays() {
    const parsed = Number(customDays);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    answerDuration(Math.round(parsed), `${Math.round(parsed)} days`);
  }

  function confirmInterviewDate() {
    if (!pickedDate) return;
    const label = new Date(`${pickedDate}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    setInterviewDate(pickedDate);
    setStudyDurationDays(null);
    setShowDatePicker(false);
    pushMessage({ id: `a-deadline-date`, speaker: "user", text: label });
    pushMessage({
      id: "q3",
      speaker: "coach",
      text: "Last one — how much time can you study each day? Adjust any day that's different, then continue."
    });
    setStep("time");
  }

  function setWeekdayValue(day: WeekdayKey, value: number) {
    setWeekdayMinutes((current) => ({ ...current, [day]: value }));
  }

  async function confirmWeekdayTime() {
    const totalWeeklyMinutes = WEEKDAY_ORDER.reduce((sum, day) => sum + weekdayMinutes[day], 0);
    const summaryLabel = `About ${Math.round(totalWeeklyMinutes / 60)}h / week`;
    pushMessage({ id: "a-time", speaker: "user", text: summaryLabel });
    setStep("generating");
    setError(null);

    try {
      const response = await fetch("/api/curriculum-agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceLevel,
          goal,
          studyDurationDays,
          interviewDate,
          dailyMinutes: Math.round(totalWeeklyMinutes / 7),
          weekdayMinutes
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
    const weekNumbers = Array.from(new Set(result.plan.days.map((day) => day.weekNumber))).sort(
      (left, right) => left - right
    );
    const weekSummaries = weekNumbers.map((weekNumber) => {
      const days = result.plan.days.filter((day) => day.weekNumber === weekNumber);
      const patterns = Array.from(new Set(days.map((day) => day.patternLabel).filter((label) => label !== "Mixed review")));
      const modeCounts = days.reduce<Record<string, number>>((counts, day) => {
        counts[day.studyMode] = (counts[day.studyMode] ?? 0) + 1;
        return counts;
      }, {});
      return { weekNumber, patterns, modeCounts };
    });
    const patternsCovered = Array.from(
      new Set(result.plan.days.map((day) => day.patternLabel).filter((label) => label !== "Mixed review"))
    );
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
          <div className="mb-1 text-sm font-bold text-slate-900">Full plan, week by week</div>
          <p className="mb-4 text-xs text-slate-500">
            {patternsCovered.length} patterns covered across {result.plan.totalWeeks} weeks.
          </p>
          <div className="flex flex-col divide-y divide-slate-100">
            {weekSummaries.map((week) => (
              <div key={week.weekNumber} className="flex items-start gap-3 py-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-500">
                  {week.weekNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{week.patterns.join(", ")}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {(["learn", "recognize", "practice", "review"] as const)
                      .filter((mode) => week.modeCounts[mode])
                      .map((mode) => `${week.modeCounts[mode]} ${STUDY_MODE_LABEL[mode]}`)
                      .join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white p-6">
          <div className="mb-3 text-sm font-bold text-slate-900">Patterns this plan covers</div>
          <div className="flex flex-wrap gap-1.5">
            {patternsCovered.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10l4 4 8-9" />
                </svg>
                {label}
              </span>
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

        {step === "goal" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {PREPARATION_GOALS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => answerGoal(option.value, option.label)}
                className="uiverse-chip px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

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

        {step === "duration" ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => answerDuration(option.days, option.label)}
                  className="uiverse-chip px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowCustomDays((current) => !current);
                  setShowDatePicker(false);
                }}
                className={`uiverse-chip px-4 py-2.5 text-sm font-semibold ${showCustomDays ? "uiverse-chip-active" : "text-slate-700"}`}
              >
                Custom
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDatePicker((current) => !current);
                  setShowCustomDays(false);
                }}
                className={`uiverse-chip px-4 py-2.5 text-sm font-semibold ${showDatePicker ? "uiverse-chip-active" : "text-slate-700"}`}
              >
                Pick an exact date
              </button>
            </div>

            {showCustomDays ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={customDays}
                  onChange={(event) => setCustomDays(event.target.value)}
                  placeholder="Days"
                  className="uiverse-field w-28 px-3.5 py-2.5 text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={confirmCustomDays}
                  disabled={!customDays}
                  className="uiverse-button px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirm
                </button>
              </div>
            ) : null}

            {showDatePicker ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={pickedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setPickedDate(event.target.value)}
                  className="uiverse-field px-3.5 py-2.5 text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={confirmInterviewDate}
                  disabled={!pickedDate}
                  className="uiverse-button px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirm date
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {step === "time" ? (
          <div className="mt-4">
            <div className="grid gap-2">
              {WEEKDAY_ORDER.map((day) => (
                <div key={day} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                  <span className="w-20 text-sm font-semibold text-slate-700">{WEEKDAY_LABEL[day]}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAY_TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setWeekdayValue(day, preset.value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          weekdayMinutes[day] === preset.value
                            ? "bg-ink text-white"
                            : "border border-black/10 bg-mist text-black/60 hover:border-black/24"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void confirmWeekdayTime()}
              className="uiverse-button mt-4 px-4 py-2.5 text-sm font-semibold"
            >
              Continue →
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Answer in English or Chinese — the coach follows you either way.
      </p>
    </div>
  );
}
