"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { patternOptions } from "@/lib/product";

const recommendedIds = ["sliding-window", "two-pointers", "hashing"];

export function LearnSetup() {
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const selectedDetails = patternOptions.filter((pattern) => selectedPatterns.includes(pattern.id));

  const nextHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedPatterns.length > 0) params.set("patterns", selectedPatterns.join(","));
    return `/learn?${params.toString()}`;
  }, [selectedPatterns]);

  function togglePattern(patternId: string) {
    setSelectedPatterns((current) =>
      current.includes(patternId)
        ? current.filter((entry) => entry !== patternId)
        : [...current, patternId]
    );
  }

  return (
    <div className="learn-planner">
      <section className="learn-signal-hero">
        <div className="relative z-10 max-w-3xl">
          <div className="learn-live-label"><span /> Mastery path builder</div>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl">
            What do you want to<br className="hidden sm:block" /> recognize on sight?
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Choose the pattern signals you want to sharpen. PatternLift will turn them into a sequence of contrasts, guided reps, and recall checks.
          </p>
        </div>

        <div className="learn-hero-meter">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Path signal</span>
            <span className="text-xs font-medium text-cyan-200">Live</span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold tracking-[-0.05em] text-white">{selectedPatterns.length}</p>
              <p className="mt-1 text-xs text-slate-500">patterns selected</p>
            </div>
            <div className="flex h-10 items-end gap-1" aria-hidden="true">
              {[36, 58, 44, 76, 62, 92].map((height, index) => (
                <span key={height + index} className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-300" style={{ height: `${height}%`, opacity: selectedPatterns.length ? 1 : 0.28 }} />
              ))}
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300 transition-all duration-300" style={{ width: `${Math.min(100, selectedPatterns.length * 20)}%` }} />
          </div>
        </div>
      </section>

      <div className="learn-planner-grid">
        <section className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="product-kicker">Pattern library</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">Build your focus set</h3>
              <p className="mt-2 text-sm text-slate-500">Start with 1–3 patterns for the clearest learning signal.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setSelectedPatterns(recommendedIds)} className="planner-text-button">Use starter set</button>
              {selectedPatterns.length ? <button type="button" onClick={() => setSelectedPatterns([])} className="planner-text-button">Reset</button> : null}
            </div>
          </div>

          <div className="pattern-matrix mt-6">
            {patternOptions.map((pattern, index) => {
              const active = selectedPatterns.includes(pattern.id);
              return (
                <button key={pattern.id} type="button" onClick={() => togglePattern(pattern.id)} className={`pattern-matrix-row ${active ? "pattern-matrix-row-active" : ""}`}>
                  <span className="pattern-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{pattern.label}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">{pattern.clues[0]}</span>
                  </span>
                  <span className={`pattern-check ${active ? "pattern-check-active" : ""}`} aria-hidden="true">{active ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="learning-path-preview">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="product-kicker text-cyan-300">Your next session</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Adaptive learning path</h3>
            </div>
            <span className="path-count">{selectedPatterns.length || 0}/3</span>
          </div>

          {selectedDetails.length ? (
            <div className="mt-7 space-y-1">
              {selectedDetails.slice(0, 5).map((pattern, index) => (
                <div key={pattern.id} className="path-step">
                  <div className="path-step-node">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{pattern.label}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{index === 0 ? "Learn the core signal and invariant" : index === 1 ? "Contrast it with the closest lookalike" : "Prove recognition with a cold prompt"}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-600">{index === 0 ? "8m" : "6m"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="path-empty-state">
              <div className="path-orbit" aria-hidden="true"><span /></div>
              <p className="mt-5 text-sm font-semibold text-white">Your path will build here</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Choose a pattern to preview the sequence PatternLift will generate.</p>
            </div>
          )}

          <div className="mt-auto border-t border-white/10 pt-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Estimated session</span>
              <span>{selectedPatterns.length ? `${Math.max(12, selectedPatterns.length * 8)} min` : "—"}</span>
            </div>
            <Link
              href={nextHref}
              aria-disabled={selectedPatterns.length === 0}
              onClick={(event) => { if (!selectedPatterns.length) event.preventDefault(); }}
              className={`path-launch-button ${selectedPatterns.length ? "" : "path-launch-button-disabled"}`}
            >
              <span>{selectedPatterns.length ? "Build my learning path" : "Select a pattern to continue"}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
