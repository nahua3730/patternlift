"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { patternOptions } from "@/lib/product";

type LearnMode = "learn" | "recognize" | "practice";
type CoachStyle = "beginner" | "guided" | "optional" | "off";

const modeCards: Array<{
  id: LearnMode;
  title: string;
  body: string;
}> = [
  {
    id: "learn",
    title: "Learning Mode",
    body:
      "Choose one or more patterns, get recommended problems, and let the coach walk you from easier reps into harder ones."
  },
  {
    id: "recognize",
    title: "Pattern Recognition",
    body:
      "Paste a problem, name the pattern you suspect, and let the coach help you tell similar approaches apart."
  },
  {
    id: "practice",
    title: "Pure Practice",
    body:
      "Jump into the editor, run tests, and decide whether you want the coach helping in the background or staying quiet."
  }
];

const coachStyles: Array<{
  id: CoachStyle;
  title: string;
  body: string;
}> = [
  {
    id: "beginner",
    title: "Beginner Guided",
    body:
      "More scaffolding, stronger nudges, and code feedback that explains why a structure or line is helping or hurting."
  },
  {
    id: "guided",
    title: "Guided",
    body:
      "A thoughtful coach that nudges, contrasts patterns, and reviews your code without taking the whole problem away."
  },
  {
    id: "optional",
    title: "Hints On Demand",
    body:
      "Mostly self-driven practice, with the option to call the coach in when you want help."
  },
  {
    id: "off",
    title: "Coach Off",
    body:
      "A clean practice workspace first. You can still turn the coach back on later if you want a second set of eyes."
  }
];

export function HomePage() {
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([
    "sliding-window",
    "two-pointers"
  ]);
  const [selectedMode, setSelectedMode] = useState<LearnMode>("learn");
  const [coachStyle, setCoachStyle] = useState<CoachStyle>("guided");

  const selectedPatternLabels = useMemo(() => {
    return patternOptions
      .filter((pattern) => selectedPatterns.includes(pattern.id))
      .map((pattern) => pattern.label);
  }, [selectedPatterns]);

  const launchHref = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedPatterns.length > 0) {
      params.set("patterns", selectedPatterns.join(","));
    }

    params.set("coach", coachStyle);

    if (selectedMode === "learn") {
      return `/learn?${params.toString()}`;
    }

    params.set("mode", selectedMode);
    return `/practice?${params.toString()}`;
  }, [coachStyle, selectedMode, selectedPatterns]);

  function togglePattern(patternId: string) {
    setSelectedPatterns((current) =>
      current.includes(patternId)
        ? current.filter((entry) => entry !== patternId)
        : [...current, patternId]
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="uiverse-panel px-6 py-8 md:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-ember">
            PatternLift
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Learn coding patterns with the kind of AI coach you actually want beside you.
          </h1>
          <p className="mt-4 text-base leading-7 text-black/70">
            Pick what you want to learn first. We&apos;ll shape the experience around
            whether you want guided teaching, pattern recognition reps, or clean
            practice with help on standby.
          </p>
        </div>
      </section>

      <section className="uiverse-panel px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-ink">Choose your patterns</p>
              <p className="mt-1 text-sm leading-6 text-black/64">
                Not everybody wants every pattern at once. Start where you actually want reps.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPatterns(patternOptions.map((pattern) => pattern.id))}
              className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
            >
              Select all
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {patternOptions.map((pattern) => {
              const isActive = selectedPatterns.includes(pattern.id);

              return (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => togglePattern(pattern.id)}
                  className={`uiverse-bubble px-4 py-3 text-sm font-medium transition ${
                    isActive ? "uiverse-bubble-active text-white" : "text-ink"
                  }`}
                >
                  {pattern.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {modeCards.map((mode) => {
          const isActive = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSelectedMode(mode.id)}
              className={`uiverse-panel p-6 text-left transition ${
                isActive ? "border-lake/40 bg-lake/10" : "hover:border-black/18"
              }`}
            >
              <p className="text-lg font-semibold text-ink">{mode.title}</p>
              <p className="mt-3 text-sm leading-6 text-black/68">{mode.body}</p>
            </button>
          );
        })}
      </section>

      <section className="uiverse-panel px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-lg font-semibold text-ink">Choose how the coach behaves</p>
            <p className="mt-1 text-sm leading-6 text-black/64">
              Beginner mode pushes harder on why a data structure or line makes sense.
              Practice mode can stay quiet if you want the cleaner pressure.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {coachStyles.map((style) => {
              const isActive = coachStyle === style.id;

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setCoachStyle(style.id)}
                  className={`uiverse-choice p-5 text-left ${
                    isActive ? "uiverse-choice-active text-white" : "text-ink"
                  }`}
                >
                  <p className="text-sm font-semibold">{style.title}</p>
                  <p className={`mt-3 text-sm leading-6 ${isActive ? "text-white/80" : "text-black/64"}`}>
                    {style.body}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="uiverse-panel px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-lg font-semibold text-ink">Your current setup</p>
            <p className="mt-2 text-sm leading-7 text-black/68">
              Starting with{" "}
              <span className="font-semibold text-ink">
                {selectedPatternLabels.length > 0
                  ? selectedPatternLabels.join(", ")
                  : "all patterns"}
              </span>
              {" "}in{" "}
              <span className="font-semibold text-ink">
                {modeCards.find((mode) => mode.id === selectedMode)?.title}
              </span>
              {" "}with{" "}
              <span className="font-semibold text-ink">
                {coachStyles.find((style) => style.id === coachStyle)?.title}
              </span>
              .
            </p>
          </div>

          <Link
            href={launchHref}
            className="uiverse-button inline-flex items-center justify-center px-5 py-3 text-sm font-medium"
          >
            Start this mode
          </Link>
        </div>
      </section>
    </div>
  );
}
