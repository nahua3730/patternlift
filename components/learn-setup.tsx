"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { patternOptions } from "@/lib/product";

export function LearnSetup() {
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);

  const nextHref = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedPatterns.length > 0) {
      params.set("patterns", selectedPatterns.join(","));
    }

    return `/learn?${params.toString()}`;
  }, [selectedPatterns]);

  function togglePattern(patternId: string) {
    setSelectedPatterns((current) =>
      current.includes(patternId)
        ? current.filter((entry) => entry !== patternId)
        : [...current, patternId]
    );
  }

  const selectedCount = selectedPatterns.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="uiverse-panel px-6 py-7 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
          Learning Mode
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          Choose the patterns you want to focus on first.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/70">
          We&apos;ll build your next page around these pattern families, so this
          should feel like choosing a lane, not committing to your whole life.
        </p>
      </section>

      <section className="uiverse-panel px-6 py-6 md:px-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold text-ink">Pattern families</p>
              <p className="mt-1 text-sm leading-6 text-black/64">
                Pick one or several. You can always come back and choose a different path.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSelectedPatterns(patternOptions.map((pattern) => pattern.id))}
                className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelectedPatterns([])}
                className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {patternOptions.map((pattern) => {
              const isActive = selectedPatterns.includes(pattern.id);

              return (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => togglePattern(pattern.id)}
                  className={`pattern-card text-left ${
                    isActive ? "pattern-card-active text-white" : "text-ink"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{pattern.label}</p>
                      <p
                        className={`mt-2 text-sm leading-6 ${
                          isActive ? "text-white/80" : "text-black/60"
                        }`}
                      >
                        {pattern.coachPrompt}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive ? "bg-white/18 text-white" : "bg-black/6 text-black/60"
                      }`}
                    >
                      {selectedPatterns.includes(pattern.id) ? "Selected" : "Tap to add"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {pattern.clues.slice(0, 2).map((clue) => (
                      <span
                        key={`${pattern.id}-${clue}`}
                        className={`rounded-full px-3 py-2 text-xs ${
                          isActive
                            ? "border border-white/16 bg-white/12 text-white/82"
                            : "border border-black/8 bg-white/76 text-black/60"
                        }`}
                      >
                        {clue}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="uiverse-panel px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-lg font-semibold text-ink">Next step</p>
            <p className="mt-2 text-sm leading-7 text-black/68">
              You&apos;ve selected{" "}
              <span className="font-semibold text-ink">{selectedCount}</span>{" "}
              {selectedCount === 1 ? "pattern" : "patterns"}. On the next page,
              we&apos;ll suggest problems and let you choose how much help the coach gives.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="uiverse-button-secondary inline-flex items-center justify-center px-5 py-3 text-sm font-medium"
            >
              Back
            </Link>
            <Link
              href={nextHref}
              aria-disabled={selectedCount === 0}
              className={`inline-flex items-center justify-center px-5 py-3 text-sm font-medium ${
                selectedCount === 0
                  ? "cursor-not-allowed rounded-[8px] border border-black/10 bg-white/70 text-black/34"
                  : "uiverse-button"
              }`}
              onClick={(event) => {
                if (selectedCount === 0) event.preventDefault();
              }}
            >
              Continue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
