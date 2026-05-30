"use client";

import { useEffect, useMemo, useState } from "react";
import { patternOptions, sampleProblems } from "@/lib/product";

type PatternId = (typeof patternOptions)[number]["id"];
type Problem = (typeof sampleProblems)[number];

type AttemptResult = {
  problemId: string;
  problemTitle: string;
  selectedPatternLabel: string;
  selectedPatternId: PatternId | null;
  correctPatternLabel: string;
  selectedClues: string[];
  selectedFirstStep: string | null;
  outcome: "solid" | "partial" | "confused";
  score: number;
  feedbackTitle: string;
  feedbackBody: string;
  reviewQuestion: string;
  weakPatternLabel: string;
  contrastPatternLabel: string;
};

type PracticeWorkspaceProps = {
  onComplete: (result: AttemptResult) => void;
};

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

export function PracticeWorkspace({ onComplete }: PracticeWorkspaceProps) {
  const [problemId, setProblemId] = useState<string>(sampleProblems[0].id);
  const [problemText, setProblemText] = useState<string>(sampleProblems[0].prompt);
  const [selectedPattern, setSelectedPattern] = useState<PatternId | null>(null);
  const [selectedClues, setSelectedClues] = useState<string[]>([]);
  const [selectedFirstStep, setSelectedFirstStep] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [feedback, setFeedback] = useState<AttemptResult | null>(null);

  const activeProblem = useMemo(
    () => sampleProblems.find((problem) => problem.id === problemId) ?? sampleProblems[0],
    [problemId]
  );

  const activePattern = useMemo(
    () =>
      patternOptions.find((pattern) => pattern.id === selectedPattern) ?? null,
    [selectedPattern]
  );

  const correctPattern = useMemo(
    () =>
      patternOptions.find((pattern) => pattern.id === activeProblem.targetPatternId)!,
    [activeProblem.targetPatternId]
  );

  useEffect(() => {
    setProblemText(activeProblem.prompt);
    setSelectedPattern(null);
    setSelectedClues([]);
    setSelectedFirstStep(null);
    setHintLevel(0);
    setFeedback(null);
  }, [activeProblem]);

  const quickRead = useMemo(() => {
    const normalized = problemText.toLowerCase();

    const signals = [
      normalized.includes("substring") || normalized.includes("subarray")
        ? "This prompt signals a contiguous range."
        : null,
      normalized.includes("shortest") || normalized.includes("longest")
        ? "Optimization language often points to a reusable pattern."
        : null,
      normalized.includes("tree") || normalized.includes("graph")
        ? "A traversal pattern may be the main frame."
        : null,
      normalized.includes("top k") || normalized.includes("k most")
        ? "Ranking language often suggests a heap-based approach."
        : null
    ].filter(Boolean) as string[];

    return signals.length > 0
      ? signals
      : [
          "Look for whether the problem is about a range, a traversal, or repeated best-choice updates."
        ];
  }, [problemText]);

  const hintTrail = useMemo(() => {
    const hints = [
      `First signal: ${activeProblem.reviewQuestion}`,
      `Contrast check: this is more ${correctPattern.label} than ${
        patternOptions.find((pattern) => pattern.id === activeProblem.contrastPatternId)
          ?.label ?? "a neighboring pattern"
      }.`,
      `Implementation nudge: ${correctPattern.firstSteps[0]}.`
    ];

    return hints.slice(0, hintLevel);
  }, [activeProblem, correctPattern, hintLevel]);

  function toggleClue(clue: string) {
    setSelectedClues((current) =>
      current.includes(clue)
        ? current.filter((entry) => entry !== clue)
        : [...current, clue]
    );
    setFeedback(null);
  }

  function evaluateAttempt() {
    const matchedClues = selectedClues.filter((clue) =>
      (activeProblem.recommendedClues as readonly string[]).includes(clue)
    ).length;

    const patternCorrect = selectedPattern === activeProblem.targetPatternId;
    const stepCorrect = selectedFirstStep === activeProblem.recommendedFirstStep;

    let score = 0;
    if (patternCorrect) score += 50;
    score += Math.min(matchedClues * 15, 30);
    if (stepCorrect) score += 20;

    const outcome: AttemptResult["outcome"] =
      score >= 75 ? "solid" : score >= 40 ? "partial" : "confused";

    const feedbackTitle =
      outcome === "solid"
        ? "Nice. This is a strong interview-style attempt."
        : outcome === "partial"
          ? "You are circling the right idea."
          : "The pattern and the clues are fighting each other.";

    const feedbackBody =
      outcome === "solid"
        ? `You matched the problem to ${correctPattern.label}, noticed the most useful prompt cues, and chose a fitting first move.`
        : outcome === "partial"
          ? `There is something real in your instinct, but the best next step is to sharpen why this is ${correctPattern.label} rather than ${patternOptions.find((pattern) => pattern.id === activeProblem.contrastPatternId)?.label}.`
          : `Right now the app would coach you back to the signal words in the prompt before showing more hints. This problem wants ${correctPattern.label}.`;

    const result: AttemptResult = {
      problemId: activeProblem.id,
      problemTitle: activeProblem.title,
      selectedPatternLabel: activePattern?.label ?? "No pattern selected",
      selectedPatternId: selectedPattern,
      correctPatternLabel: correctPattern.label,
      selectedClues,
      selectedFirstStep,
      outcome,
      score,
      feedbackTitle,
      feedbackBody,
      reviewQuestion: activeProblem.reviewQuestion,
      weakPatternLabel: correctPattern.label,
      contrastPatternLabel:
        patternOptions.find((pattern) => pattern.id === activeProblem.contrastPatternId)
          ?.label ?? "Neighboring pattern"
    };

    setFeedback(result);
    onComplete(result);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
      <div className="uiverse-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ember">
              Practice
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Run one interview-prep attempt from start to finish.
            </h2>
          </div>

          <label className="text-sm text-black/68">
            Problem set
            <select
              value={problemId}
              onChange={(event) => setProblemId(event.target.value)}
              className="uiverse-field mt-2 block min-w-64 px-3 py-2 text-sm text-ink"
            >
              {sampleProblems.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/66">
            {activeProblem.difficulty}
          </span>
          <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/66">
            Contrast with{" "}
            {
              patternOptions.find((pattern) => pattern.id === activeProblem.contrastPatternId)
                ?.label
            }
          </span>
        </div>

        <label className="mt-6 block text-sm font-medium text-ink">
          Problem prompt
          <textarea
            value={problemText}
            onChange={(event) => {
              setProblemText(event.target.value);
              setFeedback(null);
            }}
            rows={6}
            className="uiverse-field mt-3 w-full px-4 py-3 text-sm leading-6 text-ink"
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
                    setFeedback(null);
                  }}
                  className={`uiverse-choice p-4 text-left transition ${
                    isSelected
                      ? "uiverse-choice-active text-white"
                      : "text-ink"
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
            2. Which clues are pulling your attention?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {clueChoices.map((clue) => {
              const isSelected = selectedClues.includes(clue);

              return (
                <button
                  key={clue}
                  type="button"
                  onClick={() => toggleClue(clue)}
                  className={`uiverse-chip px-3 py-2 text-sm transition ${
                    isSelected
                      ? "uiverse-chip-active text-white"
                      : "text-black/72"
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
            3. What would your first concrete move be?
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
                    setFeedback(null);
                  }}
                  className={`uiverse-choice p-4 text-left text-sm leading-6 transition ${
                    isSelected
                      ? "uiverse-choice-active text-white"
                      : "text-black/72"
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
            className="uiverse-button px-4 py-2 text-sm font-medium"
          >
            Score this attempt
          </button>
          <button
            type="button"
            onClick={() => setHintLevel((current) => Math.min(current + 1, 3))}
            className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
          >
            Reveal next hint
          </button>
        </div>
      </div>

      <div className="uiverse-panel-dark p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-lake">
          Coach
        </p>

        <div className="mt-4 rounded-lg border border-white/12 bg-white/8 p-4">
          <p className="text-sm font-semibold text-white">Detected signals</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/78">
            {quickRead.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-white/12 bg-white/8 p-4">
          <p className="text-sm font-semibold text-white">Hint ladder</p>
          {hintTrail.length > 0 ? (
            <div className="mt-3 space-y-3">
              {hintTrail.map((hint, index) => (
                <div
                  key={hint}
                  className="rounded-lg border border-white/12 bg-black/18 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                    Hint {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/78">{hint}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-white/62">
              Start with your own attempt first, then reveal hints only when you
              need the next nudge.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-white/12 bg-white/8 p-4">
          <p className="text-sm font-semibold text-white">Target pattern</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {correctPattern.clues.map((clue) => (
              <span
                key={clue}
                className="rounded-full border border-white/12 bg-black/18 px-3 py-1 text-xs font-medium text-white/78"
              >
                {clue}
              </span>
            ))}
          </div>
        </div>

        {feedback ? (
          <div className="mt-4 rounded-lg border border-fern/25 bg-fern/10 p-4 text-black">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{feedback.feedbackTitle}</p>
              <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs font-semibold">
                Score {feedback.score}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-black/72">
              {feedback.feedbackBody}
            </p>
            <p className="mt-3 text-sm leading-6 text-black/68">
              Review hook: {feedback.reviewQuestion}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-white/18 p-4">
            <p className="text-sm leading-6 text-white/64">
              Finish one attempt to generate score, review hooks, and progress
              updates.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export type { AttemptResult };
