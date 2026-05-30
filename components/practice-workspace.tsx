"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CoachRequest, CoachResponse } from "@/lib/coach";
import { patternOptions, sampleProblems } from "@/lib/product";
import { getSuggestedTechniques } from "@/lib/techniques";

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
  const [aiCoach, setAiCoach] = useState<CoachResponse | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

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
    setAiCoach(null);
    setCoachError(null);
    setIsCoachLoading(false);
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

  const suggestedTechniques = useMemo(
    () =>
      getSuggestedTechniques({
        primaryPatternId: activeProblem.targetPatternId,
        contrastPatternId: activeProblem.contrastPatternId,
        problemPrompt: problemText
      }),
    [activeProblem.contrastPatternId, activeProblem.targetPatternId, problemText]
  );

  function toggleClue(clue: string) {
    setSelectedClues((current) =>
      current.includes(clue)
        ? current.filter((entry) => entry !== clue)
        : [...current, clue]
    );
    setFeedback(null);
    setAiCoach(null);
    setCoachError(null);
  }

  async function evaluateAttempt() {
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
    setAiCoach(null);
    setCoachError(null);
    onComplete(result);

    const coachPayload: CoachRequest = {
      problemTitle: activeProblem.title,
      problemPrompt: problemText,
      selectedPatternLabel: result.selectedPatternLabel,
      correctPatternLabel: result.correctPatternLabel,
      contrastPatternLabel: result.contrastPatternLabel,
      suggestedTechniqueTitles: suggestedTechniques.map((technique) => technique.title),
      selectedClues: result.selectedClues,
      selectedFirstStep: result.selectedFirstStep,
      localOutcome: result.outcome,
      localScore: result.score,
      reviewQuestion: result.reviewQuestion
    };

    setIsCoachLoading(true);

    try {
      const coachResponse = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(coachPayload)
      });

      const data = (await coachResponse.json()) as CoachResponse | { error: string };

      if (!coachResponse.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Unable to load AI coaching.");
      }

      setAiCoach(data);
    } catch (error) {
      setCoachError(
        error instanceof Error
          ? error.message
          : "Unable to load AI coaching right now."
      );
    } finally {
      setIsCoachLoading(false);
    }
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
              setAiCoach(null);
              setCoachError(null);
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
                    setAiCoach(null);
                    setCoachError(null);
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
                    setAiCoach(null);
                    setCoachError(null);
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
            {isCoachLoading ? "Coaching..." : "Score this attempt"}
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

      <div className="uiverse-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-lake">
          Coach
        </p>

        <div className="mt-4 rounded-lg border border-black/10 bg-mist p-4">
          <p className="text-sm font-semibold text-ink">Detected signals</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-black/74">
            {quickRead.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-black/10 bg-mist p-4">
          <p className="text-sm font-semibold text-ink">Hint ladder</p>
          {hintTrail.length > 0 ? (
            <div className="mt-3 space-y-3">
              {hintTrail.map((hint, index) => (
                <div
                  key={hint}
                  className="rounded-lg border border-black/10 bg-white p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                    Hint {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/72">{hint}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-black/62">
              Start with your own attempt first, then reveal hints only when you
              need the next nudge.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-black/10 bg-mist p-4">
          <p className="text-sm font-semibold text-ink">Target pattern</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {correctPattern.clues.map((clue) => (
              <span
                key={clue}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/72"
              >
                {clue}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-black/10 bg-mist p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Suggested techniques</p>
            <Link
              href="/techniques"
              className="text-xs font-medium text-lake underline-offset-2 hover:underline"
            >
              View full library
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {suggestedTechniques.map((technique) => (
              <div
                key={technique.id}
                className="rounded-lg border border-black/10 bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{technique.title}</p>
                  <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/64">
                    automatic suggestion
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-black/72">
                  <span className="font-semibold text-ink">When to think:</span>{" "}
                  {technique.whenToThink}
                </p>
                <p className="mt-2 text-sm leading-6 text-black/72">
                  <span className="font-semibold text-ink">Starter question:</span>{" "}
                  {technique.starterQuestion}
                </p>
                <p className="mt-2 text-sm leading-6 text-black/68">
                  <span className="font-semibold text-ink">Common trap:</span>{" "}
                  {technique.commonTrap}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {technique.quickTips.map((tip) => (
                    <span
                      key={tip}
                      className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/68"
                    >
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {feedback ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-fern/25 bg-fern/10 p-4 text-black">
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

            {isCoachLoading ? (
              <div className="rounded-lg border border-black/10 bg-mist p-4">
                <p className="text-sm leading-6 text-black/68">
                  Asking the AI coach for a more specific diagnosis and next hint.
                </p>
              </div>
            ) : null}

            {aiCoach ? (
              <div className="rounded-lg border border-lake/25 bg-lake/10 p-4 text-black">
                <p className="text-sm font-semibold">{aiCoach.headline}</p>
                <p className="mt-2 text-sm leading-6 text-black/72">
                  {aiCoach.diagnosis}
                </p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-black/68">
                  <p>
                    <span className="font-semibold text-ink">Clues:</span>{" "}
                    {aiCoach.clueFeedback}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">First move:</span>{" "}
                    {aiCoach.firstStepFeedback}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Next hint:</span>{" "}
                    {aiCoach.nextHint}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Review:</span>{" "}
                    {aiCoach.reviewQuestion}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Coach note:</span>{" "}
                    {aiCoach.encouragement}
                  </p>
                </div>
              </div>
            ) : null}

            {coachError ? (
              <div className="rounded-lg border border-ember/25 bg-ember/10 p-4 text-black">
                <p className="text-sm font-semibold">AI coaching unavailable</p>
                <p className="mt-2 text-sm leading-6 text-black/72">
                  {coachError}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-black/16 p-4">
            <p className="text-sm leading-6 text-black/62">
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
