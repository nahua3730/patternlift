"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CoachStyle = "beginner" | "guided" | "optional" | "off";
type SetupMode = "recognize" | "practice";

const coachStyles: Array<{
  id: CoachStyle;
  title: string;
  body: string;
}> = [
  {
    id: "beginner",
    title: "Beginner Guided",
    body:
      "More teaching, more structure, and clearer nudges when your reasoning or code starts drifting."
  },
  {
    id: "guided",
    title: "Guided",
    body:
      "A balanced coach that helps you think, compares approaches, and keeps the problem in your hands."
  },
  {
    id: "optional",
    title: "Hints On Demand",
    body:
      "Mostly independent practice, with help ready whenever you want a push or a second opinion."
  },
  {
    id: "off",
    title: "Coach Off",
    body:
      "A quieter workspace for when you want to solve first and only reflect later."
  }
];

const modeContent: Record<
  SetupMode,
  {
    title: string;
    step: string;
    body: string;
    nextLabel: string;
    defaultCoach: CoachStyle;
    supportTitle: string;
    supportBody: string;
  }
> = {
  recognize: {
    title: "Decide how the coach should help you read the problem.",
    step: "Pattern Recognition",
    body:
      "The next page is where you’ll choose a problem first, then open a cleaner recognition workspace.",
    nextLabel: "Continue",
    defaultCoach: "guided",
    supportTitle: "Best for",
    supportBody:
      "Users who want help identifying the right pattern before they sink time into the wrong implementation."
  },
  practice: {
    title: "Set the coaching level before you start solving.",
    step: "Pure Practice",
    body:
      "Choose how close the coach should stay, then pick the question before you open the workspace.",
    nextLabel: "Continue",
    defaultCoach: "off",
    supportTitle: "Best for",
    supportBody:
      "Users who already know what they want to practice and mostly need a strong workspace with smart support nearby."
  }
};

export function ModeSetup({ mode }: { mode: SetupMode }) {
  const content = modeContent[mode];
  const [coachStyle, setCoachStyle] = useState<CoachStyle>(content.defaultCoach);

  const launchHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("coach", coachStyle);
    return `/practice/select?${params.toString()}`;
  }, [coachStyle, mode]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section className="uiverse-panel px-6 py-7 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
          {content.step}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          {content.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/70">
          {content.body}
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {coachStyles.map((style) => {
          const isActive = coachStyle === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => setCoachStyle(style.id)}
              className={`mode-choice p-6 text-left transition ${
                isActive ? "uiverse-choice-active text-white" : "text-ink"
              }`}
            >
              <p className="text-sm font-semibold">{style.title}</p>
              <p className={`mt-3 text-sm leading-6 ${isActive ? "text-white/82" : "text-black/66"}`}>
                {style.body}
              </p>
            </button>
          );
        })}
      </section>

      <section className="uiverse-panel px-6 py-6 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div>
            <p className="text-lg font-semibold text-ink">Next step</p>
            <p className="mt-2 text-sm leading-7 text-black/68">
              You&apos;re starting with{" "}
              <span className="font-semibold text-ink">
                {coachStyles.find((style) => style.id === coachStyle)?.title}
              </span>
              . The workspace will open in{" "}
              <span className="font-semibold text-ink">
                {mode === "recognize" ? "pattern recognition" : "pure practice"}
              </span>
              {" "}mode.
            </p>
          </div>

          <div className="rounded-lg border border-black/10 bg-white/88 p-4">
            <p className="text-sm font-semibold text-ink">{content.supportTitle}</p>
            <p className="mt-2 text-sm leading-6 text-black/66">{content.supportBody}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/"
            className="uiverse-button-secondary inline-flex items-center justify-center px-5 py-3 text-sm font-medium"
          >
            Back
          </Link>
          <Link
            href={launchHref}
            className="uiverse-button inline-flex items-center justify-center px-5 py-3 text-sm font-medium"
          >
            {content.nextLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
