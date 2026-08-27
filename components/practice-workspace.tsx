"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { parseCoachAgentStream, type CoachRequest } from "@/lib/coach";
import { compareValues } from "@/lib/compare-values";
import {
  allProblems,
  patternOptions
} from "@/lib/product";
import {
  getAvailableLanguages,
  getProblemCodeConfig,
  getStarterCode,
  hasNativeProblemCodeConfig,
  type CompareMode,
  type SupportedLanguage
} from "@/lib/problem-code";
import { buildTechniqueBriefs, getSuggestedTechniques } from "@/lib/techniques";
import Link from "next/link";
import { AudioWaveform } from "@/components/audio-waveform";
import { runPythonInBrowser } from "@/lib/browser-python-runner";

type PatternId = (typeof patternOptions)[number]["id"];
type CoachStyle = "beginner" | "guided" | "optional" | "off";
type ChatMessage = {
  id: string;
  speaker: "coach" | "user";
  title: string;
  body: string;
  toolTrace?: string[];
};

const coachToolLabels: Record<string, string> = {
  get_technique_detail: "Reviewing technique notes",
  get_mastery_snapshot: "Checking your mastery data",
  list_similar_problems: "Scanning the problem bank"
};

function coachToolLabel(name: string) {
  return coachToolLabels[name] ?? "Looking something up";
}

type InlineCoachHint = {
  id: string;
  lineNumber: number;
  sourceLine: string;
  kind: "feedback" | "question" | "voice";
  status: "listening" | "loading" | "streaming" | "ready" | "error";
  text: string;
  prompt?: string;
};

type WorkspaceContextPanel = "coach" | "problem" | "tests" | "approaches";

type ApproachTier = {
  name: string;
  idea: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  verified: boolean;
};

type ProblemExample = {
  input: string;
  output: string;
  explanation: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

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
  hintsUsed: number;
  codePassed: boolean | null;
  confidence: 1 | 2 | 3;
  explanationScore: number;
  confusedWith: string | null;
  inputMethod: "text" | "voice";
};

type PracticeWorkspaceProps = {
  onComplete: (result: AttemptResult) => void;
  initialProblemId?: string;
  mode?: "learn" | "recognize" | "practice";
  coachStyle?: CoachStyle;
  selectedPatternIds?: string[];
  quickStart?: boolean;
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
  { id: "guided", label: "Adaptive" },
  { id: "beginner", label: "Step-by-step" },
  { id: "optional", label: "On demand" }
];

