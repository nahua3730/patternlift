"use client";

import { useMemo, useState } from "react";
import { demoProblem } from "@/lib/product";

type OptionId = (typeof demoProblem.options)[number]["id"];

export function PatternDemo() {
  const [selectedId, setSelectedId] = useState<OptionId | null>(null);
  const [hintLevel, setHintLevel] = useState(0);

  const selectedOption = useMemo(
    () => demoProblem.options.find((option) => option.id === selectedId) ?? null,
    [selectedId]
  );

  const feedbackTone = selectedOption?.isCorrect
    ? "border-fern/40 bg-fern/10 text-black"
    : "border-ember/35 bg-ember/10 text-black";

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-lg border border-black/10 bg-white/75 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-lake">
            Pattern Drill
          </p>
          <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-black/65">
            {demoProblem.difficulty}
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-ink">
          {demoProblem.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-black/74">
          {demoProblem.prompt}
        </p>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">
            Which pattern would you try first?
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {demoProblem.options.map((option) => {
              const isSelected = option.id === selectedId;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedId(option.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    isSelected
                      ? "border-black bg-ink text-white"
                      : "border-black/10 bg-mist text-ink hover:border-black/30"
                  }`}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isSelected ? "text-white/78" : "text-black/64"
                    }`}
                  >
                    {option.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {selectedOption ? (
          <div className={`mt-6 rounded-lg border p-4 ${feedbackTone}`}>
            <p className="text-sm font-semibold">
              {selectedOption.isCorrect
                ? "Good first instinct."
                : "Close, but not quite the main pattern."}
            </p>
            <p className="mt-2 text-sm leading-6">{selectedOption.summary}</p>
            <p className="mt-2 text-sm leading-6 text-black/68">
              {demoProblem.takeaway}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-black/10 bg-ink p-6 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-fern">
            Guided Hints
          </p>
          <button
            type="button"
            onClick={() =>
              setHintLevel((current) =>
                Math.min(current + 1, demoProblem.hints.length)
              )
            }
            className="rounded-lg border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14"
          >
            Reveal next hint
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {demoProblem.cues.map((cue) => (
            <div
              key={cue}
              className="rounded-lg border border-white/12 bg-white/8 p-4"
            >
              <p className="text-sm leading-6 text-white/78">{cue}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {demoProblem.hints.slice(0, hintLevel).map((hint, index) => (
            <div
              key={hint}
              className="rounded-lg border border-fern/25 bg-fern/10 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                Hint {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/82">{hint}</p>
            </div>
          ))}

          {hintLevel === 0 ? (
            <div className="rounded-lg border border-dashed border-white/20 p-4">
              <p className="text-sm leading-6 text-white/62">
                Start with the prompt and the cues first. PatternLift should
                slow the learner down just enough to build recognition instead
                of reaching for the answer immediately.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
