"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { CoachRequest, CoachResponse } from "@/lib/coach";
import { patternOptions, sampleProblems } from "@/lib/product";
import { getSuggestedTechniques } from "@/lib/techniques";

type PatternId = (typeof patternOptions)[number]["id"];

export type AttemptResult = {
  problemId: string;
  problemTitle: string;
  selectedPatternLabel: string;
  selectedPatternId: PatternId | null;
  correctPatternLabel: string;
  selectedClues: string[];
  selectedFirstStep: string | null;
  learnerNote: string;
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
  const [learnerNote, setLearnerNote] = useState("");
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
    () => patternOptions.find((pattern) => pattern.id === selectedPattern) ?? null,
    [selectedPattern]
  );

  const correctPattern = useMemo(
    () => patternOptions.find((pattern) => pattern.id === activeProblem.targetPatternId)!,
    [activeProblem.targetPatternId]
  );

  const contrastPattern = useMemo(
    () =>
      patternOptions.find((pattern) => pattern.id === activeProblem.contrastPatternId) ?? null,
    [activeProblem.contrastPatternId]
  );

  const contrastPatternLabel = contrastPattern?.label ?? "Neighboring pattern";

  useEffect(() => {
    setProblemText(activeProblem.prompt);
    setSelectedPattern(null);
    setSelectedClues([]);
    setSelectedFirstStep(null);
    setLearnerNote("");
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
        ? "This prompt is talking about a contiguous range, so reuse matters."
        : null,
      normalized.includes("shortest") || normalized.includes("longest")
        ? "Optimization language usually means the same structure should keep getting refined."
        : null,
      normalized.includes("tree") || normalized.includes("graph")
        ? "This smells like traversal, so the real question is whether depth or levels matter more."
        : null,
      normalized.includes("top k") || normalized.includes("k most")
        ? "Ranking language is a strong clue that repeated best-candidate access may matter."
        : null
    ].filter(Boolean) as string[];

    return signals.length > 0
      ? signals
      : [
          "Before naming a pattern, ask whether this is mainly about a range, a traversal, or repeated best-choice updates."
        ];
  }, [problemText]);

  const hintTrail = useMemo(() => {
    const hints = [
      `Look at the signal hidden inside this prompt: ${activeProblem.reviewQuestion}`,
      `Pattern contrast: this is more ${correctPattern.label} than ${contrastPatternLabel}.`,
      `Implementation nudge: ${correctPattern.firstSteps[0]}.`
    ];

    return hints.slice(0, hintLevel);
  }, [activeProblem, contrastPatternLabel, correctPattern, hintLevel]);

  const suggestedTechniques = useMemo(
    () =>
      getSuggestedTechniques({
        primaryPatternId: selectedPattern ?? activeProblem.targetPatternId,
        contrastPatternId: activeProblem.contrastPatternId,
        problemPrompt: problemText
      }),
    [activeProblem.contrastPatternId, activeProblem.targetPatternId, problemText, selectedPattern]
  );

  function resetFeedback() {
    setFeedback(null);
    setAiCoach(null);
    setCoachError(null);
  }

  function updateProblemText(value: string) {
    setProblemText(value);
    resetFeedback();
  }

  function toggleClue(clue: string) {
    setSelectedClues((current) =>
      current.includes(clue)
        ? current.filter((entry) => entry !== clue)
        : [...current, clue]
    );
    resetFeedback();
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
        ? "Nice. Your reasoning is starting in the right neighborhood."
        : outcome === "partial"
          ? "You are close, but one distinction still needs to click."
          : "Good moment to slow down and re-anchor on the strongest signal.";

    const feedbackBody =
      outcome === "solid"
        ? `You matched this to ${correctPattern.label}, noticed useful clues, and picked a first move that belongs to that pattern.`
        : outcome === "partial"
          ? `There is a real instinct here, but the sharper move is to explain why this is ${correctPattern.label} instead of ${contrastPatternLabel}.`
          : `The prompt is trying to pull you toward ${correctPattern.label}. Before more code, I would go back to the exact words that imply that pattern.`;

    const result: AttemptResult = {
      problemId: activeProblem.id,
      problemTitle: activeProblem.title,
      selectedPatternLabel: activePattern?.label ?? "No pattern selected",
      selectedPatternId: selectedPattern,
      correctPatternLabel: correctPattern.label,
      selectedClues,
      selectedFirstStep,
      learnerNote: learnerNote.trim(),
      outcome,
      score,
      feedbackTitle,
      feedbackBody,
      reviewQuestion: activeProblem.reviewQuestion,
      weakPatternLabel: correctPattern.label,
      contrastPatternLabel
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
      learnerNote: result.learnerNote,
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

  const canEvaluate =
    problemText.trim().length > 0 && selectedPattern && selectedClues.length > 0 && selectedFirstStep;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <ThreadMessage
        speaker="coach"
        title="Paste a problem and let’s work it like a live coaching thread."
      >
        <p className="text-sm leading-7 text-black/72">
          We&apos;ll keep this lightweight. You give me the prompt, your instinct,
          and the clue you noticed. I&apos;ll react with technique nudges, contrast
          hints, and one next step instead of dumping a solution.
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="text-sm text-black/68">
            Sample problem
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

          <button
            type="button"
            onClick={() => {
              setProblemId(activeProblem.id);
              setProblemText(activeProblem.prompt);
            }}
            className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
          >
            Reset prompt
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-black/10 bg-white/90 p-4">
          <p className="text-sm font-semibold text-ink">Problem prompt</p>
          <textarea
            value={problemText}
            onChange={(event) => updateProblemText(event.target.value)}
            rows={7}
            className="uiverse-field mt-3 w-full px-4 py-3 text-sm leading-6 text-ink"
            placeholder="Paste a LeetCode problem here."
          />
        </div>
      </ThreadMessage>

      <ThreadMessage speaker="user" title={activeProblem.title}>
        <p className="text-sm leading-7 text-black/78 whitespace-pre-wrap">{problemText}</p>
      </ThreadMessage>

      <ThreadMessage
        speaker="coach"
        title="Here’s what I notice before naming a pattern."
      >
        <ul className="space-y-2 text-sm leading-6 text-black/72">
          {quickRead.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/66">
            {activeProblem.difficulty}
          </span>
          <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/66">
            Easy to confuse with {contrastPatternLabel}
          </span>
        </div>
      </ThreadMessage>

      <ThreadMessage
        speaker="coach"
        title="What pattern does your first instinct point to?"
        controls={
          <ChoiceGrid>
            {patternOptions.map((pattern) => {
              const isSelected = pattern.id === selectedPattern;

              return (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => {
                    setSelectedPattern(pattern.id);
                    resetFeedback();
                  }}
                  className={`uiverse-choice p-4 text-left transition ${
                    isSelected ? "uiverse-choice-active text-white" : "text-ink"
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
          </ChoiceGrid>
        }
      >
        <p className="text-sm leading-6 text-black/72">
          Don&apos;t worry about being perfect here. I care more about your first
          read than whether you get it right immediately.
        </p>
      </ThreadMessage>

      {activePattern ? (
        <ThreadMessage speaker="user" title="My current guess">
          <p className="text-sm font-semibold text-ink">{activePattern.label}</p>
          <p className="mt-2 text-sm leading-6 text-black/72">
            I&apos;m leaning this way because the prompt feels closest to this pattern.
          </p>
        </ThreadMessage>
      ) : null}

      {activePattern ? (
        <ThreadMessage
          speaker="coach"
          title={`Okay. What clue made ${activePattern.label} feel plausible to you?`}
          controls={
            <div className="flex flex-wrap gap-2">
              {clueChoices.map((clue) => {
                const isSelected = selectedClues.includes(clue);

                return (
                  <button
                    key={clue}
                    type="button"
                    onClick={() => toggleClue(clue)}
                    className={`uiverse-chip px-3 py-2 text-sm transition ${
                      isSelected ? "uiverse-chip-active text-white" : "text-black/72"
                    }`}
                  >
                    {clue}
                  </button>
                );
              })}
            </div>
          }
        >
          <p className="text-sm leading-6 text-black/72">
            Pick one or two clues. We&apos;re trying to train what your eyes notice
            first, not write an essay.
          </p>
        </ThreadMessage>
      ) : null}

      {selectedClues.length > 0 ? (
        <ThreadMessage speaker="user" title="The clue I noticed">
          <div className="flex flex-wrap gap-2">
            {selectedClues.map((clue) => (
              <span
                key={clue}
                className="rounded-full border border-black/10 bg-white/85 px-3 py-1 text-sm text-black/72"
              >
                {clue}
              </span>
            ))}
          </div>
        </ThreadMessage>
      ) : null}

      {selectedClues.length > 0 ? (
        <ThreadMessage
          speaker="coach"
          title="Good. Hold onto these ideas while you choose the first move."
          controls={
            <ChoiceGrid columns="two">
              {firstStepChoices.map((step) => {
                const isSelected = selectedFirstStep === step;

                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      setSelectedFirstStep(step);
                      resetFeedback();
                    }}
                    className={`uiverse-choice p-4 text-left text-sm leading-6 transition ${
                      isSelected ? "uiverse-choice-active text-white" : "text-black/72"
                    }`}
                  >
                    {step}
                  </button>
                );
              })}
            </ChoiceGrid>
          }
        >
          <div className="space-y-3">
            <p className="text-sm leading-6 text-black/72">
              Here are the techniques I&apos;d keep nearby for this prompt.
            </p>

            <div className="space-y-3">
              {suggestedTechniques.map((technique) => (
                <div
                  key={technique.id}
                  className="rounded-lg border border-black/10 bg-white/90 p-4"
                >
                  <p className="text-sm font-semibold text-ink">{technique.title}</p>
                  <p className="mt-2 text-sm leading-6 text-black/72">
                    <span className="font-semibold text-ink">Starter question:</span>{" "}
                    {technique.starterQuestion}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/68">
                    <span className="font-semibold text-ink">Trap:</span>{" "}
                    {technique.commonTrap}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {technique.quickTips.slice(0, 2).map((tip) => (
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
        </ThreadMessage>
      ) : null}

      {selectedFirstStep ? (
        <ThreadMessage speaker="user" title="My first move">
          <p className="text-sm leading-7 text-black/78">{selectedFirstStep}</p>
          <div className="mt-4 rounded-lg border border-black/10 bg-white/90 p-4">
            <label className="block text-sm font-medium text-ink" htmlFor="learner-note">
              Optional: what still feels fuzzy?
            </label>
            <textarea
              id="learner-note"
              value={learnerNote}
              onChange={(event) => {
                setLearnerNote(event.target.value);
                resetFeedback();
              }}
              rows={3}
              className="uiverse-field mt-3 w-full px-4 py-3 text-sm leading-6 text-ink"
              placeholder="Example: I can tell this is range-based, but I’m not sure when the left pointer should move."
            />
          </div>
        </ThreadMessage>
      ) : null}

      {selectedFirstStep ? (
        <ThreadMessage
          speaker="coach"
          title="Want a nudge before I react to the whole attempt?"
          controls={
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={evaluateAttempt}
                disabled={!canEvaluate || isCoachLoading}
                className="uiverse-button px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCoachLoading ? "Coach is thinking..." : "Get coach response"}
              </button>
              <button
                type="button"
                onClick={() => setHintLevel((current) => Math.min(current + 1, 3))}
                className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
              >
                Reveal next hint
              </button>
            </div>
          }
        >
          <p className="text-sm leading-6 text-black/72">
            If you want to stay in the struggle a little longer, reveal a hint.
            If you want targeted feedback now, let me respond to the full thread.
          </p>
        </ThreadMessage>
      ) : null}

      {hintTrail.map((hint, index) => (
        <ThreadMessage
          key={hint}
          speaker="coach"
          title={`Hint ${index + 1}`}
        >
          <p className="text-sm leading-6 text-black/72">{hint}</p>
        </ThreadMessage>
      ))}

      {feedback ? (
        <ThreadMessage speaker="coach" title={feedback.feedbackTitle}>
          <div className="rounded-lg border border-fern/25 bg-fern/10 p-4 text-black">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-6 text-black/72">{feedback.feedbackBody}</p>
              <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold">
                Score {feedback.score}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-black/68">
              Review hook: {feedback.reviewQuestion}
            </p>
          </div>
        </ThreadMessage>
      ) : null}

      {isCoachLoading ? (
        <ThreadMessage speaker="coach" title="Thinking through your attempt...">
          <p className="text-sm leading-6 text-black/68">
            I&apos;m turning your choices into more specific coaching.
          </p>
        </ThreadMessage>
      ) : null}

      {aiCoach ? (
        <ThreadMessage speaker="coach" title={aiCoach.headline}>
          <div className="space-y-4 rounded-lg border border-lake/25 bg-lake/10 p-4">
            <p className="text-sm leading-6 text-black/72">{aiCoach.diagnosis}</p>

            <CoachNote title="Clue read" body={aiCoach.clueFeedback} />
            <CoachNote title="First move" body={aiCoach.firstStepFeedback} />
            <CoachNote title="Next hint" body={aiCoach.nextHint} />
            <CoachNote title="Review later" body={aiCoach.reviewQuestion} />

            <p className="text-sm leading-6 text-black/68">{aiCoach.encouragement}</p>
          </div>
        </ThreadMessage>
      ) : null}

      {coachError ? (
        <ThreadMessage speaker="coach" title="AI coaching unavailable">
          <p className="text-sm leading-6 text-red-700">{coachError}</p>
        </ThreadMessage>
      ) : null}
    </div>
  );
}

function ThreadMessage({
  speaker,
  title,
  children,
  controls
}: {
  speaker: "coach" | "user";
  title: string;
  children: ReactNode;
  controls?: ReactNode;
}) {
  const isCoach = speaker === "coach";

  return (
    <section
      className={`flex gap-3 ${isCoach ? "justify-start" : "justify-end"}`}
    >
      {isCoach ? <Avatar label="Coach" tone="coach" /> : null}

      <div
        className={`w-full max-w-3xl rounded-lg border p-5 shadow-sm ${
          isCoach
            ? "border-black/10 bg-white/80"
            : "border-lake/20 bg-lake/10"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            isCoach ? "text-lake" : "text-ember"
          }`}
        >
          {isCoach ? "Coach" : "You"}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2>
        <div className="mt-4">{children}</div>
        {controls ? <div className="mt-5">{controls}</div> : null}
      </div>

      {isCoach ? null : <Avatar label="You" tone="user" />}
    </section>
  );
}

function Avatar({ label, tone }: { label: string; tone: "coach" | "user" }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
        tone === "coach" ? "bg-mist text-ink" : "bg-lake/18 text-lake"
      }`}
    >
      {label.slice(0, 1)}
    </div>
  );
}

function ChoiceGrid({
  children,
  columns = "three"
}: {
  children: ReactNode;
  columns?: "two" | "three";
}) {
  return (
    <div
      className={`grid gap-3 ${
        columns === "two" ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"
      }`}
    >
      {children}
    </div>
  );
}

function CoachNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/65 bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-lake">{title}</p>
      <p className="mt-2 text-sm leading-6 text-black/70">{body}</p>
    </div>
  );
}
