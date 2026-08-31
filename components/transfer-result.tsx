"use client";

import { useEffect, useState } from "react";
import { patternOptions } from "@/lib/pattern-catalog";

// Recognition (from the blind prediction) and Implementation (from the
// independent solve) are rendered as two separate lines, never collapsed
// into one score - that separation is the whole point of Transfer.
type PredictionResult = {
  predictedPatternId: string | null;
  actualPatternId: string;
  wasCorrect: boolean;
  reasoning: string | null;
};

function patternLabelFor(id: string | null) {
  if (!id) return "Not sure";
  return patternOptions.find((pattern) => pattern.id === id)?.label ?? id;
}

function implementationLabelFor(grade: 0 | 1 | 2 | 3 | undefined) {
  switch (grade) {
    case 3:
      return "Solved independently, no hints";
    case 2:
      return "Solved independently, used a hint or two";
    case 1:
      return "Needed meaningful help to get there";
    case 0:
      return "Didn't land solid this time";
    default:
      return "Recorded";
  }
}

export function TransferResult({
  studyTaskId,
  solveGrade,
  onComplete
}: {
  studyTaskId: string;
  solveGrade?: 0 | 1 | 2 | 3;
  onComplete: () => void;
}) {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pattern-predictions?studyTaskId=${encodeURIComponent(studyTaskId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your result.");
        return (await response.json()) as PredictionResult;
      })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, [studyTaskId]);

  if (error) {
    return <div className="uiverse-panel p-6 text-sm text-red-500">{error}</div>;
  }

  if (!result) {
    return <div className="uiverse-panel p-6 text-sm text-black/40">Loading result…</div>;
  }

  return (
    <div className="uiverse-panel p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-ember">Result</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Recognition &amp; Solve</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div
          className={`rounded-2xl border p-4 ${
            result.wasCorrect ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-black/45">Pattern Recognition</p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {result.wasCorrect
              ? `✓ Correct — ${patternLabelFor(result.actualPatternId)}`
              : `✗ Predicted ${patternLabelFor(result.predictedPatternId)}`}
          </p>
          {!result.wasCorrect ? (
            <p className="mt-1 text-xs text-black/55">Target: {patternLabelFor(result.actualPatternId)}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/45">Implementation</p>
          <p className="mt-2 text-sm font-semibold text-ink">{implementationLabelFor(solveGrade)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
      >
        Continue →
      </button>
    </div>
  );
}
