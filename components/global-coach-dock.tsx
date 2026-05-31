"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { CoachReplyResponse, CoachRequest } from "@/lib/coach";
import { allProblems, patternOptions } from "@/lib/product";
import { buildTechniqueBriefs, getSuggestedTechniques } from "@/lib/techniques";

type DockMessage = {
  id: string;
  speaker: "coach" | "user";
  text: string;
};

const coachQuickActions: Record<string, string[]> = {
  home: [
    "Help me choose the right mode.",
    "What pattern should I learn first as a beginner?",
    "How should I study if LeetCode feels overwhelming?"
  ],
  learn: [
    "Which pattern should I start with first?",
    "Give me a simpler problem from this pattern.",
    "What mistake do beginners make with this pattern?"
  ],
  recognize: [
    "How do I tell sliding window from two pointers?",
    "What clues matter most when I read a problem?",
    "Give me a fast pattern-recognition drill."
  ],
  practice: [
    "Give me one small hint.",
    "Does my approach sound reasonable?",
    "What should I think about before I code?"
  ],
  progress: [
    "What should I review next?",
    "How do I fix repeated pattern confusion?",
    "How should I use my review queue better?"
  ],
  review: [
    "Quiz me on this weak pattern.",
    "What clue would help me remember this later?",
    "Contrast these two patterns for me."
  ]
};

const pageTitles: Record<string, string> = {
  home: "Mode selection",
  learn: "Learning mode",
  recognize: "Pattern recognition",
  practice: "Practice workspace",
  progress: "Progress",
  review: "Review"
};

