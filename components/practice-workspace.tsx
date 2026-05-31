"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CoachRequest } from "@/lib/coach";
import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions
} from "@/lib/product";
import {
  getAvailableLanguages,
  getStarterCode,
  problemCodeMap,
  type CompareMode,
  type SupportedLanguage
} from "@/lib/problem-code";
import { buildTechniqueBriefs, getSuggestedTechniques } from "@/lib/techniques";
import Link from "next/link";

type PatternId = (typeof patternOptions)[number]["id"];
type CoachStyle = "beginner" | "guided" | "optional" | "off";
type ChatMessage = {
  id: string;
  speaker: "coach" | "user";
  title: string;
  body: string;
};

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
  initialProblemId?: string;
  mode?: "learn" | "recognize" | "practice";
  coachStyle?: CoachStyle;
  selectedPatternIds?: string[];
};

type RunResult = {
  label: string;
  passed: boolean;
  actual: string;
  expected: string;
  error?: string;
};

type EditableExample = {
  id: string;
  label: string;
  argsExpression: string;
  expectedExpression: string;
  kind: "built-in" | "custom";
};

const editorLanguages: Array<{ id: SupportedLanguage; label: string }> = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "ruby", label: "Ruby" },
  { id: "c", label: "C" },
  { id: "csharp", label: "C#" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "swift", label: "Swift" },
  { id: "go", label: "Go" },
  { id: "kotlin", label: "Kotlin" }
];

const coachStyles: Array<{ id: CoachStyle; label: string }> = [
  { id: "beginner", label: "Beginner Guided" },
  { id: "guided", label: "Guided" },
  { id: "optional", label: "Hints On Demand" },
  { id: "off", label: "Coach Off" }
];

const modeCopy = {
  learn: {
    title: "Let’s learn this problem step by step.",
    body:
      "Bring your thoughts into the chat, and the coach will react naturally instead of making you tap through a bunch of artificial choices."
  },
  recognize: {
    title: "Let’s pressure-test your pattern instinct.",
    body:
      "Tell the coach what pattern you suspect and why. It should feel like a real back-and-forth, not a checklist."
  },
  practice: {
    title: "Open the problem and practice with the amount of coaching you want.",
    body:
      "Use the editor and tests directly. When you want help, ask for it in the chat like you would with a real coach."
  }
} as const;

