"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { CoachRequest, CoachResponse } from "@/lib/coach";
import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions,
  roadmapTrackTotals,
  type AppProblem,
  type RoadmapTrack
} from "@/lib/product";
import {
  getAvailableLanguages,
  getStarterCode,
  problemCodeMap,
  type CompareMode,
  type SupportedLanguage
} from "@/lib/problem-code";
import { buildTechniqueBriefs, getSuggestedTechniques } from "@/lib/techniques";
import { usePatternLiftState } from "@/components/patternlift-state";

type PatternId = (typeof patternOptions)[number]["id"];
type CoachStyle = "beginner" | "guided" | "optional" | "off";
type RoadmapFilter = "all" | "official" | RoadmapTrack;
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
  coachStyle = "guided"
}: PracticeWorkspaceProps) {
  const { history } = usePatternLiftState();
  const [problemId, setProblemId] = useState<string>(initialProblemId ?? allProblems[0].id);
  const [problemQuery, setProblemQuery] = useState("");
  const [roadmapFilter, setRoadmapFilter] = useState<RoadmapFilter>("all");
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
  const completedProblemIds = useMemo(
    () => new Set(history.map((item) => item.problemId)),
    [history]
  );

  const problemsByCategory = useMemo(() => {
    return allProblems.reduce<Record<string, AppProblem[]>>((groups, problem) => {
      const current = groups[problem.category] ?? [];
      groups[problem.category] = [...current, problem];
      return groups;
    }, {});
  }, []);

  const filteredProblems = useMemo(() => {
    const normalizedQuery = problemQuery.trim().toLowerCase();

    return allProblems
      .filter((problem) => {
        if (roadmapFilter === "all") return true;
        const meta = getOfficialProblemRoadmapMeta(problem.id);
        if (roadmapFilter === "official") return Boolean(meta);
        return Boolean(meta?.tracks.includes(roadmapFilter));
      })
      .map((problem) => {
        const haystack = [
          problem.title,
          problem.category,
          problem.prompt,
          problem.targetPatternId,
          problem.difficulty
        ]
          .join(" ")
          .toLowerCase();

        const score =
          (problem.title.toLowerCase().includes(normalizedQuery) ? 4 : 0) +
          (problem.category.toLowerCase().includes(normalizedQuery) ? 2 : 0) +
          (problem.prompt.toLowerCase().includes(normalizedQuery) ? 1 : 0) +
          (haystack.includes(normalizedQuery) ? 1 : 0);

        return { problem, score };
      })
      .filter((entry) => (normalizedQuery ? entry.score > 0 : true))
      .sort((left, right) => right.score - left.score || left.problem.title.localeCompare(right.problem.title))
      .slice(0, 8)
      .map((entry) => entry.problem);
  }, [problemQuery, roadmapFilter]);

  const roadmapCoverage = useMemo(() => {
    const tracks: RoadmapTrack[] = ["blind75", "neetcode150"];
    return tracks.map((track) => {
      const included = allProblems.filter((problem) =>
        getOfficialProblemRoadmapMeta(problem.id)?.tracks.includes(track)
      );
      const completed = included.filter((problem) => completedProblemIds.has(problem.id)).length;
      return {
        track,
        includedCount: included.length,
        totalCount: roadmapTrackTotals[track],
        completedCount: completed
      };
    });
  }, [completedProblemIds]);

  const selectedTestCase =
    testCases.find((testCase) => testCase.id === selectedTestCaseId) ?? testCases[0] ?? null;

  const runSummary = useMemo(() => {
    if (!runResults) return null;
    const passed = runResults.filter((result) => result.passed).length;
    return { passed, total: runResults.length };
  }, [runResults]);

  const quickRead = useMemo(() => {
    const normalized = problemText.toLowerCase();
    const signals = [
      normalized.includes("substring") || normalized.includes("subarray")
        ? "This question is talking about a contiguous range, so reused work may matter."
        : null,
      normalized.includes("shortest") || normalized.includes("longest")
        ? "Optimization language usually means you should keep refining one structure instead of restarting."
        : null,
      normalized.includes("tree") || normalized.includes("graph")
        ? "This smells like traversal, so the real distinction is probably depth, levels, or best-path ordering."
        : null,
      normalized.includes("top k") || normalized.includes("k most")
        ? "Ranking language is a strong clue that repeated best-candidate access may matter."
        : null
    ].filter(Boolean) as string[];

    return signals.length > 0
      ? signals
      : [
          "Before solving, ask whether this is mainly about a range, a traversal, or repeated best-choice updates."
        ];
  }, [problemText]);

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

  function chooseProblem(nextProblemId: string) {
    const nextProblem =
      allProblems.find((problem) => problem.id === nextProblemId) ?? allProblems[0];
    setProblemId(nextProblem.id);
  }

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

    try {
      const coachResponse = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coachPayload)
      });

      const data = (await coachResponse.json()) as CoachResponse | { error: string };
      if (!coachResponse.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Unable to load AI coaching.");
      }

      setChatMessages((current) => [
        ...current,
        {
          id: `coach-${Date.now()}`,
          speaker: "coach",
          title: data.headline,
          body: formatCoachReply(data)
        }
      ]);
    } catch (error) {
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <ThreadMessage speaker="coach" title={modeCopy[mode].title}>
        <p className="text-sm leading-7 text-black/72">{modeCopy[mode].body}</p>

        <div className="mt-5 rounded-lg border border-black/10 bg-white/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Coach style</p>
              <p className="mt-1 text-sm leading-6 text-black/62">
                Keep this lightweight if you want, but the interaction stays chat-first.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="min-w-[18rem] flex-1 text-sm text-black/68">
            Search questions
            <input
              value={problemQuery}
              onChange={(event) => setProblemQuery(event.target.value)}
              className="uiverse-field mt-2 block w-full px-3 py-2 text-sm text-ink"
              placeholder="Try: sliding window, binary search, tree, shortest, graph..."
            />
          </label>

          <label className="text-sm text-black/68">
            Sample problem
            <select
              value={problemId}
              onChange={(event) => chooseProblem(event.target.value)}
              className="uiverse-field mt-2 block min-w-64 px-3 py-2 text-sm text-ink"
            >
              {Object.entries(problemsByCategory).map(([category, problems]) => (
                <optgroup key={category} label={category}>
                  {problems.map((problem) => (
                    <option key={problem.id} value={problem.id}>
                      {problem.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setProblemText(activeProblem.prompt);
              setCoachError(null);
            }}
            className="uiverse-button-secondary px-4 py-2 text-sm font-medium"
          >
            Reset question
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {roadmapCoverage.map((coverage) => (
            <div key={coverage.track} className="rounded-lg border border-black/10 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-lake">
                {coverage.track === "blind75" ? "75 Track" : "150 Track"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {coverage.completedCount}/{coverage.includedCount}
              </p>
              <p className="mt-1 text-sm leading-6 text-black/64">
                Completed in app / included here
              </p>
              <p className="mt-2 text-xs text-black/54">
                {coverage.includedCount} of {coverage.totalCount} official roadmap problems currently loaded
              </p>
            </div>
          ))}
          <div className="rounded-lg border border-black/10 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ember">Filters</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { id: "all" as const, label: "All questions" },
                { id: "official" as const, label: "Official only" },
                { id: "blind75" as const, label: "75 track" },
                { id: "neetcode150" as const, label: "150 track" }
              ].map((filterOption) => {
                const isActive = roadmapFilter === filterOption.id;
                return (
                  <button
                    key={filterOption.id}
                    type="button"
                    onClick={() => setRoadmapFilter(filterOption.id)}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? "bg-ink text-white"
                        : "border border-black/10 bg-white text-black/68"
                    }`}
                  >
                    {filterOption.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-black/10 bg-white/88 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Matching questions</p>
            <span className="text-xs font-medium text-black/56">
              {filteredProblems.length} match{filteredProblems.length === 1 ? "" : "es"}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem) => {
                const isActive = problem.id === activeProblem.id;
                const problemMeta = getOfficialProblemRoadmapMeta(problem.id);

                return (
                  <button
                    key={problem.id}
                    type="button"
                    onClick={() => chooseProblem(problem.id)}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-lake/30 bg-lake/10"
                        : "border-black/10 bg-mist hover:border-black/20"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{problem.title}</p>
                      {completedProblemIds.has(problem.id) ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                          Completed
                        </span>
                      ) : null}
                      {problemMeta?.leetcodeNumber ? (
                        <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-black/60">
                          #{problemMeta.leetcodeNumber}
                        </span>
                      ) : null}
                      {problemMeta?.tracks.map((track) => (
                        <span
                          key={`${problem.id}-${track}`}
                          className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-black/60"
                        >
                          {track === "blind75" ? "75" : "150"}
                        </span>
                      ))}
                      <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-black/60">
                        {problem.category}
                      </span>
                      <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-black/60">
                        {problem.difficulty}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/66">
                      {problem.prompt}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-black/14 bg-mist p-4 text-sm leading-6 text-black/60">
                No question matches that search yet. Try a pattern name like <span className="font-semibold text-ink">binary search</span> or a keyword like <span className="font-semibold text-ink">substring</span>.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-black/10 bg-white/90 p-4">
          <p className="text-sm font-semibold text-ink">Problem statement</p>
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
        <p className="whitespace-pre-wrap text-sm leading-7 text-black/78">{problemText}</p>
        {activeRoadmapMeta ? (
          <div className="mt-4 flex flex-wrap gap-2">
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
      </ThreadMessage>

      <ThreadMessage speaker="coach" title="Before we dive in, here’s what stands out to me.">
        <ul className="space-y-2 text-sm leading-6 text-black/72">
          {quickRead.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/66">
            Strongest pattern signal: {correctPattern.label}
          </span>
          <span className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/66">
            Easy to confuse with {contrastPatternLabel}
          </span>
          {suggestedTechniques.slice(0, 2).map((technique) => (
            <span
              key={technique.id}
              className="rounded-full border border-black/10 bg-mist px-3 py-1 text-xs font-medium text-black/66"
            >
              {technique.title}
            </span>
          ))}
        </div>
      </ThreadMessage>

      {chatMessages.map((message) => (
        <ThreadMessage key={message.id} speaker={message.speaker} title={message.title}>
          <p className="whitespace-pre-wrap text-sm leading-7 text-black/74">{message.body}</p>
        </ThreadMessage>
      ))}

      {isCoachLoading ? (
        <ThreadMessage speaker="coach" title="Coach is thinking...">
          <p className="text-sm leading-6 text-black/68">
            I&apos;m reading your last message and shaping the next step.
          </p>
        </ThreadMessage>
      ) : null}

      {coachError ? (
        <ThreadMessage speaker="coach" title="AI coaching unavailable">
          <p className="text-sm leading-6 text-red-700">{coachError}</p>
        </ThreadMessage>
      ) : null}

      <ThreadMessage
        speaker="user"
        title="Reply to the coach"
        controls={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void sendCoachMessage()}
              disabled={coachDraft.trim().length === 0 || isCoachLoading}
              className="uiverse-button px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCoachLoading ? "Sending..." : "Send"}
            </button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-black/72">
          Answer naturally. Tell the coach what pattern you suspect, what feels confusing,
          what first move you want to try, or ask for a hint or code review.
        </p>
        <textarea
          value={coachDraft}
          onChange={(event) => setCoachDraft(event.target.value)}
          rows={4}
          className="uiverse-field mt-3 w-full px-4 py-3 text-sm leading-6 text-ink"
          placeholder={
            mode === "recognize"
              ? "Example: I think this is sliding window because the question talks about a substring, but I’m not sure when the left side should move."
              : mode === "learn"
                ? "Example: I think the pattern is hash map / set because I want fast lookup for complements. My first move would be storing seen values."
                : "Example: I wrote a first pass with two pointers. Can you tell me if that direction makes sense before I go further?"
          }
        />
      </ThreadMessage>

      <ThreadMessage
        speaker="coach"
        title="Code workspace"
        controls={
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
        }
      >
        <div className="space-y-4">
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
              rows={16}
              spellCheck={false}
              className="uiverse-field mt-3 w-full px-4 py-3 font-mono text-sm leading-6 text-ink"
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
      </ThreadMessage>
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

function formatCoachReply(response: CoachResponse) {
  return [
    response.diagnosis,
    `Technique focus: ${response.techniqueFocus}`,
    `Why this fits: ${response.techniqueReason}`,
    `Clue read: ${response.clueFeedback}`,
    `First move: ${response.firstStepFeedback}`,
    `Code direction: ${response.codeReview}`,
    `Brute force first: ${response.bruteForceIdea}`,
    `Cleaner path: ${response.optimalIdea}`,
    `Time complexity: ${response.timeComplexity}`,
    `Space complexity: ${response.spaceComplexity}`,
    `Next hint: ${response.nextHint}`,
    `Next question: ${response.nextQuestion}`,
    `Review later: ${response.reviewQuestion}`,
    response.encouragement
  ].join("\n\n");
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
