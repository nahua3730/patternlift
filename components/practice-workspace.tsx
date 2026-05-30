"use client";

import { useMemo, useState } from "react";
import { patternOptions, reflectionPrompts } from "@/lib/product";

type PatternId = (typeof patternOptions)[number]["id"];

const defaultPrompt =
  "Example: Given an array of positive integers, find the length of the shortest contiguous subarray whose sum is at least target.";

export function PracticeWorkspace() {
  const [problemText, setProblemText] = useState(defaultPrompt);
  const [selectedPattern, setSelectedPattern] = useState<PatternId>(
    patternOptions[0].id
  );

  const activePattern = useMemo(
    () => patternOptions.find((pattern) => pattern.id === selectedPattern)!,
    [selectedPattern]
  );

  const quickRead = useMemo(() => {
    const normalized = problemText.toLowerCase();

    const signals = [
      normalized.includes("substring") || normalized.includes("subarray")
        ? "This prompt signals a contiguous range."
        : null,
      normalized.includes("shortest") || normalized.includes("longest")
        ? "Optimization language often points to a reusable pattern instead of brute force."
        : null,
      normalized.includes("tree") || normalized.includes("graph")
        ? "A traversal pattern may matter here."
        : null,
      normalized.includes("top k") || normalized.includes("kth")
        ? "Ranking language often suggests a heap or binary search angle."
        : null
    ].filter(Boolean) as string[];

    return signals.length > 0
      ? signals
      : [
          "Start by asking whether the input structure or constraint rules out brute force.",
          "Then decide whether the problem is about a range, a traversal, or repeated best-choice updates."
        ];
  }, [problemText]);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="rounded-lg border border-black/10 bg-white/75 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ember">
              Practice Workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Try a problem the way you actually would.
            </h2>
          </div>
          <label className="text-sm text-black/68">
            Predicted pattern
            <select
              value={selectedPattern}
              onChange={(event) =>
                setSelectedPattern(event.target.value as PatternId)
              }
              className="mt-2 block min-w-56 rounded-lg border border-black/10 bg-mist px-3 py-2 text-sm text-ink outline-none transition focus:border-black/35"
            >
              {patternOptions.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-6 block text-sm font-medium text-ink">
          Problem prompt
          <textarea
            value={problemText}
            onChange={(event) => setProblemText(event.target.value)}
            rows={7}
            className="mt-3 w-full rounded-lg border border-black/10 bg-mist px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-black/35"
          />
        </label>

        <div className="mt-6 rounded-lg border border-black/10 bg-mist p-4">
          <p className="text-sm font-semibold text-ink">Coach read on your choice</p>
          <p className="mt-2 text-sm leading-6 text-black/72">
            {activePattern.coachPrompt}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {activePattern.clues.map((clue) => (
              <span
                key={clue}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/68"
              >
                {clue}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-ink p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-lake">
          Structured Reflection
        </p>
        <div className="mt-4 space-y-3">
          {reflectionPrompts.map((prompt, index) => (
            <div
              key={prompt}
              className="rounded-lg border border-white/12 bg-white/8 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                Prompt {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/82">{prompt}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-white/12 bg-white/8 p-4">
          <p className="text-sm font-semibold text-white">Detected signals</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/78">
            {quickRead.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