export function PracticeWorkspace({
  onComplete,
  initialProblemId,
  mode = "recognize",
  coachStyle = "guided",
  selectedPatternIds = []
}: PracticeWorkspaceProps) {
  const [problemId, setProblemId] = useState<string>(initialProblemId ?? allProblems[0].id);
  const [problemText, setProblemText] = useState(allProblems[0].prompt);
  const [activeCoachStyle, setActiveCoachStyle] = useState<CoachStyle>(coachStyle);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [coachDraft, setCoachDraft] = useState("");
  const [coachError, setCoachError] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [hasLoggedAttempt, setHasLoggedAttempt] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("javascript");
  const [codeByLanguage, setCodeByLanguage] = useState<Record<SupportedLanguage, string>>({
    javascript: "",
    typescript: "",
    python: "",
    ruby: "",
    c: "",
    csharp: "",
    java: "",
    cpp: "",
    swift: "",
    go: "",
    kotlin: ""
  });
  const [runResults, setRunResults] = useState<RunResult[] | null>(null);
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<EditableExample[]>([]);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const activeProblem = useMemo(
    () => allProblems.find((problem) => problem.id === problemId) ?? allProblems[0],
    [problemId]
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
  const activeCodeConfig = problemCodeMap[activeProblem.id];
  const activeRoadmapMeta = getOfficialProblemRoadmapMeta(activeProblem.id);
  const availableLanguages = useMemo(
    () => getAvailableLanguages(activeCodeConfig),
    [activeCodeConfig]
  );

  const selectedTestCase =
    testCases.find((testCase) => testCase.id === selectedTestCaseId) ?? testCases[0] ?? null;

  const runSummary = useMemo(() => {
    if (!runResults) return null;
    const passed = runResults.filter((result) => result.passed).length;
    return { passed, total: runResults.length };
  }, [runResults]);

  const suggestedTechniques = useMemo(
    () =>
      getSuggestedTechniques({
        primaryPatternId: activeProblem.targetPatternId,
        contrastPatternId: activeProblem.contrastPatternId,
        problemPrompt: problemText
      }),
    [activeProblem.contrastPatternId, activeProblem.targetPatternId, problemText]
  );

  useEffect(() => {
    if (initialProblemId && allProblems.some((problem) => problem.id === initialProblemId)) {
      setProblemId(initialProblemId);
    }
  }, [initialProblemId]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [chatMessages, isCoachLoading]);

  useEffect(() => {
    setActiveCoachStyle(coachStyle);
  }, [coachStyle]);

  useEffect(() => {
    setProblemText(activeProblem.prompt);
    setCoachDraft("");
    setCoachError(null);
    setIsCoachLoading(false);
    setHasLoggedAttempt(false);
    setChatMessages([
      buildOpeningMessage({
        mode,
        problemTitle: activeProblem.title,
        correctPatternLabel: correctPattern.label,
        contrastPatternLabel
      })
    ]);
    setCodeByLanguage({
      javascript: getStarterCode(activeCodeConfig, activeProblem.title, "javascript"),
      typescript: getStarterCode(activeCodeConfig, activeProblem.title, "typescript"),
      python: getStarterCode(activeCodeConfig, activeProblem.title, "python"),
      ruby: getStarterCode(activeCodeConfig, activeProblem.title, "ruby"),
      c: getStarterCode(activeCodeConfig, activeProblem.title, "c"),
      csharp: getStarterCode(activeCodeConfig, activeProblem.title, "csharp"),
      java: getStarterCode(activeCodeConfig, activeProblem.title, "java"),
      cpp: getStarterCode(activeCodeConfig, activeProblem.title, "cpp"),
      swift: getStarterCode(activeCodeConfig, activeProblem.title, "swift"),
      go: getStarterCode(activeCodeConfig, activeProblem.title, "go"),
      kotlin: getStarterCode(activeCodeConfig, activeProblem.title, "kotlin")
    });
    setSelectedLanguage((current) =>
      availableLanguages.includes(current) ? current : availableLanguages[0]
    );
    setRunResults(null);
    setRunnerError(null);
    const nextCases =
      activeCodeConfig?.examples.map((example, index) => ({
        id: `${activeProblem.id}-example-${index + 1}`,
        label: example.label,
        argsExpression: example.argsExpression,
        expectedExpression: example.expectedExpression,
        kind: "built-in" as const
      })) ?? [];
    setTestCases(nextCases);
    setSelectedTestCaseId(nextCases[0]?.id ?? null);
  }, [activeCodeConfig, activeProblem, availableLanguages, contrastPatternLabel, correctPattern.label, mode]);

  function updateProblemText(value: string) {
    setProblemText(value);
    setCoachError(null);
  }

  function resetCodeEditor() {
    setCodeByLanguage((current) => ({
      ...current,
      [selectedLanguage]: getStarterCode(activeCodeConfig, activeProblem.title, selectedLanguage)
    }));
    setRunResults(null);
    setRunnerError(null);
  }

  function updateTestCase(
    testCaseId: string,
    field: "argsExpression" | "expectedExpression",
    value: string
  ) {
    setTestCases((current) =>
      current.map((testCase) =>
        testCase.id === testCaseId ? { ...testCase, [field]: value } : testCase
      )
    );
    setRunResults(null);
    setRunnerError(null);
  }

  function addCustomTestCase() {
    const nextId = `${activeProblem.id}-custom-${Date.now()}`;
    const nextCase: EditableExample = {
      id: nextId,
      label: `Custom ${testCases.filter((testCase) => testCase.kind === "custom").length + 1}`,
      argsExpression: selectedTestCase?.argsExpression ?? "[]",
      expectedExpression: selectedTestCase?.expectedExpression ?? "null",
      kind: "custom"
    };
    setTestCases((current) => [...current, nextCase]);
    setSelectedTestCaseId(nextId);
    setRunResults(null);
    setRunnerError(null);
  }

  function removeCustomTestCase(testCaseId: string) {
    setTestCases((current) => {
      const nextCases = current.filter((testCase) => testCase.id !== testCaseId);
      setSelectedTestCaseId((currentId) =>
        currentId === testCaseId ? nextCases[0]?.id ?? null : currentId
      );
      return nextCases;
    });
    setRunResults(null);
    setRunnerError(null);
  }

  async function sendCoachMessage() {
    const userText = coachDraft.trim();
    if (!userText) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      speaker: "user",
      title: "You",
      body: userText
    };

    const updatedHistory = [...chatMessages, userMessage];
    setChatMessages(updatedHistory);
    setCoachDraft("");
    setCoachError(null);

    const selectedPattern = inferPatternFromReply(userText);
    const selectedClues = inferCluesFromReply(userText);
    const selectedFirstStep = inferFirstStepFromReply(userText);
    const score = scoreReply({
      selectedPattern,
      selectedClues,
      selectedFirstStep,
      targetPatternId: activeProblem.targetPatternId,
      recommendedClues: activeProblem.recommendedClues,
      recommendedFirstStep: activeProblem.recommendedFirstStep
    });
    const outcome: AttemptResult["outcome"] =
      score >= 75 ? "solid" : score >= 40 ? "partial" : "confused";

    if (!hasLoggedAttempt) {
      onComplete({
        problemId: activeProblem.id,
        problemTitle: activeProblem.title,
        selectedPatternLabel:
          patternOptions.find((pattern) => pattern.id === selectedPattern)?.label ??
          "Still exploring",
        selectedPatternId: selectedPattern,
        correctPatternLabel: correctPattern.label,
        selectedClues,
        selectedFirstStep,
        learnerNote: userText,
        outcome,
        score,
        feedbackTitle: "Coach conversation started",
        feedbackBody: userText,
        reviewQuestion: activeProblem.reviewQuestion,
        weakPatternLabel: correctPattern.label,
        contrastPatternLabel
      });
      setHasLoggedAttempt(true);
    }

    if (activeCoachStyle === "off") {
      setChatMessages((current) => [
        ...current,
        {
          id: `coach-off-${Date.now()}`,
          speaker: "coach",
          title: "Coach is off",
          body: "Turn the coach back on when you want a real response here. You can keep coding and running tests below in the meantime."
        }
      ]);
      return;
    }

    const coachPayload: CoachRequest = {
      studyMode: mode,
      coachStyle: activeCoachStyle,
      problemTitle: activeProblem.title,
      problemPrompt: problemText,
      userResponse: userText,
      conversationHistory: updatedHistory.map((message) => ({
        speaker: message.speaker,
        text: message.body
      })),
      selectedPatternLabel:
        patternOptions.find((pattern) => pattern.id === selectedPattern)?.label ??
        "Still exploring",
      correctPatternLabel: correctPattern.label,
      contrastPatternLabel,
      suggestedTechniques: buildTechniqueBriefs(suggestedTechniques),
      selectedClues,
      selectedFirstStep,
      learnerNote: userText,
      currentCode: codeByLanguage[selectedLanguage],
      localOutcome: outcome,
      localScore: score,
      reviewQuestion: activeProblem.reviewQuestion
    };

    setIsCoachLoading(true);

    const streamingCoachId = `coach-${Date.now()}`;
    setChatMessages((current) => [
      ...current,
      {
        id: streamingCoachId,
        speaker: "coach",
        title: "Coach",
        body: ""
      }
    ]);

    try {
      const coachResponse = await fetch("/api/coach/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coachPayload)
      });

      if (!coachResponse.ok || !coachResponse.body) {
        const errorText = (await coachResponse.text()) || "Unable to load AI coaching.";
        throw new Error(errorText);
      }

      const reader = coachResponse.body.getReader();
      const decoder = new TextDecoder();
      let coachReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        coachReply += decoder.decode(value, { stream: true });
        setChatMessages((current) =>
          current.map((message) =>
            message.id === streamingCoachId ? { ...message, body: coachReply } : message
          )
        );
      }

      coachReply += decoder.decode();
      const finalReply = coachReply.trim();
      if (!finalReply) {
        throw new Error("The coach did not send a reply. Please try again.");
      }

      setChatMessages((current) =>
        current.map((message) =>
          message.id === streamingCoachId
            ? { ...message, body: finalReply }
            : message
        )
      );
    } catch (error) {
      setChatMessages((current) =>
        current.filter((message) => message.id !== streamingCoachId)
      );
      setCoachError(
        error instanceof Error ? error.message : "Unable to load AI coaching right now."
      );
    } finally {
      setIsCoachLoading(false);
    }
  }

  function runExamples() {
    if (!activeCodeConfig) {
      setRunnerError("This problem does not have a starter template yet.");
      setRunResults(null);
      return;
    }

    void executeExamples();
  }

  async function executeExamples() {
    if (!activeCodeConfig) return;

    try {
      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          code: codeByLanguage[selectedLanguage],
          functionName: activeCodeConfig.functionName,
          signature: activeCodeConfig.signature,
          compareMode: activeCodeConfig.compareMode ?? "strict",
          examples: testCases.map((testCase) => ({
            label: testCase.label,
            argsExpression: testCase.argsExpression,
            expectedExpression: testCase.expectedExpression
          }))
        })
      });

      const data = (await response.json()) as
        | { results: { label: string; actual: unknown; expected: unknown }[] }
        | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Unable to run the current code.");
      }

      const results = data.results.map((result) => ({
        label: result.label,
        passed: compareValues(
          result.actual,
          result.expected,
          activeCodeConfig.compareMode ?? "strict"
        ),
        actual: formatValue(result.actual),
        expected: formatValue(result.expected)
      }));

      setRunResults(results);
      setRunnerError(null);
    } catch (error) {
      setRunnerError(
        error instanceof Error ? error.message : "Unable to run the current code."
      );
      setRunResults(null);
    }
  }

  const selectionBackHref = useMemo(() => {
    if (mode === "practice" || mode === "recognize") {
      const params = new URLSearchParams();
      params.set("mode", mode);
      params.set("coach", activeCoachStyle);
      return `/practice/select?${params.toString()}`;
    }

    const params = new URLSearchParams();
    params.set("coach", activeCoachStyle);
    if (selectedPatternIds.length > 0) {
      params.set("patterns", selectedPatternIds.join(","));
    }
    return `/learn?${params.toString()}`;
  }, [activeCoachStyle, mode, selectedPatternIds]);

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4">
      <section className="uiverse-panel px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">
              {mode === "learn" ? "Learning workspace" : mode === "recognize" ? "Recognition workspace" : "Practice workspace"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              {activeProblem.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/68">{modeCopy[mode].body}</p>
          </div>

          <Link href={selectionBackHref} className="coach-chip px-4 py-3 text-sm font-medium text-black/66">
            Choose another problem
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/66">
            Coach style
          </span>
          {coachStyles.map((style) => {
            const isActive = activeCoachStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setActiveCoachStyle(style.id)}
                className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? "bg-ink text-white"
                    : "border border-black/10 bg-white text-black/68"
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <section className="uiverse-panel flex min-h-[78vh] flex-col overflow-hidden xl:h-[calc(100vh-8.5rem)]">
          <div className="border-b border-black/8 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">
              Coach chat
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-[1.45rem] font-semibold leading-tight text-ink">
                {activeProblem.title}
              </p>
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/66">
                {mode === "learn"
                  ? "Learning mode"
                  : mode === "recognize"
                    ? "Recognition mode"
                    : "Practice mode"}
              </span>
            </div>
            {activeRoadmapMeta ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {activeRoadmapMeta.leetcodeNumber ? (
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/68">
                    LeetCode #{activeRoadmapMeta.leetcodeNumber}
                  </span>
                ) : null}
                {activeRoadmapMeta.tracks.map((track) => (
                  <span
                    key={`${activeProblem.id}-${track}`}
                    className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/68"
                  >
                    {track === "blind75" ? "Blind 75" : "NeetCode 150"}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/66">
                Strongest pattern: {correctPattern.label}
              </span>
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/66">
                Easy to confuse with {contrastPatternLabel}
              </span>
            </div>
            {suggestedTechniques.length > 0 ? (
              <details className="mt-2 rounded-lg border border-black/8 bg-white/70 px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-black/70">
                  Learning context
                </summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedTechniques.slice(0, 4).map((technique) => (
                    <span
                      key={technique.id}
                      className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/66"
                    >
                      {technique.title}
                    </span>
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <div
            ref={chatScrollRef}
            className="min-h-[26rem] flex-[1_1_0] space-y-4 overflow-y-auto px-5 py-5 overscroll-contain"
          >
            {chatMessages.map((message) => (
              <ThreadMessage key={message.id} speaker={message.speaker} title={message.title}>
                <p className="whitespace-pre-wrap text-lg leading-9 text-black/76">{message.body}</p>
              </ThreadMessage>
            ))}

            {isCoachLoading ? (
              <ThreadMessage speaker="coach" title="Coach is thinking...">
                <p className="text-lg leading-8 text-black/68">
                  I&apos;m reading your last message and shaping the next step.
                </p>
              </ThreadMessage>
            ) : null}

            {coachError ? (
              <ThreadMessage speaker="coach" title="AI coaching unavailable">
                <p className="text-lg leading-8 text-red-700">{coachError}</p>
              </ThreadMessage>
            ) : null}
          </div>

          <div className="border-t border-black/8 bg-white/92 px-5 py-3">
            <div className="coach-input-shell">
              <textarea
                value={coachDraft}
                onChange={(event) => setCoachDraft(event.target.value)}
                rows={2}
                className="w-full resize-none border-0 bg-transparent text-lg leading-8 text-ink outline-none placeholder:text-black/34"
                placeholder={
                  mode === "recognize"
                    ? "Tell the coach what pattern you suspect, what clues led you there, or what feels ambiguous."
                    : mode === "learn"
                      ? "Tell the coach what seems confusing, what first move you want to try, or ask for a nudge."
                      : "Ask for a hint, a sanity check on your approach, or feedback on your code direction."
                }
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-black/48">
                  Ask naturally. The coach will react to what you actually say.
                </p>
                <button
                  type="button"
                  onClick={() => void sendCoachMessage()}
                  disabled={coachDraft.trim().length === 0 || isCoachLoading}
                  className="uiverse-button px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCoachLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="uiverse-panel flex min-h-[78vh] flex-col overflow-hidden xl:h-[calc(100vh-8.5rem)]">
          <div className="border-b border-black/8 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">
                  Code workspace
                </p>
                <p className="mt-2 text-sm leading-6 text-black/64">
                  Keep the conversation on the left and your implementation on the right.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runExamples}
                  className="uiverse-button px-4 py-2 text-sm font-medium"
                >
                  Run examples
                </button>
                <button
                  type="button"
                  onClick={resetCodeEditor}
                  className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
                >
                  Reset starter code
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-4">
          <details className="rounded-lg border border-black/10 bg-white/90 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Problem statement
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-black/72">
              {problemText}
            </p>
          </details>

          <div className="rounded-lg border border-black/10 bg-white/92 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {editorLanguages.find((language) => language.id === selectedLanguage)?.label} starter
              </p>
              {activeCodeConfig ? (
                <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/68">
                  {activeCodeConfig.functionName}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {editorLanguages
                .filter((language) => availableLanguages.includes(language.id))
                .map((language) => {
                  const isActive = selectedLanguage === language.id;

                  return (
                    <button
                      key={language.id}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(language.id);
                        setRunResults(null);
                        setRunnerError(null);
                      }}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-ink text-white"
                          : "border border-black/10 bg-white text-black/70"
                      }`}
                    >
                      {language.label}
                    </button>
                  );
                })}
            </div>
            <textarea
              value={codeByLanguage[selectedLanguage]}
              onChange={(event) => {
                setCodeByLanguage((current) => ({
                  ...current,
                  [selectedLanguage]: event.target.value
                }));
                setRunResults(null);
                setRunnerError(null);
              }}
              rows={26}
              spellCheck={false}
              className="uiverse-field mt-3 w-full px-4 py-4 font-mono text-[15px] leading-7 text-ink"
            />
          </div>

          {activeCodeConfig ? (
            <div className="rounded-lg border border-black/10 bg-white/88 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Test case panel</p>
                <button
                  type="button"
                  onClick={addCustomTestCase}
                  className="uiverse-button-secondary px-3 py-2 text-xs font-medium"
                >
                  Add custom case
                </button>
              </div>
              {runSummary ? (
                <div className="mt-3 rounded-lg border border-black/10 bg-mist p-3 text-sm text-black/68">
                  Passed {runSummary.passed} of {runSummary.total} cases
                </div>
              ) : null}
              <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-2">
                  {testCases.map((testCase) => {
                    const result = runResults?.find((entry) => entry.label === testCase.label);
                    const isActive = selectedTestCase?.id === testCase.id;
                    return (
                      <button
                        key={testCase.id}
                        type="button"
                        onClick={() => setSelectedTestCaseId(testCase.id)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                          isActive ? "border-lake/30 bg-lake/10" : "border-black/10 bg-mist"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">{testCase.label}</p>
                          {result ? (
                            <span
                              className={`text-xs font-semibold ${
                                result.passed ? "text-emerald-700" : "text-amber-700"
                              }`}
                            >
                              {result.passed ? "Passed" : "Failed"}
                            </span>
                          ) : testCase.kind === "custom" ? (
                            <span className="text-xs font-semibold text-black/50">Custom</span>
                          ) : null}
                        </div>
                        <p className="mt-2 line-clamp-2 font-mono text-xs leading-5 text-black/62">
                          {testCase.argsExpression}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {selectedTestCase ? (
                  <div className="rounded-lg border border-black/10 bg-white/92 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">{selectedTestCase.label}</p>
                      {selectedTestCase.kind === "custom" ? (
                        <button
                          type="button"
                          onClick={() => removeCustomTestCase(selectedTestCase.id)}
                          className="text-xs font-medium text-ember"
                        >
                          Remove custom case
                        </button>
                      ) : null}
                    </div>
                    <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-black/56">
                      Args expression
                      <textarea
                        value={selectedTestCase.argsExpression}
                        onChange={(event) =>
                          updateTestCase(selectedTestCase.id, "argsExpression", event.target.value)
                        }
                        rows={4}
                        spellCheck={false}
                        className="uiverse-field mt-2 w-full px-3 py-2 font-mono text-xs leading-6 text-ink"
                      />
                    </label>
                    <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-black/56">
                      Expected expression
                      <textarea
                        value={selectedTestCase.expectedExpression}
                        onChange={(event) =>
                          updateTestCase(
                            selectedTestCase.id,
                            "expectedExpression",
                            event.target.value
                          )
                        }
                        rows={4}
                        spellCheck={false}
                        className="uiverse-field mt-2 w-full px-3 py-2 font-mono text-xs leading-6 text-ink"
                      />
                    </label>
                    {runResults?.find((entry) => entry.label === selectedTestCase.label) ? (
                      <div className="mt-4 rounded-lg border border-black/10 bg-mist p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-lake">
                          Last run
                        </p>
                        <p className="mt-2 font-mono text-xs leading-6 text-black/72">
                          actual: {runResults.find((entry) => entry.label === selectedTestCase.label)?.actual}
                        </p>
                        <p className="mt-1 font-mono text-xs leading-6 text-black/72">
                          expected: {runResults.find((entry) => entry.label === selectedTestCase.label)?.expected}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-black/14 bg-mist p-4 text-sm leading-6 text-black/60">
              This question is part of the roadmap, but it doesn&apos;t have a native starter template yet. You can still talk through it with the coach and use the official problem links above.
            </div>
          )}

          {runnerError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {runnerError}
            </div>
          ) : null}

          {runResults ? (
            <div className="rounded-lg border border-black/10 bg-white/88 p-4">
              <p className="text-sm font-semibold text-ink">Run results</p>
              <div className="mt-3 space-y-3">
                {runResults.map((result) => (
                  <div
                    key={result.label}
                    className={`rounded-lg border p-3 ${
                      result.passed
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">{result.label}</p>
                      <span className="text-xs font-semibold uppercase tracking-wide text-black/60">
                        {result.passed ? "Passed" : "Needs work"}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-xs leading-6 text-black/72">
                      actual: {result.actual}
                    </p>
                    <p className="mt-1 font-mono text-xs leading-6 text-black/72">
                      expected: {result.expected}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function buildOpeningMessage({
  mode,
  problemTitle,
  correctPatternLabel,
  contrastPatternLabel
}: {
  mode: "learn" | "recognize" | "practice";
  problemTitle: string;
  correctPatternLabel: string;
  contrastPatternLabel: string;
}): ChatMessage {
  if (mode === "recognize") {
    return {
      id: `coach-open-${problemTitle}`,
      speaker: "coach",
      title: "Coach",
      body: `For ${problemTitle}, tell me what pattern you suspect and what words in the question pushed you there. If you're torn, tell me what feels like ${correctPatternLabel} and what feels like ${contrastPatternLabel}.`
    };
  }

  if (mode === "practice") {
    return {
      id: `coach-open-${problemTitle}`,
      speaker: "coach",
      title: "Coach",
      body: `For ${problemTitle}, tell me what you want from me first: pattern check, hint, code review, brute-force idea, or the cleaner path.`
    };
  }

  return {
    id: `coach-open-${problemTitle}`,
    speaker: "coach",
    title: "Coach",
    body: `Let’s learn ${problemTitle} together. Tell me what pattern you think this is, what feels confusing, or what first move you want to try, and I’ll build from there.`
  };
}

function inferPatternFromReply(text: string): PatternId | null {
  const normalized = text.toLowerCase();
  let bestMatch: { id: PatternId; score: number } | null = null;

  for (const pattern of patternOptions) {
    let score = 0;
    const labelWords = pattern.label.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

    for (const word of labelWords) {
      if (word.length > 2 && normalized.includes(word)) score += 2;
    }

    for (const clue of pattern.clues) {
      if (normalized.includes(clue.toLowerCase())) score += 3;
    }

    const shortName = pattern.id.replace(/-/g, " ");
    if (normalized.includes(shortName)) score += 3;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { id: pattern.id, score };
    }
  }

  return bestMatch && bestMatch.score > 0 ? bestMatch.id : null;
}

function inferCluesFromReply(text: string) {
  const normalized = text.toLowerCase();
  return patternOptions
    .flatMap((pattern) => pattern.clues)
    .filter((clue, index, clues) => clues.indexOf(clue) === index)
    .filter((clue) => normalized.includes(clue.toLowerCase()));
}

function inferFirstStepFromReply(text: string) {
  const normalized = text.toLowerCase();
  const candidates = [
    "Store values in a hash map or set",
    "Track left and right pointers",
    "Set a left/right search interval and test the midpoint",
    "Push candidates onto a stack and pop when the rule breaks",
    "Maintain a running sum or frequency state",
    "Use a queue for level order expansion",
    "Go deeper recursively before trying alternatives",
    "Push candidates into a heap",
    "Sort intervals, then compare and merge boundaries",
    "Define a DP state and recurrence",
    "Sort or scan for the best safe local choice"
  ];

  return (
    candidates.find((step) => {
      const words = step.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
      return words.some((word) => normalized.includes(word));
    }) ?? null
  );
}

function scoreReply({
  selectedPattern,
  selectedClues,
  selectedFirstStep,
  targetPatternId,
  recommendedClues,
  recommendedFirstStep
}: {
  selectedPattern: PatternId | null;
  selectedClues: string[];
  selectedFirstStep: string | null;
  targetPatternId: PatternId;
  recommendedClues: string[];
  recommendedFirstStep: string;
}) {
  const matchedClues = selectedClues.filter((clue) => recommendedClues.includes(clue)).length;
  const patternCorrect = selectedPattern === targetPatternId;
  const stepCorrect = selectedFirstStep === recommendedFirstStep;

  let score = 0;
  if (patternCorrect) score += 50;
  score += Math.min(matchedClues * 15, 30);
  if (stepCorrect) score += 20;
  return score;
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
    <section className={`flex gap-3 ${isCoach ? "justify-start" : "justify-end"}`}>
      {isCoach ? <Avatar label="Coach" tone="coach" /> : null}

      <div
        className={`w-full max-w-3xl rounded-lg border p-5 shadow-sm ${
          isCoach ? "border-black/10 bg-white/80" : "border-lake/20 bg-lake/10"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            isCoach ? "text-lake" : "text-ember"
          }`}
        >
          {isCoach ? "Coach" : "You"}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">{title}</h2>
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
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold shadow-sm ${
        tone === "coach"
          ? "border-coral/18 bg-coral text-white"
          : "border-black/10 bg-white text-ink"
      }`}
    >
      {label.slice(0, 1)}
    </div>
  );
}

function formatValue(value: unknown) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return JSON.stringify(value);
}

function compareValues(actual: unknown, expected: unknown, mode: CompareMode) {
  switch (mode) {
    case "unordered-number-array":
      return compareNormalized(actual, expected, sortPrimitiveArray);
    case "unordered-string-array":
      return compareNormalized(actual, expected, sortPrimitiveArray);
    case "unordered-point-array":
      return compareNormalized(actual, expected, sortPointArray);
    case "unordered-nested-array":
      return compareNormalized(actual, expected, sortNestedArray);
    default:
      return JSON.stringify(actual) === JSON.stringify(expected);
  }
}

function compareNormalized(
  actual: unknown,
  expected: unknown,
  normalizer: (value: unknown) => unknown
) {
  return JSON.stringify(normalizer(actual)) === JSON.stringify(normalizer(expected));
}

function sortPrimitiveArray(value: unknown) {
  if (!Array.isArray(value)) return value;
  return [...value].sort();
}

function sortPointArray(value: unknown) {
  if (!Array.isArray(value)) return value;
  return [...value]
    .map((entry) => (Array.isArray(entry) ? [...entry] : entry))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function sortNestedArray(value: unknown) {
  if (!Array.isArray(value)) return value;

  return [...value]
    .map((entry) =>
      Array.isArray(entry) ? [...entry].sort((left, right) => Number(left) - Number(right)) : entry
    )
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}
