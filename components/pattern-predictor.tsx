"use client";

import { useCallback, useEffect, useState } from "react";
import { patternOptions } from "@/lib/pattern-catalog";

// SECURITY-BOUNDARY-STYLE INVARIANT (Phase 2A): this component must never
// read or receive a Transfer problem's target/contrast pattern, recommended
// clues, recommended first step, or category before the learner submits a
// prediction. It deliberately does NOT import allProblems/AppProblem (which
// would put targetPatternId in scope) - the problem preview is fetched from
// a dedicated server route that returns only {id, title, difficulty, prompt}.
// patternOptions is safe to import directly: it's the general, non-problem-
// specific menu of pattern choices the learner picks FROM, not the answer.
type ProblemPreview = { id: string; title: string; difficulty: string; prompt: string };

export function PatternPredictor({
  problemId,
  studyTaskId,
  onSubmitted
}: {
  problemId: string;
  studyTaskId: string;
  // Passes the locked-in prediction (null = "not sure") back up so the
  // session orchestrator can attribute the subsequent solve attempt's
  // recognition signal to this structured prediction instead of
  // whatever the coach chat later infers from free text.
  onSubmitted: (predictedPatternId: string | null) => void;
}) {
  const [problem, setProblem] = useState<ProblemPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [notSure, setNotSure] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const restoreAuthoritativePrediction = useCallback(async () => {
    const response = await fetch(
      `/api/pattern-predictions?studyTaskId=${encodeURIComponent(studyTaskId)}&mode=resume`
    );
    if (response.status === 404) return false;
    if (!response.ok) throw new Error("Could not safely resume your prediction.");

    const data = (await response.json()) as { predictedPatternId: string | null };
    setSelectedPatternId(data.predictedPatternId);
    setNotSure(data.predictedPatternId === null);
    setLocked(true);
    return true;
  }, [studyTaskId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transfer-problem/${problemId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load this problem.");
        return (await response.json()) as ProblemPreview;
      })
      .then((data) => {
        if (!cancelled) setProblem(data);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, [problemId]);

  useEffect(() => {
    let cancelled = false;
    setCheckingExisting(true);
    restoreAuthoritativePrediction()
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not safely resume your prediction.");
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingExisting(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-check whenever the task changes so a locked prediction can never
    // bleed across task identities.
  }, [restoreAuthoritativePrediction]);

  const canSubmit = (selectedPatternId !== null || notSure) && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // The response is deliberately minimal - see app/api/pattern-
      // predictions/route.ts - it never includes wasCorrect or
      // actualPatternId, so there is nothing here to withhold client-side.
      const response = await fetch("/api/pattern-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyTaskId,
          problemId,
          predictedPatternId: notSure ? null : selectedPatternId,
          reasoning: reasoning.trim() ? reasoning.trim() : undefined
        })
      });
      if (!response.ok) throw new Error("Could not save your prediction.");
      // POST is intentionally only {id}. Read back the authoritative,
      // still-non-revealing value so a duplicate/cross-tab submission can
      // never make client state disagree with the immutable database row.
      await restoreAuthoritativePrediction();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return <div className="uiverse-panel p-6 text-sm text-red-500">{loadError}</div>;
  }

  if (!problem || checkingExisting) {
    return <div className="uiverse-panel p-6 text-sm text-black/40">Loading problem…</div>;
  }

  if (locked) {
    return (
      <div className="uiverse-panel p-6 text-center">
        <p className="text-lg font-semibold text-ink">Prediction locked in.</p>
        <p className="mt-2 text-sm text-black/60">
          Now try to solve it - you&apos;ll see how your prediction and your solve compare once you&apos;re done.
        </p>
        <button
          type="button"
          onClick={() => onSubmitted(notSure ? null : selectedPatternId)}
          className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
        >
          Try it on your own →
        </button>
      </div>
    );
  }

  return (
    <div className="uiverse-panel p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-ember">Pattern Challenge</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{problem.title}</h2>
      <p className="mt-1 text-xs font-medium text-black/40">{problem.difficulty}</p>
      <p className="mt-4 text-sm leading-6 text-black/72">{problem.prompt}</p>

      <div className="mt-6">
        <p className="text-sm font-semibold text-ink">What pattern would you try first?</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {patternOptions.map((pattern) => {
            const cue = pattern.coachPrompt;
            const selected = !notSure && selectedPatternId === pattern.id;
            return (
              <button
                key={pattern.id}
                type="button"
                onClick={() => {
                  setSelectedPatternId(pattern.id);
                  setNotSure(false);
                }}
                aria-label={`${pattern.label} — ${cue}`}
                className={`rounded-2xl border p-3 text-left transition ${
                  selected ? "border-indigo-300 bg-indigo-50" : "border-black/10 bg-white hover:border-black/24"
                }`}
              >
                <p className="text-sm font-semibold text-ink">{pattern.label}</p>
                <p className="mt-1 text-xs leading-5 text-black/55">{cue}</p>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setNotSure(true);
            setSelectedPatternId(null);
          }}
          className={`mt-3 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            notSure
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-black/10 bg-white text-black/60 hover:border-black/24"
          }`}
        >
          I&apos;m not sure
        </button>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-black/50">What made you choose that? (optional)</label>
        <textarea
          value={reasoning}
          onChange={(event) => setReasoning(event.target.value)}
          rows={2}
          placeholder="Optional - a sentence is plenty."
          className="mt-1 w-full rounded-2xl border border-black/10 bg-white p-3 text-sm text-ink outline-none focus:border-black/24"
        />
      </div>

      {submitError ? <p className="mt-3 text-xs text-red-500">{submitError}</p> : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-40"
      >
        {submitting ? "Locking in…" : "Lock in prediction →"}
      </button>
    </div>
  );
}
