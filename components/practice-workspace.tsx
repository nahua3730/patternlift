"use client";

import { useMemo, useState } from "react";
import { patternOptions } from "@/lib/product";

type PatternId = (typeof patternOptions)[number]["id"];

const defaultPrompt =
  "Example: Given an array of positive integers, find the length of the shortest contiguous subarray whose sum is at least target.";

const clueChoices = [
  "contiguous subarray",
  "longest or shortest range",
  "sorted input",
  "level-order traversal",
  "top k ranking",
  "repeated best choice",
  "overlapping subproblems",
  "need to shrink after expanding"
] as const;

const firstStepChoices = [
  "Track left and right pointers",
  "Maintain a running sum or frequency state",
  "Use a queue for level order expansion",
  "Go deeper recursively before trying alternatives",
  "Push candidates into a heap",
  "Define a DP state and recurrence"
] as const;

export function PracticeWorkspace() {
  const [problemText, setProblemText] = useState(defaultPrompt);
  const [selectedPattern, setSelectedPattern] = useState<PatternId | null>(null);
  const [selectedClues, setSelectedClues] = useState<string[]>([]);
  const [selectedFirstStep, setSelectedFirstStep] = useState<string | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);

  const activePattern = useMemo(
    () =>
      patternOptions.find((pattern) => pattern.id === selectedPattern) ?? null,
    [selectedPattern]
  );

  const quickRead = useMemo(() => {
    const normalized = problemText.toLowerCase();

    const signals = [
      normalized.includes("substring") || normalized.includes("subarray")
        ? "This looks like a contiguous range problem."
        : null,
      normalized.includes("shortest") || normalized.includes("longest")
        ? "Optimization language suggests a reusable pattern rather than brute force."
        : null,
      normalized.includes("tree") || normalized.includes("graph")
        ? "A traversal pattern may be involved."
        : null,
      normalized.includes("top k") || normalized.includes("kth")
        ? "Ranking language may point toward heap-based thinking."
        : null
    ].filter(Boolean) as string[];

    return signals.length > 0
      ? signals
      : [
          "Look for whether the problem is about a range, a traversal, or repeated best-choice updates."
        ];
  }, [problemText]);

  const matchedClues = useMemo(() => {
    if (!activePattern) {
      return 0;
    }

    return selectedClues.filter((clue) =>
      activePattern.clues.some((patternClue) =>
        patternClue.toLowerCase().includes(clue.split(" ")[0])
      )
    ).length;
  }, [activePattern, selectedClues]);

  const firstStepMatches = useMemo(() => {
    if (!activePattern || !selectedFirstStep) {
      return false;
    }

    return activePattern.firstSteps.some((step) =>
      step.toLowerCase().includes(firstStepKeyword(selectedFirstStep))
    );
  }, [activePattern, selectedFirstStep]);

  const feedback = useMemo(() => {
    if (!hasEvaluated || !activePattern) {
      return null;
    }

    if (selectedClues.length === 0) {
      return {
        tone: "border-ember/35 bg-ember/10 text-black",
        title: "Pick a clue before moving on.",
        body: "Pattern recognition gets much stronger when you tie your guess to visible signals in the prompt."
      };
    }

    if (matchedClues === 0) {
      return {
        tone: "border-ember/35 bg-ember/10 text-black",
        title: "Your pattern and clues are not lining up yet.",
        body: "Try choosing a clue that directly supports this pattern, or switch to a pattern that better matches what you noticed."
      };
    }

    if (!selectedFirstStep) {
      return {
        tone: "border-lake/35 bg-lake/10 text-black",
        title: "Good pattern instinct. Now commit to a first move.",
        body: "The next useful habit is turning the pattern into a concrete action before asking for help."
      };
    }

    if (!firstStepMatches) {
      return {
        tone: "border-lake/35 bg-lake/10 text-black",
        title: "You are close, but the first step does not quite fit.",
        body: "Your chosen pattern may be reasonable, but the initial action sounds more like a neighboring approach."
      };
    }

    return {
      tone: "border-fern/35 bg-fern/10 text-black",
      title: "Nice. This feels like a real attempt.",
      body: "You picked a pattern, tied it to visible clues, and turned it into a concrete first step. That is exactly the behavior PatternLift should reinforce."
    };
  }, [
    activePattern,
    firstStepMatches,
    hasEvaluated,
    matchedClues,
    selectedClues.length,
    selectedFirstStep
  ]);

  function toggleClue(clue: string) {
    setSelectedClues((current) =>
      current.includes(clue)
        ? current.filter((entry) => entry !== clue)
        : [...current, clue]
    );
  }

  function evaluateAttempt() {
    setHasEvaluated(true);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="rounded-lg border border-black/10 bg-white/75 p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ember">
            Practice Workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            Work through the pattern in a lighter way.
          </h2>
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

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">
            1. Which pattern would you try first?
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {patternOptions.map((pattern) => {
              const isSelected = pattern.id === selectedPattern;

              return (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => {
                    setSelectedPattern(pattern.id);
                    setHasEvaluated(false);
                  }}
                  className={`rounded-lg border p-4 text-left transition ${
                    isSelected
                      ? "border-black bg-ink text-white"
                      : "border-black/10 bg-mist text-ink hover:border-black/30"
                  }`}
                >
                  <p className="text-sm font-semibold">{pattern.label}</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isSelected ? "text-white/78" : "text-black/64"
                    }`}
                  >
                    {pattern.coachPrompt}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">
            2. What clue did you notice?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {clueChoices.map((clue) => {
              const isSelected = selectedClues.includes(clue);

              return (
                <button
                  key={clue}
                  type="button"
                  onClick={() => {
                    toggleClue(clue);
                    setHasEvaluated(false);
                  }}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    isSelected
                      ? "border-black bg-ink text-white"
                      : "border-black/10 bg-white text-black/72 hover:border-black/30"
                  }`}
                >
                  {clue}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">
            3. What would your first step be?
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {firstStepChoices.map((step) => {
              const isSelected = selectedFirstStep === step;

              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    setSelectedFirstStep(step);
                    setHasEvaluated(false);
                  }}
                  className={`rounded-lg border p-4 text-left text-sm leading-6 transition ${
                    isSelected
                      ? "border-black bg-ink text-white"
                      : "border-black/10 bg-mist text-black/72 hover:border-black/30"
                  }`}
                >
                  {step}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={evaluateAttempt}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
          >
            Check my reasoning
          </button>
          <p className="text-sm text-black/62">
            Quick choices first, then feedback.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-ink p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-lake">
          Coach Feedback
        </p>

        <div className="mt-4 rounded-lg border border-white/12 bg-white/8 p-4">
          <p className="text-sm font-semibold text-white">Detected signals</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/78">
            {quickRead.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>

        {activePattern ? (
          <div className="mt-4 rounded-lg border border-white/12 bg-white/8 p-4">
            <p className="text-sm font-semibold text-white">Pattern cues</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activePattern.clues.map((clue) => (
                <span
                  key={clue}
                  className="rounded-full border border-white/12 bg-black/18 px-3 py-1 text-xs font-medium text-white/76"
                >
                  {clue}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm leading-6 text-white/78">
              {activePattern.firstSteps.map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-white/18 p-4">
            <p className="text-sm leading-6 text-white/64">
              Pick a pattern first, then PatternLift can coach the clue and the
              first move.
            </p>
          </div>
        )}

        {feedback ? (
          <div className={`mt-4 rounded-lg border p-4 ${feedback.tone}`}>
            <p className="text-sm font-semibold">{feedback.title}</p>
            <p className="mt-2 text-sm leading-6 text-black/72">
              {feedback.body}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-white/18 p-4">
            <p className="text-sm leading-6 text-white/64">
              Choose a pattern, a clue, and a first step. Then check your
              reasoning to see whether the pieces line up.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function firstStepKeyword(step: string) {
  const lowered = step.toLowerCase();

  if (lowered.includes("pointer")) {
    return "pointer";
  }

  if (lowered.includes("sum") || lowered.includes("frequency")) {
    return "sum";
  }

  if (lowered.includes("queue")) {
    return "queue";
  }

  if (lowered.includes("recursively")) {
    return "branch";
  }

  if (lowered.includes("heap")) {
    return "heap";
  }

  return "state";
}