const monacoLanguageMap: Record<SupportedLanguage, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  ruby: "ruby",
  c: "c",
  csharp: "csharp",
  java: "java",
  cpp: "cpp",
  swift: "swift",
  go: "go",
  kotlin: "kotlin"
};

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
  selectedPatternIds = [],
  quickStart = false
}: PracticeWorkspaceProps) {
  const [problemId, setProblemId] = useState<string>(initialProblemId ?? allProblems[0].id);
  const [problemText, setProblemText] = useState(allProblems[0].prompt);
  const [activeCoachStyle, setActiveCoachStyle] = useState<CoachStyle>(coachStyle);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [coachDraft, setCoachDraft] = useState("");
  const [coachError, setCoachError] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [activeCoachTool, setActiveCoachTool] = useState<string | null>(null);
  const [isCoachPanelOpen, setIsCoachPanelOpen] = useState(false);
  const [showQuickStartGuide, setShowQuickStartGuide] = useState(quickStart);
  const [activeContextPanel, setActiveContextPanel] = useState<WorkspaceContextPanel>("coach");
  const [isContextPanelCollapsed, setIsContextPanelCollapsed] = useState(false);
  const [editorVoiceState, setEditorVoiceState] = useState<"idle" | "listening" | "thinking">("idle");
  const [isBeginnerLineCoachLoading, setIsBeginnerLineCoachLoading] = useState(false);
  const [inlineCoachHints, setInlineCoachHints] = useState<InlineCoachHint[]>([]);
  const [editorReadyVersion, setEditorReadyVersion] = useState(0);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "transcribing">(
    "idle"
  );
  const [voiceStream, setVoiceStream] = useState<MediaStream | null>(null);
  const [hasLoggedAttempt, setHasLoggedAttempt] = useState(false);
  const [loggedOutcome, setLoggedOutcome] = useState<AttemptResult["outcome"] | null>(null);
  const [confidence, setConfidence] = useState<1 | 2 | 3>(2);
  const [nextInputMethod, setNextInputMethod] = useState<"text" | "voice">("text");
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("python");
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
  const [approaches, setApproaches] = useState<ApproachTier[] | null>(null);
  const [approachesError, setApproachesError] = useState<string | null>(null);
  const [approachesLoading, setApproachesLoading] = useState(false);
  const [problemExamples, setProblemExamples] = useState<ProblemExample[]>([]);
  const [problemConstraints, setProblemConstraints] = useState<string[]>([]);
  const [problemStatementLoading, setProblemStatementLoading] = useState(false);
  const [problemStatementError, setProblemStatementError] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [testCases, setTestCases] = useState<EditableExample[]>([]);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const moreMenuRef = useRef<HTMLDetailsElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const codeEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const coachDecorationIdsRef = useRef<string[]>([]);
  const lastInlineRequestRef = useRef<string | null>(null);
  const editorSpeechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const liveVoiceTranscriptRef = useRef("");
  const liveVoiceFinalRef = useRef("");
  const liveVoiceLineRef = useRef(1);
  const liveVoiceHintIdRef = useRef("");
  const liveVoiceSubmittedRef = useRef(false);
  const liveVoiceSilenceTimerRef = useRef<number | null>(null);
  const voiceInputTargetRef = useRef<"drawer" | "inline">("drawer");
  const activeProblemIdRef = useRef(problemId);

  const activeProblem = useMemo(
    () => allProblems.find((problem) => problem.id === problemId) ?? allProblems[0],
    [problemId]
  );
  activeProblemIdRef.current = activeProblem.id;
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
  const activeCodeConfig = useMemo(
    () => getProblemCodeConfig(activeProblem),
    [activeProblem]
  );
  const hasNativeCodeConfig = hasNativeProblemCodeConfig(activeProblem.id);
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

  const approachesUnlocked = hasLoggedAttempt || runResults !== null;

  async function loadApproaches() {
    if (approaches || approachesLoading) return;
    setApproachesLoading(true);
    setApproachesError(null);
    try {
      const response = await fetch(`/api/problems/${activeProblem.id}/approaches`);
      const payload = (await response.json()) as { approaches?: ApproachTier[]; error?: string };
      if (!response.ok || !payload.approaches) {
        throw new Error(payload.error || "Unable to load approaches right now.");
      }
      setApproaches(payload.approaches);
    } catch (error) {
      setApproachesError(error instanceof Error ? error.message : "Unable to load approaches right now.");
    } finally {
      setApproachesLoading(false);
    }
  }

  const loadProblemStatement = useCallback(async (problemId: string, problemIsNative: boolean) => {
    if (problemIsNative) return;
    setProblemStatementLoading(true);
    setProblemStatementError(null);
    try {
      const response = await fetch(`/api/problems/${problemId}/statement`);
      const payload = (await response.json()) as {
        statement?: { summary: string; examples: ProblemExample[]; constraints: string[] };
        error?: string;
      };
      if (!response.ok || !payload.statement) {
        throw new Error(payload.error || "Unable to load the problem statement right now.");
      }
      if (activeProblemIdRef.current !== problemId) return;
      setProblemText(payload.statement.summary);
      setProblemExamples(payload.statement.examples);
      setProblemConstraints(payload.statement.constraints);
      if (payload.statement.examples.length > 0) {
        setTestCases(
          payload.statement.examples.slice(0, 3).map((example, index) => ({
            id: `${problemId}-real-example-${index + 1}`,
            label: `Example ${index + 1}`,
            argsExpression: JSON.stringify([example.input]),
            expectedExpression: JSON.stringify(example.output),
            kind: "built-in" as const
          }))
        );
        setSelectedTestCaseId(`${problemId}-real-example-1`);
      }
    } catch (error) {
      if (activeProblemIdRef.current !== problemId) return;
      setProblemStatementError(
        error instanceof Error ? error.message : "Unable to load the problem statement right now."
      );
    } finally {
      if (activeProblemIdRef.current === problemId) setProblemStatementLoading(false);
    }
  }, []);

  useEffect(() => {
    setProblemExamples([]);
    setProblemConstraints([]);
    setProblemStatementError(null);
    void loadProblemStatement(activeProblem.id, hasNativeCodeConfig);
  }, [activeProblem.id, hasNativeCodeConfig, loadProblemStatement]);

  useEffect(() => {
    function closeMoreMenuOnOutsideInteraction(event: MouseEvent | KeyboardEvent) {
      const menu = moreMenuRef.current;
      if (!menu || !menu.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") menu.open = false;
        return;
      }
      if (event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false;
      }
    }
    document.addEventListener("click", closeMoreMenuOnOutsideInteraction);
    document.addEventListener("keydown", closeMoreMenuOnOutsideInteraction);
    return () => {
      document.removeEventListener("click", closeMoreMenuOnOutsideInteraction);
      document.removeEventListener("keydown", closeMoreMenuOnOutsideInteraction);
    };
  }, []);

  const activeInlineCoachHint = inlineCoachHints[inlineCoachHints.length - 1] ?? null;

  useEffect(() => {
    if (!activeInlineCoachHint) return;
    setShowQuickStartGuide(false);
    setActiveContextPanel("coach");
    setIsContextPanelCollapsed(false);
  }, [activeInlineCoachHint]);

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
    setInlineCoachHints([]);
    lastInlineRequestRef.current = null;
    setHasLoggedAttempt(false);
    setConfidence(2);
    setNextInputMethod("text");
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
    setApproaches(null);
    setApproachesError(null);
    setApproachesLoading(false);
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

  function handleEditorMount(monaco: Monaco) {
    monaco.editor.defineTheme("patternlift-ide", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "D9485F", fontStyle: "bold" },
        { token: "string", foreground: "1F7A6B" },
        { token: "number", foreground: "7A56D9" },
        { token: "comment", foreground: "8B7E74", fontStyle: "italic" },
        { token: "type.identifier", foreground: "276EF1" },
        { token: "delimiter.bracket", foreground: "52443D" }
      ],
      colors: {
        "editor.background": "#FFFDF9",
        "editor.foreground": "#171412",
        "editorLineNumber.foreground": "#C6B7AB",
        "editorLineNumber.activeForeground": "#7F685C",
        "editorCursor.foreground": "#FF5C5C",
        "editor.selectionBackground": "#FDD7D7",
        "editor.inactiveSelectionBackground": "#F7E6E1",
        "editor.lineHighlightBackground": "#FFF3EC",
        "editorIndentGuide.background1": "#EADFD7",
        "editorIndentGuide.activeBackground1": "#D3BEB2"
      }
    });
  }

  const handleEditorReady: OnMount = (editor, monaco) => {
    codeEditorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReadyVersion((current) => current + 1);
  };

  function beginQuickStart() {
    setShowQuickStartGuide(false);
    codeEditorRef.current?.focus();
  }

  useEffect(() => {
    const editor = codeEditorRef.current;
    const model = editor?.getModel();
    const monaco = monacoRef.current;
    if (!editor || !model || !monaco) return;

    const decorations = inlineCoachHints
      .filter((hint) => hint.lineNumber <= model.getLineCount())
      .map((hint) => ({
        range: new monaco.Range(hint.lineNumber, 1, hint.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: `coach-line-highlight coach-line-highlight-${hint.status}`,
          linesDecorationsClassName: "coach-line-glyph"
        }
      }));

    coachDecorationIdsRef.current = editor.deltaDecorations(
      coachDecorationIdsRef.current,
      decorations
    );

    return () => {
      coachDecorationIdsRef.current = editor.deltaDecorations(coachDecorationIdsRef.current, []);
    };
  }, [editorReadyVersion, inlineCoachHints]);

  useEffect(() => {
    return () => {
      clearLiveVoiceSilenceTimer();
      editorSpeechRecognitionRef.current?.abort();
      mediaRecorderRef.current?.stop();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
    setInlineCoachHints([]);
    lastInlineRequestRef.current = null;
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
    const hasPassingRun = runSummary ? runSummary.passed === runSummary.total : false;
    // A passing run is strong, objective evidence the learner isn't
    // "confused" even if this particular message didn't name the pattern -
    // don't let a keyword-matching miss overrule code that already works.
    const outcome: AttemptResult["outcome"] =
      score >= 75 ? "solid" : score >= 40 || hasPassingRun ? "partial" : "confused";
    const selectedPatternLabel =
      patternOptions.find((pattern) => pattern.id === selectedPattern)?.label ??
      "Still exploring";
    const hintsUsed = chatMessages.filter(
      (message, index) => message.speaker === "coach" && index > 0
    ).length;
    const codePassed = runSummary ? runSummary.passed === runSummary.total : null;
    const inputMethod = nextInputMethod;
    const hasAttemptEvidence =
      selectedPattern !== null || selectedClues.length > 0 || selectedFirstStep !== null;

    if (!hasLoggedAttempt && hasAttemptEvidence) {
      onComplete({
        problemId: activeProblem.id,
        problemTitle: activeProblem.title,
        selectedPatternLabel,
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
        contrastPatternLabel,
        hintsUsed,
        codePassed,
        confidence,
        explanationScore: score,
        confusedWith:
          selectedPatternLabel !== correctPattern.label && selectedPatternLabel !== "Still exploring"
            ? selectedPatternLabel
            : null,
        inputMethod
      });
      setHasLoggedAttempt(true);
      setLoggedOutcome(outcome);
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
      selectedPatternLabel,
      correctPatternLabel: correctPattern.label,
      contrastPatternLabel,
      suggestedTechniques: buildTechniqueBriefs(suggestedTechniques),
      selectedClues,
      selectedFirstStep,
      learnerNote: userText,
      currentCode: codeByLanguage[selectedLanguage],
      localOutcome: outcome,
      localScore: score,
      reviewQuestion: activeProblem.reviewQuestion,
      inputMethod,
      learnerConfidence: confidence,
      problemId: activeProblem.id,
      patternId: correctPattern.id,
      contrastPatternId: contrastPattern?.id
    };

    setIsCoachLoading(true);
    setActiveCoachTool(null);
    setNextInputMethod("text");

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
      const coachResponse = await fetch("/api/coach/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coachPayload)
      });

      if (!coachResponse.ok) {
        throw new Error("Unable to load AI coaching.");
      }

      let coachReply = "";

      for await (const event of parseCoachAgentStream(coachResponse)) {
        if (event.type === "tool_call") {
          setActiveCoachTool(event.name);
        } else if (event.type === "text_delta") {
          coachReply += event.text;
          setActiveCoachTool(null);
          setChatMessages((current) =>
            current.map((message) =>
              message.id === streamingCoachId ? { ...message, body: coachReply } : message
            )
          );
        } else if (event.type === "done") {
          setChatMessages((current) =>
            current.map((message) =>
              message.id === streamingCoachId
                ? { ...message, toolTrace: event.toolTrace }
                : message
            )
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

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
      setActiveCoachTool(null);
    }
  }

  const sendInlineLineFeedback = useCallback(async (
    codeSnapshot: string,
    completedLine: string,
    lineNumber: number,
    kind: "feedback" | "question" | "voice",
    options?: { questionText?: string; hintId?: string }
  ) => {
    if (activeCoachStyle === "off") return;
    const automaticInlineEnabled = activeCoachStyle === "beginner" || activeCoachStyle === "guided";
    if (kind === "feedback" && !automaticInlineEnabled) return;
    if (kind === "feedback" && activeCoachStyle === "guided" && !isAdaptiveCoachingMilestone(completedLine)) return;
    if (kind === "voice") setEditorVoiceState("thinking");

    if (kind === "feedback" && (isBeginnerLineCoachLoading || isCoachLoading)) return;

    setCoachError(null);
    setIsBeginnerLineCoachLoading(true);
    const hintId = options?.hintId ?? `inline-${lineNumber}-${Date.now()}`;
    const question = options?.questionText?.trim() || completedLine.replace(/^\s*(?:\/\/|#)\s*\?\s*/, "").trim();
    const isQuestion = kind === "question" || kind === "voice";
    setInlineCoachHints((current) => {
      const nextHint: InlineCoachHint = { id: hintId, lineNumber, sourceLine: completedLine, kind, status: "loading", text: "", prompt: isQuestion ? question : undefined };
      return current.some((hint) => hint.id === hintId)
        ? current.map((hint) => hint.id === hintId ? nextHint : hint)
        : [...current.filter((hint) => hint.lineNumber !== lineNumber), nextHint];
    });

    const coachPayload: CoachRequest = {
      studyMode: mode,
      coachStyle: activeCoachStyle,
      problemTitle: activeProblem.title,
      problemPrompt: problemText,
      userResponse: isQuestion
        ? [`The learner asked this ${kind === "voice" ? "voice " : ""}question at code line ${lineNumber}: ${question}`, "Answer only that question using the current code context.", kind === "voice" ? "Use no more than 45 words. Give one clear answer and one immediate next move. Do not provide the full solution." : "Use no more than 24 words and do not provide the full solution."].join(" ")
        : [`The learner just completed line ${lineNumber}: ${completedLine}`, "Give one inline coaching note: confirm the direction, identify one concrete issue, or ask one useful next-step question.", "Use no more than 24 words. Do not provide the full solution."].join(" "),
      conversationHistory: chatMessages.map((message) => ({
        speaker: message.speaker,
        text: message.body
      })),
      selectedPatternLabel: correctPattern.label,
      correctPatternLabel: correctPattern.label,
      contrastPatternLabel,
      suggestedTechniques: buildTechniqueBriefs(suggestedTechniques),
      selectedClues: [],
      selectedFirstStep: null,
      learnerNote: isQuestion
        ? kind === "voice" ? "This was spoken naturally inside the editor. Reply directly beneath the active code line as a concise, conversational coach note." : "This is an explicit // ? or # ? question from inside the code editor. Reply as a tiny inline IDE note."
        : "This is automatic beginner-mode line coaching. Reply as a tiny inline IDE note beneath the relevant line.",
      currentCode: codeSnapshot,
      localOutcome: "partial",
      localScore: 55,
      reviewQuestion: activeProblem.reviewQuestion
    };

    try {
      const response = await fetch("/api/coach/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coachPayload)
      });

      if (!response.ok || !response.body) {
        throw new Error((await response.text()) || "Unable to load inline coaching right now.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const visibleReply = reply.replace(/\*\*/g, "").replace(/\n+/g, " ").trimStart();
        setInlineCoachHints((current) => current.map((hint) => hint.id === hintId ? { ...hint, status: "streaming", text: visibleReply } : hint));
      }
      reply += decoder.decode();
      const finalReply = reply.replace(/\*\*/g, "").replace(/\n+/g, " ").trim();
      if (!finalReply) {
        throw new Error("The coach did not return anything for that line.");
      }

      setInlineCoachHints((current) => current.map((hint) => hint.id === hintId ? { ...hint, status: "ready", text: finalReply } : hint));
      if (kind === "voice") {
        const turnId = Date.now();
        setChatMessages((current) => [
          ...current,
          { id: `voice-question-${turnId}`, speaker: "user", title: "You", body: question },
          { id: `voice-answer-${turnId}`, speaker: "coach", title: "Coach", body: finalReply }
        ]);
      }
    } catch (error) {
      setInlineCoachHints((current) => current.map((hint) => hint.id === hintId ? { ...hint, status: "error", text: "Coach could not read this line. Try again in a moment." } : hint));
    } finally {
      setIsBeginnerLineCoachLoading(false);
      if (kind === "voice") setEditorVoiceState("idle");
    }
  }, [
    activeCoachStyle,
    activeProblem.reviewQuestion,
    activeProblem.title,
    chatMessages,
    contrastPatternLabel,
    correctPattern.label,
    isCoachLoading,
    isBeginnerLineCoachLoading,
    mode,
    problemText,
    suggestedTechniques
  ]);

  useEffect(() => {
    const editor = codeEditorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const disposable = editor.onKeyDown((event) => {
      if (event.keyCode !== monaco.KeyCode.Enter) return;
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;

      window.setTimeout(() => {
        const model = editor.getModel();
        const position = editor.getPosition();
        if (!model || !position) return;

        const completedLineNumber = position.lineNumber - 1;
        if (completedLineNumber < 1) return;

        const completedLine = model.getLineContent(completedLineNumber).trim();
        if (completedLine.length === 0) return;

        const isQuestion = /^(?:\/\/|#)\s*\?\s*\S+/.test(completedLine);
        if (!isQuestion && (completedLine.startsWith("//") || completedLine.startsWith("#"))) return;
        const automaticInlineEnabled = activeCoachStyle === "beginner" || activeCoachStyle === "guided";
        if (!isQuestion && !automaticInlineEnabled) return;
        if (!isQuestion && activeCoachStyle === "guided" && !isAdaptiveCoachingMilestone(completedLine)) return;

        const requestKey = `${selectedLanguage}:${completedLineNumber}:${completedLine}`;
        if (lastInlineRequestRef.current === requestKey) return;
        lastInlineRequestRef.current = requestKey;
        void sendInlineLineFeedback(model.getValue(), completedLine, completedLineNumber, isQuestion ? "question" : "feedback");
      }, 0);
    });

    return () => {
      disposable.dispose();
    };
  }, [activeCoachStyle, editorReadyVersion, mode, selectedLanguage, sendInlineLineFeedback]);

  function updateLiveVoiceHint(status: InlineCoachHint["status"], text: string) {
    const hintId = liveVoiceHintIdRef.current;
    if (!hintId) return;
    setInlineCoachHints((current) => current.map((hint) => hint.id === hintId ? { ...hint, status, text } : hint));
  }

  function clearLiveVoiceSilenceTimer() {
    if (liveVoiceSilenceTimerRef.current !== null) {
      window.clearTimeout(liveVoiceSilenceTimerRef.current);
      liveVoiceSilenceTimerRef.current = null;
    }
  }

  function submitLiveVoiceQuestion() {
    if (liveVoiceSubmittedRef.current) return;
    const transcript = (liveVoiceTranscriptRef.current || liveVoiceFinalRef.current).trim();
    if (!transcript) {
      updateLiveVoiceHint("error", "I didn’t catch that. Tap the microphone and try again.");
      setEditorVoiceState("idle");
      editorSpeechRecognitionRef.current = null;
      return;
    }

    liveVoiceSubmittedRef.current = true;
    clearLiveVoiceSilenceTimer();
    updateLiveVoiceHint("loading", "Coach is reading your question in context…");
    const model = codeEditorRef.current?.getModel();
    const lineNumber = liveVoiceLineRef.current;
    const sourceLine = model?.getLineContent(lineNumber).trim() || "Voice question";
    void sendInlineLineFeedback(
      model?.getValue() ?? codeByLanguage[selectedLanguage],
      sourceLine,
      lineNumber,
      "voice",
      { questionText: transcript, hintId: liveVoiceHintIdRef.current }
    );
  }

  async function toggleEditorVoice() {
    if (editorVoiceState === "thinking") return;
    if (activeCoachStyle === "off") {
      setCoachError("Turn coaching support on before asking a voice question.");
      return;
    }

    if (editorVoiceState === "listening") {
      if (editorSpeechRecognitionRef.current) {
        editorSpeechRecognitionRef.current.stop();
        submitLiveVoiceQuestion();
      } else if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setRecordingState("transcribing");
        setEditorVoiceState("thinking");
        updateLiveVoiceHint("loading", "Transcribing your voice question…");
      }
      return;
    }

    const editor = codeEditorRef.current;
    const model = editor?.getModel();
    const position = editor?.getPosition();
    if (!editor || !model || !position) return;

    setShowQuickStartGuide(false);
    setCoachError(null);
    liveVoiceLineRef.current = position.lineNumber;
    liveVoiceHintIdRef.current = `voice-${position.lineNumber}-${Date.now()}`;
    liveVoiceTranscriptRef.current = "";
    liveVoiceFinalRef.current = "";
    liveVoiceSubmittedRef.current = false;
    setInlineCoachHints((current) => [
      ...current.filter((hint) => hint.lineNumber !== position.lineNumber),
      {
        id: liveVoiceHintIdRef.current,
        lineNumber: position.lineNumber,
        sourceLine: model.getLineContent(position.lineNumber).trim() || "Voice question",
        kind: "voice",
        status: "listening",
        text: "Listening… start speaking naturally."
      }
    ]);
    setEditorVoiceState("listening");

    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      voiceInputTargetRef.current = "inline";
      updateLiveVoiceHint("listening", "Recording… tap the microphone again when you finish.");
      await toggleVoiceInput("inline");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    editorSpeechRecognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = "";
      let newlyFinal = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const words = result[0]?.transcript ?? "";
        if (result.isFinal) newlyFinal += words;
        else interim += words;
      }
      if (newlyFinal) liveVoiceFinalRef.current = `${liveVoiceFinalRef.current} ${newlyFinal}`.trim();
      const visibleTranscript = `${liveVoiceFinalRef.current} ${interim}`.trim();
      liveVoiceTranscriptRef.current = visibleTranscript;
      updateLiveVoiceHint("listening", visibleTranscript ? `You: ${visibleTranscript}` : "Listening… start speaking naturally.");
      clearLiveVoiceSilenceTimer();
      if (visibleTranscript) {
        liveVoiceSilenceTimerRef.current = window.setTimeout(() => {
          recognition.stop();
          submitLiveVoiceQuestion();
        }, 2200);
      }
    };

    recognition.onerror = (event) => {
      clearLiveVoiceSilenceTimer();
      liveVoiceSubmittedRef.current = true;
      if (event.error === "no-speech") {
        updateLiveVoiceHint("error", "I didn’t hear anything. Tap the microphone to try again.");
      } else if (event.error === "not-allowed") {
        updateLiveVoiceHint("error", "Microphone access is blocked. Allow it in the browser, then try again.");
      } else {
        updateLiveVoiceHint("error", "Voice input paused unexpectedly. Tap the microphone to try again.");
      }
      editorSpeechRecognitionRef.current = null;
      setEditorVoiceState("idle");
    };

    recognition.onend = () => {
      editorSpeechRecognitionRef.current = null;
      if (!liveVoiceSubmittedRef.current && liveVoiceTranscriptRef.current.trim()) submitLiveVoiceQuestion();
      else if (!liveVoiceSubmittedRef.current) setEditorVoiceState("idle");
    };

    try {
      recognition.start();
    } catch {
      updateLiveVoiceHint("error", "Voice input could not start. Tap the microphone to try again.");
      editorSpeechRecognitionRef.current = null;
      setEditorVoiceState("idle");
    }
  }

  async function toggleVoiceInput(target: "drawer" | "inline" = "drawer") {
    if (recordingState === "transcribing") {
      return;
    }

    if (recordingState === "recording") {
      mediaRecorderRef.current?.stop();
      setRecordingState("transcribing");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setCoachError("Audio recording is not supported in this browser.");
      if (target === "inline") {
        updateLiveVoiceHint("error", "Voice input is not supported in this browser. You can still ask with // ?");
        setEditorVoiceState("idle");
      }
      return;
    }

    try {
      voiceInputTargetRef.current = target;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecordingMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordingStreamRef.current = stream;
      setVoiceStream(stream);
      recordingChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setCoachError("Recording ran into a problem. Please try again.");
        setRecordingState("idle");
        setVoiceStream(null);
        if (voiceInputTargetRef.current === "inline") {
          updateLiveVoiceHint("error", "Recording paused unexpectedly. Tap the microphone to try again.");
          setEditorVoiceState("idle");
        }
      };

      recorder.onstop = () => {
        void transcribeRecordedAudio(recorder.mimeType);
      };

      setCoachError(null);
      setRecordingState("recording");
      recorder.start();
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow microphone access to record a note."
          : "I couldn't start recording. Please try again.";
      setCoachError(message);
      setRecordingState("idle");
      if (target === "inline") {
        updateLiveVoiceHint("error", message);
        setEditorVoiceState("idle");
      }
    }
  }

  async function transcribeRecordedAudio(mimeType: string) {
    const chunks = recordingChunksRef.current;
    const stream = recordingStreamRef.current;
    recordingStreamRef.current = null;
    setVoiceStream(null);
    mediaRecorderRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());

    if (chunks.length === 0) {
      setRecordingState("idle");
      setCoachError("No audio was captured. Try recording again.");
      if (voiceInputTargetRef.current === "inline") {
        updateLiveVoiceHint("error", "No audio was captured. Tap the microphone to try again.");
        setEditorVoiceState("idle");
      }
      return;
    }

    const extension = mimeTypeToExtension(mimeType);
    const blob = new Blob(chunks, {
      type: mimeType || "audio/webm"
    });
    const file = new File([blob], `patternlift-note.${extension}`, {
      type: blob.type
    });
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as { text?: string; error?: string };

      if (!response.ok || !payload.text) {
        throw new Error(payload.error ?? "Transcription failed.");
      }

      const transcript = payload.text.trim();
      if (!transcript) {
        throw new Error("The recording came back empty. Try a slightly longer note.");
      }

      if (voiceInputTargetRef.current === "inline") {
        const model = codeEditorRef.current?.getModel();
        const lineNumber = liveVoiceLineRef.current;
        const sourceLine = model?.getLineContent(lineNumber).trim() || "Voice question";
        updateLiveVoiceHint("loading", "Coach is reading your question in context…");
        void sendInlineLineFeedback(
          model?.getValue() ?? codeByLanguage[selectedLanguage],
          sourceLine,
          lineNumber,
          "voice",
          { questionText: transcript, hintId: liveVoiceHintIdRef.current }
        );
      } else {
        setCoachDraft((current) => [current.trim(), transcript].filter(Boolean).join(current.trim() ? " " : ""));
        setNextInputMethod("voice");
      }
      setCoachError(null);
    } catch (error) {
      setCoachError(
        error instanceof Error
          ? error.message
          : "I couldn't transcribe that recording. Please try again."
      );
      if (voiceInputTargetRef.current === "inline") {
        updateLiveVoiceHint("error", error instanceof Error ? error.message : "I couldn't transcribe that recording.");
        setEditorVoiceState("idle");
      }
    } finally {
      recordingChunksRef.current = [];
      setRecordingState("idle");
    }
  }

  function runExamples() {
    setActiveContextPanel("tests");
    setIsContextPanelCollapsed(false);
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
      setIsRunningCode(true);
      setRunnerError(null);
      const examples = testCases.map((testCase) => ({
        label: testCase.label,
        argsExpression: testCase.argsExpression,
        expectedExpression: testCase.expectedExpression
      }));
      let rawResults: { label: string; actual: unknown; expected: unknown }[];

      if (selectedLanguage === "python") {
        rawResults = await runPythonInBrowser({
          code: codeByLanguage.python,
          functionName: activeCodeConfig.functionName,
          examples
        });
      } else {
        const response = await fetch("/api/run-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: selectedLanguage,
            code: codeByLanguage[selectedLanguage],
            functionName: activeCodeConfig.functionName,
            signature: activeCodeConfig.signature,
            compareMode: activeCodeConfig.compareMode ?? "strict",
            examples
          })
        });
        const data = (await response.json()) as
          | { results: { label: string; actual: unknown; expected: unknown }[] }
          | { error: string };
        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "Unable to run the current code.");
        }
        rawResults = data.results;
      }

      const results = rawResults.map((result) => ({
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
    } finally {
      setIsRunningCode(false);
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

  if (!allProblems.some((problem) => problem.id === problemId)) {
    return (
      <div className="uiverse-panel p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">Problem workspace</p>
        <h2 className="mt-3 text-2xl font-semibold text-ink">We couldn&apos;t find that problem.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/60">
          The link you followed points to a problem id (&ldquo;{problemId}&rdquo;) that doesn&apos;t exist here. It may
          have been renamed or removed.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link href="/practice/select?mode=learn&coach=guided" className="text-sm font-semibold text-lake">
            Pick a problem →
          </Link>
          <Link href="/today" className="text-sm font-semibold text-lake">
            Go to today&apos;s plan →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="session-workspace flex min-h-[calc(100vh-1.5rem)] w-full flex-col gap-0">
      <section className="session-command-bar">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="session-mode-label">{mode === "learn" ? "Guided session" : mode === "recognize" ? "Recognition session" : "Practice session"}</span>
            <span className="session-pattern-label">{correctPattern.label}</span>
          </div>
          <h2>{activeProblem.title}</h2>
        </div>
        <div className="session-command-actions">
          <label className="session-coach-select session-language-select">
            <span>Language</span>
            <select
              value={selectedLanguage}
              onChange={(event) => {
                setSelectedLanguage(event.target.value as SupportedLanguage);
                setRunResults(null);
                setRunnerError(null);
                setInlineCoachHints([]);
                lastInlineRequestRef.current = null;
              }}
            >
              {editorLanguages.filter((language) => availableLanguages.includes(language.id)).map((language) => <option key={language.id} value={language.id}>{language.label}</option>)}
            </select>
          </label>
          <label className="session-coach-select">
            <span>Coach</span>
            <select value={activeCoachStyle} onChange={(event) => setActiveCoachStyle(event.target.value as CoachStyle)}>
              {coachStyles.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
              {activeCoachStyle === "off" ? <option value="off">Coach off</option> : null}
            </select>
          </label>
          <button type="button" onClick={runExamples} disabled={isRunningCode} className="session-run-action">
            {isRunningCode ? "Running Python…" : "Run"} {!isRunningCode ? <span aria-hidden="true">▶</span> : null}
          </button>
          <button type="button" onClick={resetCodeEditor} className="session-reset-action">
            Reset
          </button>
          <button type="button" onClick={() => setIsCoachPanelOpen(true)} className="session-open-coach">
            <CoachSparkIcon /> <span>Conversation</span>
          </button>
          <details className="session-more-menu" ref={moreMenuRef}>
            <summary className="session-more-action" aria-label="More workspace options">•••</summary>
            <div className="session-more-popover">
              <Link href={selectionBackHref}>Choose another problem</Link>
              {activeCoachStyle === "off" ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCoachStyle("guided");
                    if (moreMenuRef.current) moreMenuRef.current.open = false;
                  }}
                >
                  Turn coach on
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCoachStyle("off");
                    if (moreMenuRef.current) moreMenuRef.current.open = false;
                  }}
                >
                  Turn coach off
                </button>
              )}
            </div>
          </details>
        </div>
      </section>

      <div className="relative min-h-0 flex-1">
        {isCoachPanelOpen ? <button type="button" className="session-coach-backdrop" onClick={() => setIsCoachPanelOpen(false)} aria-label="Close coach" /> : null}
        <section aria-hidden={!isCoachPanelOpen} className={`session-coach-drawer ${isCoachPanelOpen ? "session-coach-drawer-open" : ""}`}>
          <div className="session-coach-header">
            <div className="flex items-center gap-3">
              <span className="session-coach-mark"><CoachSparkIcon /></span>
              <div>
                <p>Pattern coach</p>
                <span>{activeProblem.title}</span>
              </div>
            </div>
            <button type="button" onClick={() => setIsCoachPanelOpen(false)} aria-label="Close coach">×</button>
          </div>

          <div
            ref={chatScrollRef}
            className="session-coach-thread min-h-0 flex-[1_1_0] space-y-3 overflow-y-auto px-4 py-4 overscroll-contain"
          >
            {chatMessages.map((message, index) => {
              const isStreamingEmpty =
                isCoachLoading &&
                index === chatMessages.length - 1 &&
                message.speaker === "coach" &&
                !message.body;

              return (
                <ThreadMessage key={message.id} speaker={message.speaker} title={message.title}>
                  {isStreamingEmpty ? (
                    <p className="coach-tool-status">
                      <span className="coach-thinking"><i /><i /><i /></span>
                      {activeCoachTool ? coachToolLabel(activeCoachTool) : "Reading your message"}…
                    </p>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                      {message.toolTrace && message.toolTrace.length > 0 ? (
                        <div className="coach-tool-trace">
                          {message.toolTrace.map((name, traceIndex) => (
                            <span key={`${name}-${traceIndex}`} className="coach-tool-chip">
                              {coachToolLabel(name)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </ThreadMessage>
              );
            })}

            {coachError ? (
              <ThreadMessage speaker="coach" title="AI coaching unavailable">
                <p className="text-sm leading-6 text-red-500">{coachError}</p>
              </ThreadMessage>
            ) : null}
          </div>

          <div className="session-coach-composer-wrap">
            <div className="session-coach-composer">
              {!hasLoggedAttempt ? (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-black/8 pb-2">
                  <span className="text-xs font-medium text-black/52">
                    How confident are you in this read?
                  </span>
                  <div className="flex gap-1" aria-label="Confidence">
                    {([
                      [1, "Unsure"],
                      [2, "Leaning"],
                      [3, "Confident"]
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setConfidence(value)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          confidence === value
                            ? "bg-ink text-white"
                            : "border border-black/10 bg-white text-black/56"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : loggedOutcome ? (
                <div className={`session-attempt-logged session-attempt-logged-${loggedOutcome}`}>
                  <span className="session-attempt-logged-dot" aria-hidden="true" />
                  <span>
                    {loggedOutcome === "solid"
                      ? "Logged as solid — you named the pattern clearly."
                      : loggedOutcome === "partial"
                        ? "Logged as partial — worth a review before it's fully solid."
                        : "Logged as needs work — this pattern will come back around soon."}
                  </span>
                </div>
              ) : null}
              {recordingState === "recording" ? (
                <div className="session-recording-row">
                  <span className="session-recording-dot"><MicrophoneIcon /></span>
                  <span className="session-recording-label">Recording</span>
                  <span className="session-recording-wave"><AudioWaveform stream={voiceStream} /></span>
                  <button type="button" onClick={() => void toggleVoiceInput()} aria-label="Stop recording and transcribe" className="session-stop-recording"><span /></button>
                </div>
              ) : (
                <>
                  <textarea
                    value={coachDraft}
                    onChange={(event) => setCoachDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendCoachMessage();
                      }
                    }}
                    rows={2}
                    className="w-full resize-none border-0 bg-transparent text-sm leading-6 text-ink outline-none placeholder:text-black/34"
                    placeholder={mode === "recognize" ? "What pattern do you see?" : mode === "learn" ? "Ask for one hint or explain your next move..." : "Ask for a hint or a quick code check..."}
                  />
                  <div className="session-composer-actions">
                    <span>{recordingState === "transcribing" ? "Transcribing voice note…" : nextInputMethod === "voice" ? "Voice note ready" : "Enter to send"}</span>
                    <div>
                      <button type="button" onClick={() => void toggleVoiceInput()} aria-label="Record voice note" title="Record voice note" disabled={recordingState === "transcribing"} className="session-mic-button">
                        {recordingState === "transcribing" ? <span className="session-mini-loader" /> : <MicrophoneIcon />}
                      </button>
                      <button type="button" onClick={() => void sendCoachMessage()} disabled={coachDraft.trim().length === 0 || isCoachLoading} className="session-send-button" aria-label="Send message">
                        <SendArrowIcon />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className={`session-editor-main ${showQuickStartGuide ? "session-editor-main-has-guide" : ""} ${isContextPanelCollapsed ? "session-editor-main-context-collapsed" : ""}`}>
          {showQuickStartGuide ? (
            <div className="quick-start-guide" role="status">
              <div className="quick-start-copy">
                <span className="quick-start-kicker">You’re already in the workspace</span>
                <strong>No setup. Start with one line.</strong>
                <p>The coach stays in the workspace below your code, with enough room for a complete, readable answer.</p>
              </div>
              <ol className="quick-start-steps" aria-label="How inline coaching works">
                <li><span>1</span><div><strong>Write</strong><small>Add your first useful line</small></div></li>
                <li><span>2</span><div><strong>Press Enter</strong><small>Get a concise coach note</small></div></li>
                <li><span>3</span><div><strong>Ask by voice</strong><small>Tap the mic and speak naturally</small></div></li>
              </ol>
              <button type="button" onClick={beginQuickStart} className="quick-start-action">Start coding <span aria-hidden="true">→</span></button>
            </div>
          ) : null}
          <div className="ide-scroll-area min-h-0 overflow-y-auto overscroll-contain">
            <div className="space-y-4">
              <details className="ide-disclosure ide-legacy-panel">
                <summary className="cursor-pointer text-sm font-semibold text-ink">
                  Problem statement
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-black/72">
                  {problemText}
                </p>
              </details>

              <div className="ide-editor-block">
                <div className="ide-editor-meta">
                  <div>
                    <p className="ide-editor-kicker">Active file</p>
                    <p className="ide-editor-title">
                      {editorLanguages.find((language) => language.id === selectedLanguage)?.label} · solution
                    </p>
                  </div>
                  {activeCodeConfig ? (
                    <span className="ide-function-chip">
                      {activeCodeConfig.functionName}
                    </span>
                  ) : null}
                </div>
                <div className="ide-editor-frame">
                  <div className="ide-editor-tabbar">
                    <span className="ide-file-tab">solution.{selectedLanguage === "python" ? "py" : selectedLanguage === "typescript" ? "ts" : selectedLanguage === "javascript" ? "js" : selectedLanguage}</span>
                    <span className="ide-editor-help">
                      Voice first · <strong className="font-mono">{"// ?"}</strong> is the backup
                    </span>
                  </div>
                  <Editor
                    height="100%"
                    beforeMount={handleEditorMount}
                    onMount={handleEditorReady}
                    theme="patternlift-ide"
                    language={monacoLanguageMap[selectedLanguage]}
                    value={codeByLanguage[selectedLanguage]}
                    onChange={(value) => {
                      setShowQuickStartGuide(false);
                      setCodeByLanguage((current) => ({
                        ...current,
                        [selectedLanguage]: value ?? ""
                      }));
                      setRunResults(null);
                      setRunnerError(null);
                    }}
                    options={{
                      automaticLayout: true,
                      minimap: { enabled: false },
                      fontSize: 15,
                      lineHeight: 30,
                      fontFamily:
                        "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
                      scrollBeyondLastLine: false,
                      wordWrap: "off",
                      tabSize: 2,
                      insertSpaces: true,
                      detectIndentation: false,
                      renderWhitespace: "selection",
                      padding: { top: 16, bottom: 16 },
                      roundedSelection: true,
                      lineNumbersMinChars: 3,
                      glyphMargin: true,
                      folding: true,
                      overviewRulerBorder: false,
                      scrollbar: {
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10
                      }
                    }}
                  />
                </div>
              </div>

              {!hasNativeCodeConfig ? (
                <div className="rounded-[8px] border border-coral/12 bg-[linear-gradient(180deg,rgba(255,247,244,0.92),rgba(255,241,237,0.92))] p-4 text-sm leading-7 text-black/68">
                  This problem doesn&apos;t have a dedicated judge yet, so your function takes the whole example as one raw string - parse whatever you need out of it yourself, then return the answer as a string. The test panel below is pre-filled with real examples; add your own with the input in the same shape if you want more.
                </div>
              ) : null}

              <details className="ide-disclosure ide-legacy-panel">
                  <summary className="cursor-pointer text-sm font-semibold text-ink">
                    Test case panel
                  </summary>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {runSummary ? (
                        <div className="rounded-[8px] border border-black/10 bg-mist p-3 text-sm text-black/68">
                          Passed {runSummary.passed} of {runSummary.total} cases
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={addCustomTestCase}
                      className="uiverse-button-secondary px-3 py-2 text-xs font-medium"
                    >
                      Add custom case
                    </button>
                  </div>
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
                            className={`w-full rounded-[8px] border px-3 py-3 text-left transition ${
                              isActive
                                ? "border-lake/30 bg-lake/10"
                                : "border-black/10 bg-mist"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">{testCase.label}</p>
                              {result ? (
                                <span
                                  className={`text-xs font-semibold ${
                                    result.passed ? "text-emerald-300" : "text-amber-300"
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
                      <div className="rounded-[8px] border border-black/10 bg-white/92 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">{selectedTestCase.label}</p>
                          {selectedTestCase.kind === "custom" ? (
                            <button
                              type="button"
                              onClick={() => removeCustomTestCase(selectedTestCase.id)}
                              className="text-xs font-medium text-red-300"
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
                            className="uiverse-field mt-2 w-full bg-white px-3 py-2 font-mono text-xs leading-6 text-ink outline-none"
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
                            className="uiverse-field mt-2 w-full bg-white px-3 py-2 font-mono text-xs leading-6 text-ink outline-none"
                          />
                        </label>
                        {runResults?.find((entry) => entry.label === selectedTestCase.label) ? (
                          <div className="mt-4 rounded-[8px] border border-black/10 bg-mist p-3">
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
                </details>

              {runnerError ? (
                <div className="ide-legacy-panel rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {runnerError}
                </div>
              ) : null}

              {runResults ? (
                <div className="ide-legacy-panel rounded-[8px] border border-black/10 bg-white/88 p-4">
                  <p className="text-sm font-semibold text-ink">Run results</p>
                  <div className="mt-3 space-y-3">
                    {runResults.map((result) => (
                      <div
                        key={result.label}
                        className={`rounded-[8px] border p-3 ${
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
          <aside className={`ide-context-rail ${isContextPanelCollapsed ? "ide-context-rail-collapsed" : ""}`}>
            <div className="ide-context-tabs">
              {!isContextPanelCollapsed ? ([
                ["coach", "Coach"],
                ["problem", "Problem"],
                ["tests", runSummary ? `Tests ${runSummary.passed}/${runSummary.total}` : "Tests"],
                ["approaches", "Approaches"]
              ] as const).map(([panel, label]) => (
                <button
                  key={panel}
                  type="button"
                  onClick={() => {
                    setActiveContextPanel(panel);
                    if (panel === "approaches" && approachesUnlocked) void loadApproaches();
                  }}
                  className={activeContextPanel === panel ? "ide-context-tab-active" : ""}
                >
                  {label}
                </button>
              )) : null}
              <button
                type="button"
                className="ide-context-collapse"
                onClick={() => setIsContextPanelCollapsed((current) => !current)}
                aria-label={isContextPanelCollapsed ? "Open context panel" : "Collapse context panel"}
              >
                {isContextPanelCollapsed ? "‹" : "›"}
              </button>
            </div>

            {isContextPanelCollapsed ? (
              <button type="button" className="ide-context-restore" onClick={() => setIsContextPanelCollapsed(false)}>
                <CoachSparkIcon /><span>Open context</span>
              </button>
            ) : activeContextPanel === "coach" ? (
              <section className={`ide-context-coach ide-coach-console ${activeInlineCoachHint ? "ide-coach-console-active" : ""}`} aria-live="polite">
                <div className="ide-coach-console-head">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`ide-coach-orb ${editorVoiceState === "listening" ? "ide-coach-orb-listening" : ""}`}><CoachSparkIcon /></span>
                    <div className="min-w-0">
                      <p>Pattern coach</p>
                      <span>{activeInlineCoachHint ? `Focused on line ${activeInlineCoachHint.lineNumber}` : "Ready in your editor"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleEditorVoice()}
                    disabled={editorVoiceState === "thinking" || activeCoachStyle === "off"}
                    className={`ide-coach-voice ${editorVoiceState !== "idle" ? "ide-coach-voice-active" : ""}`}
                    aria-label={editorVoiceState === "listening" ? "Finish voice question" : "Ask the coach by voice"}
                  >
                    <span>{editorVoiceState === "thinking" ? <span className="session-mini-loader" /> : <MicrophoneIcon />}</span>
                    {editorVoiceState === "listening" ? "Listening" : editorVoiceState === "thinking" ? "Responding" : "Ask by voice"}
                    {editorVoiceState === "listening" ? <span className="editor-voice-bars" aria-hidden="true"><i /><i /><i /><i /></span> : null}
                  </button>
                </div>
                <div className="ide-coach-console-body">
                  {activeInlineCoachHint ? (
                    <>
                      {activeInlineCoachHint.prompt ? <p className="ide-coach-question"><span>You asked</span>{activeInlineCoachHint.prompt}</p> : null}
                      <div className={`ide-coach-answer ide-coach-answer-${activeInlineCoachHint.status}`}>
                        <span>{activeInlineCoachHint.kind === "feedback" ? "Line note" : activeInlineCoachHint.status === "listening" ? "Live transcript" : "Coach"}</span>
                        <p>{activeInlineCoachHint.status === "loading" ? activeInlineCoachHint.text || "Reading your code and shaping one useful next step…" : activeInlineCoachHint.text}</p>
                      </div>
                    </>
                  ) : (
                    <div className="ide-coach-empty">
                      <strong>Ask without leaving your code.</strong>
                      <p>Put your cursor near the code, tap the microphone, and speak naturally. The complete answer stays here beside the editor.</p>
                    </div>
                  )}
                </div>
                <div className="ide-coach-console-foot">
                  <span>Feedback appears after a meaningful line.</span>
                  {activeInlineCoachHint ? (
                    <div>
                      {activeInlineCoachHint.status === "ready" ? <button type="button" onClick={() => { setCoachDraft(`Can you explain your note on this line: ${activeInlineCoachHint.sourceLine}`); setIsCoachPanelOpen(true); }}>Continue</button> : null}
                      <button type="button" onClick={() => setInlineCoachHints((current) => current.filter((hint) => hint.id !== activeInlineCoachHint.id))}>Clear</button>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : activeContextPanel === "problem" ? (
              <section className="ide-context-content">
                <p className="ide-context-kicker">Problem statement</p>
                <h3>{activeProblem.title}</h3>
                <div className="ide-context-badges"><span>{correctPattern.label}</span>{contrastPattern ? <span>vs {contrastPattern.label}</span> : null}</div>
                {problemStatementLoading ? (
                  <p className="ide-problem-copy">Loading the real problem statement…</p>
                ) : problemStatementError ? (
                  <div className="ide-approaches-locked">
                    <p>{problemStatementError}</p>
                    <button type="button" onClick={() => void loadProblemStatement(activeProblem.id, hasNativeCodeConfig)}>Try again</button>
                  </div>
                ) : (
                  <>
                    <p className="ide-problem-copy">{problemText}</p>
                    {problemExamples.length > 0 ? (
                      <div className="ide-problem-examples">
                        {problemExamples.map((example, index) => (
                          <div key={index} className="ide-problem-example">
                            <div><strong>Input</strong><code>{example.input}</code></div>
                            <div><strong>Output</strong><code>{example.output}</code></div>
                            {example.explanation ? <p>{example.explanation}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {problemConstraints.length > 0 ? (
                      <div className="ide-problem-constraints">
                        <p className="ide-context-kicker">Constraints</p>
                        <ul>{problemConstraints.map((constraint, index) => <li key={index}>{constraint}</li>)}</ul>
                      </div>
                    ) : null}
                  </>
                )}
              </section>
            ) : activeContextPanel === "tests" ? (
              <section className="ide-context-content ide-tests-panel">
                <div className="ide-tests-heading">
                  <div><p className="ide-context-kicker">Test cases</p><h3>{runSummary ? `${runSummary.passed} of ${runSummary.total} passing` : "Check your solution"}</h3></div>
                  <button type="button" onClick={addCustomTestCase}>+ Add</button>
                </div>
                <div className="ide-test-list">
                  {testCases.map((testCase) => {
                    const result = runResults?.find((entry) => entry.label === testCase.label);
                    return <button key={testCase.id} type="button" onClick={() => setSelectedTestCaseId(testCase.id)} className={selectedTestCase?.id === testCase.id ? "ide-test-active" : ""}><span>{testCase.label}</span><small>{result ? result.passed ? "Passed" : "Failed" : testCase.kind === "custom" ? "Custom" : "Ready"}</small></button>;
                  })}
                </div>
                {selectedTestCase ? (
                  <div className="ide-test-editor">
                    <div className="ide-test-editor-title"><strong>{selectedTestCase.label}</strong>{selectedTestCase.kind === "custom" ? <button type="button" onClick={() => removeCustomTestCase(selectedTestCase.id)}>Remove</button> : null}</div>
                    <label>Input<textarea value={selectedTestCase.argsExpression} onChange={(event) => updateTestCase(selectedTestCase.id, "argsExpression", event.target.value)} rows={3} spellCheck={false} /></label>
                    <label>Expected<textarea value={selectedTestCase.expectedExpression} onChange={(event) => updateTestCase(selectedTestCase.id, "expectedExpression", event.target.value)} rows={3} spellCheck={false} /></label>
                  </div>
                ) : null}
                {runnerError ? <p className="ide-test-error">{runnerError}</p> : null}
                {runResults ? <div className="ide-test-results">{runResults.map((result) => <div key={result.label} className={result.passed ? "ide-test-result-pass" : "ide-test-result-fail"}><strong>{result.label}</strong><span>{result.actual} / {result.expected}</span></div>)}</div> : null}
              </section>
            ) : (
              <section className="ide-context-content">
                <p className="ide-context-kicker">Brute force → optimized</p>
                <h3>Approaches</h3>
                {!approachesUnlocked ? (
                  <div className="ide-approaches-locked">
                    <p>Try it yourself first — approaches unlock once you&apos;ve run your code or talked it through with the coach.</p>
                  </div>
                ) : approachesLoading ? (
                  <div className="ide-approaches-locked">
                    <span className="coach-thinking"><i /><i /><i /></span>
                    <p>Working out the approach tiers…</p>
                  </div>
                ) : approachesError ? (
                  <div className="ide-approaches-locked">
                    <p>{approachesError}</p>
                    <button type="button" onClick={() => void loadApproaches()}>Try again</button>
                  </div>
                ) : approaches ? (
                  <div className="ide-approaches-list">
                    {selectedLanguage !== "javascript" ? (
                      <p className="ide-approaches-lang-note">
                        Code below is shown in JavaScript as a consistent reference — the idea is the same, translate it into {editorLanguages.find((language) => language.id === selectedLanguage)?.label ?? selectedLanguage}.
                      </p>
                    ) : null}
                    {approaches.map((tier) => (
                      <div key={tier.name} className="ide-approach-tier">
                        <div className="ide-approach-tier-head">
                          <strong>{tier.name}</strong>
                          <span>{tier.timeComplexity} time · {tier.spaceComplexity} space</span>
                        </div>
                        <p>{tier.idea}</p>
                        <span className={tier.verified ? "ide-approach-verified" : "ide-approach-unverified"}>
                          {tier.verified ? "Verified against this problem's tests" : "Unverified — double-check before relying on it"}
                        </span>
                        <pre className="ide-approach-code"><code>{tier.code}</code></pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ide-approaches-locked">
                    <button type="button" onClick={() => void loadApproaches()}>Load approaches</button>
                  </div>
                )}
              </section>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}

function isAdaptiveCoachingMilestone(line: string) {
  const normalized = line.trim();
  if (!normalized || /^(?:\/\/|#)/.test(normalized)) return false;

  return /(?:\b(?:def|function|class|for|while|if|else|elif|switch|case|return|throw|try|catch|finally)\b|(?:^|[^=!<>])=(?!=)|\.(?:add|append|push|set|delete|remove)\s*\(|\b(?:set|map|dict|list|queue|stack)\s*\()/i.test(normalized);
}

function MicrophoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 10.5v.5a6.5 6.5 0 0 0 13 0v-.5M12 17.5V21M9 21h6" />
    </svg>
  );
}

function SendArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 12 6-6 6 6M12 18V6" />
    </svg>
  );
}

function CoachSparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 9.8 8.8 4 11l5.8 2.2L12 19l2.2-5.8L20 11l-5.8-2.2L12 3Z" />
    </svg>
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Whole-word match only - a plain substring check would let "tests" match
// the word "test", or "hashtag" match "hash", producing false positives.
function containsWord(haystack: string, needle: string) {
  const escaped = escapeRegExp(needle.trim());
  if (!escaped) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(haystack);
}

function inferPatternFromReply(text: string): PatternId | null {
  const normalized = text.toLowerCase();
  let bestMatch: { id: PatternId; score: number } | null = null;

  for (const pattern of patternOptions) {
    let score = 0;
    const labelWords = pattern.label.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

    for (const word of labelWords) {
      if (word.length > 2 && containsWord(normalized, word)) score += 2;
    }

    for (const clue of pattern.clues) {
      if (containsWord(normalized, clue.toLowerCase())) score += 3;
    }

    const shortName = pattern.id.replace(/-/g, " ");
    if (containsWord(normalized, shortName)) score += 3;

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
    .filter((clue) => containsWord(normalized, clue.toLowerCase()));
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
      return words.some((word) => containsWord(normalized, word));
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
    <section className={`flex gap-2 ${isCoach ? "justify-start" : "justify-end"}`}>
      {isCoach ? <Avatar label="Coach" tone="coach" /> : null}

      <div
        className={`chat-bubble-in max-w-[86%] rounded-[14px] border px-4 py-3 ${
          isCoach
            ? "border-slate-200 bg-slate-50"
            : "border-slate-900 bg-slate-900"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            isCoach ? "text-slate-400" : "text-slate-400"
          }`}
        >
          {isCoach ? "Coach" : "You"}
        </p>
        {title !== (isCoach ? "Coach" : "You") ? <h2 className={`mt-1 text-sm font-semibold ${isCoach ? "text-ink" : "text-white"}`}>{title}</h2> : null}
        <div className={`mt-2 ${isCoach ? "text-slate-700" : "text-white"}`}>{children}</div>
        {controls ? <div className="mt-5">{controls}</div> : null}
      </div>

      {isCoach ? null : <Avatar label="You" tone="user" />}
    </section>
  );
}

function Avatar({ label, tone }: { label: string; tone: "coach" | "user" }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
        tone === "coach"
          ? "border-white/10 bg-white text-[#111111]"
          : "border-coral/16 bg-[linear-gradient(180deg,rgba(255,245,245,1),rgba(255,231,231,1))] text-coral"
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

function pickRecordingMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg"
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function mimeTypeToExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg")) return "mp3";
  return "webm";
}

