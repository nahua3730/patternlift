"use client";

import { useMemo, useState } from "react";
import {
  patternOptions,
  reflectionExamples,
  reflectionPrompts
} from "@/lib/product";

type PatternId = (typeof patternOptions)[number]["id"];

const defaultPrompt =
  "Example: Given an array of positive integers, find the length of the shortest contiguous subarray whose sum is at least target.";

export function PracticeWorkspace() {
  const [problemText, setProblemText] = useState(defaultPrompt);
  const [selectedPattern, setSelectedPattern] = useState<PatternId>(
    patternOptions[0].id
  );
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

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

  const answerQuality = useMemo(() => {
    return answers.map((answer, index) => {
      if (!hasSubmitted) {
        return null;
      }

      const trimmed = answer.trim();

      if (trimmed.length < 12) {
        return {
          tone: "border-ember/35 bg-ember/10 text-black",
          label: "Needs more detail",
          body: "Push yourself to name a concrete clue or action instead of a vague instinct."
        };
      }

      if (index === 0 && !mentionsPatternSignal(trimmed)) {
        return {
          tone: "border-ember/35 bg-ember/10 text-black",
          label: "Add a sharper clue",
          body: "Try naming a signal from the prompt such as contiguous range, optimization language, or level-order traversal."
        };
      }

      if (index === 1 && !mentionsComparison(trimmed)) {
        return {
          tone: "border-lake/35 bg-lake/10 text-black",
          label: "Good start, push the contrast further",
          body: "Name the nearby pattern explicitly and say what breaks the tie in favor of your choice."
        };
      }

      if (index === 2 && !mentionsAction(trimmed)) {
        return {
          tone: "border-lake/35 bg-lake/10 text-black",
          label: "Add an execution step",
          body: "Describe the first state, pointer move, traversal step, or recurrence you would actually try."
        };
      }

      return {
        tone: "border-fern/35 bg-fern/10 text-black",
        label: "Solid reasoning",
        body: "This reflection is specific enough to be useful during review."
      };
    });
  }, [answers, hasSubmitted]);

  const submissionSummary = useMemo(() => {
    if (!hasSubmitted) {
      return null;
    }

    const completedCount = answers.filter((answer) => answer.trim().length >= 12).length;
    const qualityCount = answerQuality.filter(
      (item) => item?.label === "Solid reasoning"
    ).length;

    if (completedCount < 2) {
      return {
        tone: "border-ember/35 bg-ember/10 text-black",
        title: "Slow down and make the reasoning visible.",
        body: "PatternLift works best when the learner commits to a real guess before hints. Add more concrete thought to at least two prompts."
      };
    }

    if (qualityCount === answers.length) {
      return {
        tone: "border-fern/35 bg-fern/10 text-black",
        title: "This is the right kind of attempt.",
        body: "You named the pattern, compared it to a nearby alternative, and described an actual first step. That is the learning loop we want."
      };
    }

    return {
      tone: "border-lake/35 bg-lake/10 text-black",
      title: "Good attempt, but there is room to sharpen it.",
      body: "Your reasoning is moving in the right direction. Tighten the clue you noticed and make the first solving action more explicit."
    };
  }, [answerQuality, answers, hasSubmitted]);

  function updateAnswer(index: number, value: string) {
    setAnswers((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? value : entry))
    );
  }

  function evaluateAttempt() {
    setHasSubmitted(true);
  }

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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={evaluateAttempt}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
          >
            Evaluate attempt
          </button>
          <p className="text-sm text-black/62">
            Commit to a pattern and reasoning before you ask for more help.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-ink p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-lake">
          Structured Reflection
        </p>
        <div className="mt-4 space-y-3">
          {reflectionPrompts.map((prompt, index) => {
            const feedback = answerQuality[index];

            return (
              <div
                key={prompt}
                className="rounded-lg border border-white/12 bg-white/8 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                  Prompt {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/82">{prompt}</p>
                <textarea
                  value={answers[index]}
                  onChange={(event) => updateAnswer(index, event.target.value)}
                  rows={3}
                  placeholder={reflectionExamples[index]}
                  className="mt-3 w-full rounded-lg border border-white/12 bg-black/16 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/28 focus:border-white/28"
                />

                {feedback ? (
                  <div className={`mt-3 rounded-lg border p-3 ${feedback.tone}`}>
                    <p className="text-sm font-semibold">{feedback.label}</p>
                    <p className="mt-1 text-sm leading-6 text-black/72">
                      {feedback.body}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-white/12 bg-white/8 p-4">
          <p className="text-sm font-semibold text-white">Detected signals</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/78">
            {quickRead.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>

        {submissionSummary ? (
          <div className={`mt-6 rounded-lg border p-4 ${submissionSummary.tone}`}>
            <p className="text-sm font-semibold">{submissionSummary.title}</p>
            <p className="mt-2 text-sm leading-6 text-black/72">
              {submissionSummary.body}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function mentionsPatternSignal(answer: string) {
  const lowered = answer.toLowerCase();

  return [
    "contiguous",
    "substring",
    "subarray",
    "window",
    "sorted",
    "level",
    "shortest",
    "longest",
    "top k",
    "graph",
    "tree"
  ].some((signal) => lowered.includes(signal));
}

function mentionsComparison(answer: string) {
  const lowered = answer.toLowerCase();

  return [
    "confuse",
    "instead",
    "rather than",
    "versus",
    "vs",
    "compared",
    "because"
  ].some((signal) => lowered.includes(signal));
}

function mentionsAction(answer: string) {
  const lowered = answer.toLowerCase();

  return [
    "start",
    "track",
    "move",
    "scan",
    "queue",
    "stack",
    "state",
    "pointer",
    "sum",
    "visit"
  ].some((signal) => lowered.includes(signal));
}
