"use client";

import { useEffect, useMemo, useState } from "react";

type ReviewItem = {
  id: string;
  problemTitle: string;
  targetPatternLabel: string;
  contrastPatternLabel: string;
  reviewQuestion: string;
  urgency: "high" | "medium";
};

type HistoryItem = {
  id: string;
  problemId: string;
  problemTitle: string;
  selectedPatternLabel: string;
  outcome: "solid" | "partial" | "confused";
  insight: string;
};

type ReviewQueueProps = {
  items: ReviewItem[];
  history: HistoryItem[];
};

type TimelineSlot = {
  label: string;
  dayOffset: number;
  reviewCount: number;
  focus: string;
};

type PlanDay = {
  day: number;
  label: string;
  focus: string;
  reviews: number;
  freshProblems: number;
  retrievalPrompt: string;
};

const reminderOptions = [
  { id: "30", label: "30 min", minutes: 30 },
  { id: "60", label: "1 hour", minutes: 60 },
  { id: "180", label: "3 hours", minutes: 180 }
] as const;

export function ReviewQueue({ items, history }: ReviewQueueProps) {
  const [goal, setGoal] = useState("Be interview-ready and stop forgetting patterns.");
  const [daysAvailable, setDaysAvailable] = useState(14);
  const [reminderChoice, setReminderChoice] = useState<(typeof reminderOptions)[number]["id"]>(
    "60"
  );
  const [notificationState, setNotificationState] = useState<
    "unsupported" | "default" | "granted" | "denied"
  >("unsupported");
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationState("unsupported");
      return;
    }
    setNotificationState(Notification.permission);
  }, []);

  const weakPatternOrder = useMemo(() => {
    const scoreMap = new Map<string, number>();

    items.forEach((item) => {
      scoreMap.set(
        item.targetPatternLabel,
        (scoreMap.get(item.targetPatternLabel) ?? 0) + (item.urgency === "high" ? 3 : 2)
      );
    });

    history.forEach((item) => {
      const delta = item.outcome === "confused" ? 3 : item.outcome === "partial" ? 2 : 0;
      scoreMap.set(item.selectedPatternLabel, (scoreMap.get(item.selectedPatternLabel) ?? 0) + delta);
    });

    return [...scoreMap.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([pattern]) => pattern);
  }, [history, items]);

  const primaryFocus = weakPatternOrder[0] ?? items[0]?.targetPatternLabel ?? "Pattern review";
  const secondaryFocus = weakPatternOrder[1] ?? items[1]?.targetPatternLabel ?? "Contrast practice";

  const timelineSlots = useMemo<TimelineSlot[]>(() => {
    const scientificOffsets = [0, 1, 3, 7, 14, 21];
    const boundedOffsets = scientificOffsets.filter(
      (offset, index) => offset <= daysAvailable || index < 3
    );

    return boundedOffsets.map((offset, index) => {
      const label =
        offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : `Day ${offset + 1}`;
      const focus =
        index === 0
          ? primaryFocus
          : index % 2 === 1
            ? secondaryFocus
            : primaryFocus;

      const reviewCount = Math.max(
        1,
        Math.min(items.length || 1, index === 0 ? items.length : Math.ceil((items.length || 1) / 2))
      );

      return {
        label,
        dayOffset: offset,
        reviewCount,
        focus
      };
    });
  }, [daysAvailable, items.length, primaryFocus, secondaryFocus]);

  const planDays = useMemo<PlanDay[]>(() => {
    const totalDays = Math.max(1, Math.min(30, daysAvailable));
    const freshProblemBudget = Math.max(1, Math.ceil(history.length / 6));

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const isEarly = day <= Math.max(3, Math.ceil(totalDays * 0.3));
      const isMiddle = !isEarly && day < totalDays;
      const focus = isEarly ? primaryFocus : isMiddle ? secondaryFocus : "Mixed mock-style review";

      return {
        day,
        label: day === 1 ? "Start strong" : day === totalDays ? "Taper and recall" : `Day ${day}`,
        focus,
        reviews: Math.max(2, Math.min(6, items.length + (isEarly ? 1 : 0))),
        freshProblems: isMiddle ? freshProblemBudget : Math.max(1, freshProblemBudget - 1),
        retrievalPrompt:
          day === totalDays
            ? "Explain the core clue for each weak pattern out loud without looking."
            : `Before coding, name why ${focus} fits and what lookalike pattern you must avoid.`
      };
    });
  }, [daysAvailable, history.length, items.length, primaryFocus, secondaryFocus]);

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setReminderMessage("This browser does not support notifications here.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationState(permission);
    if (permission === "granted") {
      setReminderMessage("Browser popups are on. You can schedule review nudges below.");
    } else {
      setReminderMessage("Notifications are blocked right now, so reminders will stay in-app.");
    }
  }

  function scheduleReminder() {
    const option = reminderOptions.find((entry) => entry.id === reminderChoice) ?? reminderOptions[1];
    const message = `Time to revisit ${primaryFocus}. Start with your top review card and explain the clue before you code.`;

    if (notificationState === "granted" && typeof window !== "undefined") {
      window.setTimeout(() => {
        new Notification("PatternLift review reminder", {
          body: message
        });
      }, option.minutes * 60 * 1000);
      setReminderMessage(`Okay, I’ll pop up a reminder in ${option.label.toLowerCase()} while this tab stays open.`);
      return;
    }

    setReminderMessage(
      `Notifications are not on yet, so use this review window manually in ${option.label.toLowerCase()}.`
    );
  }

  return (
    <section className="grid gap-6">
      <div className="uiverse-panel p-6">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
              Review plan
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-ink">
              Turn weak spots into a memory timeline that actually sticks.
            </h2>
            <p className="mt-3 text-sm leading-7 text-black/66">
              We’re using a spaced-repetition shape: same-day recall, then short revisit gaps,
              then wider intervals as the pattern starts to hold.
            </p>
          </div>

          <div className="rounded-[8px] border border-black/10 bg-white/88 p-4">
            <label className="block text-sm font-medium text-black/68">
              Goal
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={3}
                className="uiverse-field mt-2 w-full resize-none px-3 py-3 text-sm leading-6 text-ink"
                placeholder="Tell PatternLift what you are aiming for."
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <label className="block text-sm font-medium text-black/68">
                Days you have
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={daysAvailable}
                  onChange={(event) =>
                    setDaysAvailable(
                      Math.max(1, Math.min(30, Number(event.target.value) || 1))
                    )
                  }
                  className="uiverse-field mt-2 w-full px-3 py-3 text-sm text-ink"
                />
              </label>

              <div className="rounded-[8px] border border-black/10 bg-[#faf8f4] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/44">
                  Most efficient next focus
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">{primaryFocus}</p>
                <p className="mt-2 text-sm leading-6 text-black/60">
                  Based on your recent misses and high-urgency review cards, this is the best lane to reinforce first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="uiverse-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
              Memory timeline
            </p>
            <span className="text-sm text-black/54">{timelineSlots.length} spaced checkpoints</span>
          </div>

          <div className="mt-5 space-y-4">
            {timelineSlots.map((slot, index) => (
              <article key={`${slot.label}-${slot.dayOffset}`} className="flex gap-4">
                <div className="flex w-16 flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-sm font-semibold text-white shadow-[0_10px_18px_rgba(255,92,92,0.18)]">
                    {index + 1}
                  </div>
                  {index < timelineSlots.length - 1 ? (
                    <div className="mt-2 h-full min-h-12 w-px bg-black/10" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 rounded-[8px] border border-black/10 bg-white/88 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-ink">{slot.label}</h3>
                    <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/60">
                      {slot.reviewCount} reviews
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-black/62">
                    Focus on <span className="font-medium text-ink">{slot.focus}</span> and recall the clue before you touch code.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="uiverse-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
              Reminders
            </p>
            <span className="text-sm text-black/54">
              {notificationState === "granted"
                ? "Browser popups ready"
                : notificationState === "denied"
                  ? "Notifications blocked"
                  : notificationState === "unsupported"
                    ? "Browser unsupported"
                    : "Permission not set"}
            </span>
          </div>

          <p className="mt-3 text-sm leading-7 text-black/66">
            We can send browser popups as review nudges. They work best when this tab stays open.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void enableNotifications()}
              className="uiverse-button px-4 py-2 text-sm font-medium"
            >
              Enable popups
            </button>

            <div className="flex flex-wrap gap-2">
              {reminderOptions.map((option) => {
                const active = reminderChoice === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setReminderChoice(option.id)}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-ink text-white"
                        : "border border-black/10 bg-white text-black/68"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={scheduleReminder}
              className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
            >
              Schedule next reminder
            </button>
          </div>

          {reminderMessage ? (
            <div className="mt-4 rounded-[8px] border border-black/10 bg-[#faf8f4] px-4 py-3 text-sm leading-6 text-black/62">
              {reminderMessage}
            </div>
          ) : null}
        </div>
      </div>

      <div className="uiverse-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
              Most efficient plan
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">
              A customized plan for the next {daysAvailable} day{daysAvailable === 1 ? "" : "s"}.
            </h3>
            <p className="mt-2 text-sm leading-7 text-black/66">{goal}</p>
          </div>
          <div className="rounded-[8px] border border-black/10 bg-white/88 px-4 py-3 text-sm text-black/62">
            Start with <span className="font-semibold text-ink">{primaryFocus}</span>, then rotate into{" "}
            <span className="font-semibold text-ink">{secondaryFocus}</span>.
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {planDays.map((plan) => (
            <article key={plan.day} className="rounded-[8px] border border-black/10 bg-white/88 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/44">
                    {plan.label}
                  </p>
                  <h4 className="mt-2 text-base font-semibold text-ink">{plan.focus}</h4>
                </div>
                <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/60">
                  Day {plan.day}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <PlanMetric label="Reviews" value={String(plan.reviews)} />
                <PlanMetric label="Fresh problems" value={String(plan.freshProblems)} />
              </div>

              <p className="mt-4 text-sm leading-6 text-black/62">{plan.retrievalPrompt}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="uiverse-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
          Current review cards
        </p>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-[8px] border border-black/10 bg-white/88 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{item.problemTitle}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.urgency === "high" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {item.urgency} priority
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-black/74">
                Review {item.targetPatternLabel} against {item.contrastPatternLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-black/62">{item.reviewQuestion}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-black/10 bg-[#faf8f4] p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-black/44">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