export function GlobalCoachDock() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<DockMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(pathname === "/");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "transcribing">(
    "idle"
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const pageKind = useMemo(() => {
    if (pathname.startsWith("/learn")) return "learn";
    if (pathname.startsWith("/recognize")) return "recognize";
    if (pathname.startsWith("/practice")) return "practice";
    if (pathname.startsWith("/progress")) return "progress";
    if (pathname.startsWith("/review")) return "review";
    return "home";
  }, [pathname]);

  const activeProblemId = searchParams.get("problem");
  const activeProblem =
    allProblems.find((problem) => problem.id === activeProblemId) ?? null;

  const selectedPatternIds = searchParams
    .get("patterns")
    ?.split(",")
    .filter(Boolean) ?? [];

  const primaryPattern =
    (activeProblem
      ? patternOptions.find((pattern) => pattern.id === activeProblem.targetPatternId)
      : null) ??
    patternOptions.find((pattern) => pattern.id === selectedPatternIds[0]) ??
    null;

  const contrastPattern = activeProblem
    ? patternOptions.find((pattern) => pattern.id === activeProblem.contrastPatternId) ?? null
    : null;

  const coachStyle =
    (searchParams.get("coach") as CoachRequest["coachStyle"] | null) ?? "guided";
  const studyMode = (() => {
    const paramMode = searchParams.get("mode");
    if (paramMode === "learn" || paramMode === "recognize" || paramMode === "practice") {
      return paramMode;
    }
    if (pageKind === "learn") return "learn";
    if (pageKind === "practice") return "practice";
    return "recognize";
  })();

  const contextProblemPrompt = activeProblem?.prompt ??
    [
      `Current page: ${pageTitles[pageKind]}.`,
      primaryPattern ? `Current pattern focus: ${primaryPattern.label}.` : null,
      pageKind === "home"
        ? "The learner is deciding how to study today and wants practical guidance."
        : "The learner wants coaching that matches what they are trying to do on this page."
    ]
      .filter(Boolean)
      .join(" ");

  const suggestedTechniques = buildTechniqueBriefs(
    getSuggestedTechniques({
      primaryPatternId: primaryPattern?.id ?? null,
      contrastPatternId: contrastPattern?.id ?? null,
      problemPrompt: contextProblemPrompt
    })
  );

  const introMessage = useMemo(() => {
    if (pageKind === "practice" && activeProblem) {
      return `We’re on ${activeProblem.title}. Ask for a hint, a pattern check, a code-direction sanity check, or a cleaner path when you want one.`;
    }

    if (pageKind === "learn" && primaryPattern) {
      return `We’re in learning mode for ${primaryPattern.label}. Ask me for a starter problem, a common trap, or a simpler mental model.`;
    }

    if (pageKind === "review") {
      return "Use me to turn a weak spot into a concrete next step. I can quiz you, contrast patterns, or explain why a past approach drifted.";
    }

    if (pageKind === "progress") {
      return "I can help you read your progress and turn it into a smarter next move instead of just more random practice.";
    }

    if (pageKind === "recognize") {
      return "Bring me a problem instinct or a clue you noticed, and I’ll help you separate the right pattern from the tempting wrong one.";
    }

    return "Tell me what feels hardest right now, and I’ll help you pick the best way to study next.";
  }, [activeProblem, pageKind, primaryPattern]);

  useEffect(() => {
    setMessages([
      {
        id: `${pageKind}-${activeProblem?.id ?? primaryPattern?.id ?? "home"}-intro`,
        speaker: "coach",
        text: introMessage
      }
    ]);
    setDraft("");
    setError(null);
  }, [activeProblem?.id, introMessage, pageKind, primaryPattern?.id]);

  useEffect(() => {
    setIsOpen(pathname === "/");
  }, [pathname]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function sendMessage(messageText?: string) {
    const nextText = (messageText ?? draft).trim();
    if (!nextText || isLoading) return;

    const nextUserMessage: DockMessage = {
      id: `user-${Date.now()}`,
      speaker: "user",
      text: nextText
    };

    const nextConversation = [...messages, nextUserMessage];
    setMessages(nextConversation);
    setDraft("");
    setIsLoading(true);
    setError(null);

    const requestBody: CoachRequest = {
      studyMode,
      coachStyle,
      problemTitle: activeProblem?.title ?? pageTitles[pageKind],
      problemPrompt: contextProblemPrompt,
      userResponse: nextText,
      conversationHistory: nextConversation.map((message) => ({
        speaker: message.speaker,
        text: message.text
      })),
      selectedPatternLabel: primaryPattern?.label ?? "Still choosing a pattern",
      correctPatternLabel: primaryPattern?.label ?? "General interview prep",
      contrastPatternLabel: contrastPattern?.label ?? "Neighboring pattern",
      suggestedTechniques,
      selectedClues: [],
      selectedFirstStep: null,
      learnerNote: `Current page is ${pageTitles[pageKind]}. Keep the response useful for this page context.`,
      currentCode: "",
      localOutcome: "partial",
      localScore: 50,
      reviewQuestion:
        activeProblem?.reviewQuestion ??
        "What clue should you remember next time so the right pattern becomes easier to spot?"
    };

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const payload = (await response.json()) as CoachReplyResponse | { error: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Unable to reach the coach.");
      }

      if ("error" in payload) {
        throw new Error(payload.error);
      }

      setMessages((current) => [
        ...current,
        {
          id: `coach-${Date.now()}`,
          speaker: "coach",
          text: payload.reply
        }
      ]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to reach the coach.");
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleVoiceInput() {
    if (recordingState === "transcribing") {
      return;
    }

    if (recordingState === "recording") {
      mediaRecorderRef.current?.stop();
      setRecordingState("transcribing");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecordingMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("Recording ran into a problem. Please try again.");
        setRecordingState("idle");
      };

      recorder.onstop = () => {
        void transcribeRecordedAudio(recorder.mimeType);
      };

      setError(null);
      setRecordingState("recording");
      recorder.start();
    } catch (recordingError) {
      const message =
        recordingError instanceof DOMException && recordingError.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow microphone access to record a note."
          : "I couldn't start recording. Please try again.";
      setError(message);
      setRecordingState("idle");
    }
  }

  async function transcribeRecordedAudio(mimeType: string) {
    const chunks = recordingChunksRef.current;
    const stream = recordingStreamRef.current;
    recordingStreamRef.current = null;
    mediaRecorderRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());

    if (chunks.length === 0) {
      setRecordingState("idle");
      setError("No audio was captured. Try recording again.");
      return;
    }

    const extension = mimeTypeToExtension(mimeType);
    const blob = new Blob(chunks, {
      type: mimeType || "audio/webm"
    });
    const file = new File([blob], `patternlift-dock-note.${extension}`, {
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

      setDraft((current) => [current.trim(), transcript].filter(Boolean).join(current.trim() ? " " : ""));
      setError(null);
    } catch (transcriptionError) {
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "I couldn't transcribe that recording. Please try again."
      );
    } finally {
      recordingChunksRef.current = [];
      setRecordingState("idle");
    }
  }

  const quickActions = coachQuickActions[pageKind];

  if (pathname === "/practice") {
    return null;
  }

  return (
    <aside
      className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ${
        isOpen
          ? "w-[min(28rem,calc(100vw-1.5rem))] translate-y-0 opacity-100"
          : "w-auto translate-y-0 opacity-100"
      }`}
    >
      <div className={`${isOpen ? "coach-dock" : ""}`}>
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="uiverse-button inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium"
          >
            Ask the coach
          </button>
        ) : (
          <div className="coach-dock">
        <div className="flex items-center justify-between gap-4 border-b border-black/8 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
              Ask the coach
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {pageTitles[pageKind]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="uiverse-button-secondary px-3 py-2 text-xs font-medium"
          >
            {isOpen ? "Hide" : "Open"}
          </button>
        </div>

          <>
            <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-2xl px-4 py-3 text-sm leading-6 transition ${
                    message.speaker === "coach"
                      ? "mr-8 border border-black/8 bg-white text-black/74"
                      : "ml-8 bg-coral text-white shadow-[0_10px_20px_rgba(255,92,92,0.18)]"
                  }`}
                >
                  {message.text}
                </div>
              ))}

              {isLoading ? (
                <div className="mr-8 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-black/60">
                  Thinking through the next nudge...
                </div>
              ) : null}

              {error ? (
                <div className="mr-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="border-t border-black/8 px-4 py-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => void sendMessage(action)}
                    className="coach-chip px-3 py-2 text-xs font-medium text-black/66"
                  >
                    {action}
                  </button>
                ))}
              </div>

              <div className="coach-input-shell">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={3}
                  className="w-full resize-none border-0 bg-transparent text-sm leading-6 text-ink outline-none placeholder:text-black/36"
                  placeholder={
                    pageKind === "practice"
                      ? "Ask for a hint, sanity check, complexity read, or cleaner path..."
                      : "Ask anything about the pattern, next step, or what still feels fuzzy..."
                  }
                />
                <div className="flex items-center justify-between gap-3 pt-3">
                  <p className="text-xs text-black/46">
                    {recordingState === "recording"
                      ? "Recording now. Tap the mic again when you want me to transcribe it."
                      : recordingState === "transcribing"
                        ? "Transcribing your recording..."
                        : primaryPattern
                          ? `Pattern context: ${primaryPattern.label}`
                          : "General coaching"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleVoiceInput()}
                      aria-label={
                        recordingState === "recording"
                          ? "Stop recording and transcribe"
                          : recordingState === "transcribing"
                            ? "Transcribing recording"
                            : "Start recording for transcription"
                      }
                      title={
                        recordingState === "recording"
                          ? "Stop recording and transcribe"
                          : recordingState === "transcribing"
                            ? "Transcribing recording"
                            : "Start recording for transcription"
                      }
                      disabled={recordingState === "transcribing"}
                      className={`rounded-[8px] border px-3 py-2 text-sm font-medium transition ${
                        recordingState === "recording"
                          ? "border-coral/20 bg-coral text-white shadow-[0_10px_18px_rgba(255,92,92,0.18)]"
                          : recordingState === "transcribing"
                            ? "cursor-wait border-black/10 bg-black/6 text-black/40"
                            : "border-black/10 bg-white text-black/68"
                      }`}
                    >
                      <span aria-hidden="true" className="block text-lg leading-none">
                        {recordingState === "recording"
                          ? "◼"
                          : recordingState === "transcribing"
                            ? "⋯"
                            : "🎙"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={!draft.trim() || isLoading}
                      className="uiverse-button px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
          </div>
        )}
      </div>
    </aside>
  );
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
