"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { parseCoachAgentStream, type CoachRequest } from "@/lib/coach";
import { patternOptions } from "@/lib/pattern-catalog";
import { mimeTypeToExtension, pickRecordingMimeType } from "@/lib/voice-recording";

type DockMessage = {
  id: string;
  speaker: "coach" | "user";
  text: string;
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

function cleanCoachReply(reply: string) {
  return reply
    .replace(/\*\*/g, "")
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "transcribing">(
    "idle"
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const conversationRef = useRef<HTMLDivElement | null>(null);

  const pageKind = useMemo(() => {
    if (pathname.startsWith("/learn")) return "learn";
    if (pathname.startsWith("/recognize")) return "recognize";
    if (pathname.startsWith("/practice")) return "practice";
    if (pathname.startsWith("/progress")) return "progress";
    if (pathname.startsWith("/review")) return "review";
    return "home";
  }, [pathname]);

  const activeProblemId = searchParams.get("problem");

  const selectedPatternIds = searchParams
    .get("patterns")
    ?.split(",")
    .filter(Boolean) ?? [];

  const primaryPattern =
    patternOptions.find((pattern) => pattern.id === selectedPatternIds[0]) ??
    null;

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

  const contextProblemPrompt =
    [
      activeProblemId ? `Current problem id: ${activeProblemId}.` : null,
      `Current page: ${pageTitles[pageKind]}.`,
      primaryPattern ? `Current pattern focus: ${primaryPattern.label}.` : null,
      pageKind === "home"
        ? "The learner is choosing between PatternLift's three coding-pattern modes: Learn builds understanding with guided reps; Recognize trains pattern identification before coding; Practice is independent coding with optional hints. Recommend exactly one based on their need."
        : "The learner wants coaching that matches what they are trying to do on this page."
    ]
      .filter(Boolean)
      .join(" ");

  const suggestedTechniques = primaryPattern
    ? [{
        title: primaryPattern.label,
        whyItFits: primaryPattern.coachPrompt,
        starterQuestion: primaryPattern.firstSteps[0],
        commonTrap: "Do not commit until the prompt's strongest clue matches the invariant.",
        quickTips: [...primaryPattern.firstSteps],
        coachMoves: [primaryPattern.coachPrompt]
      }]
    : [];

  const introMessage = useMemo(() => {
    if (pageKind === "practice" && activeProblemId) {
      return "We’re on the selected problem. Ask for a hint, a pattern check, a code-direction sanity check, or a cleaner path when you want one.";
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
  }, [activeProblemId, pageKind, primaryPattern]);

  useEffect(() => {
    setMessages([
      {
        id: `${pageKind}-${activeProblemId ?? primaryPattern?.id ?? "home"}-intro`,
        speaker: "coach",
        text: introMessage
      }
    ]);
    setDraft("");
    setError(null);
    setComposerOpen(false);
  }, [activeProblemId, introMessage, pageKind, primaryPattern?.id]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const node = conversationRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, activeTool]);

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
    setComposerOpen(false);
    setIsLoading(true);
    setActiveTool(null);
    setError(null);

    const requestBody: CoachRequest = {
      studyMode,
      coachStyle,
      problemTitle: pageTitles[pageKind],
      problemPrompt: contextProblemPrompt,
      userResponse: nextText,
      conversationHistory: nextConversation.map((message) => ({
        speaker: message.speaker,
        text: message.text
      })),
      selectedPatternLabel: primaryPattern?.label ?? "Still choosing a pattern",
      correctPatternLabel: primaryPattern?.label ?? "General interview prep",
      contrastPatternLabel: "Neighboring pattern",
      suggestedTechniques,
      selectedClues: [],
      selectedFirstStep: null,
      learnerNote: `Current page is ${pageTitles[pageKind]}. Keep the response useful for this page context.`,
      currentCode: "",
      localOutcome: "partial",
      localScore: 50,
      reviewQuestion: "What clue should you remember next time so the right pattern becomes easier to spot?",
      problemId: activeProblemId ?? undefined,
      patternId: primaryPattern?.id,
      contrastPatternId: undefined
    };

    const coachMessageId = `coach-${Date.now()}`;
    setMessages((current) => [...current, { id: coachMessageId, speaker: "coach", text: "" }]);

    try {
      const response = await fetch("/api/coach/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error("Unable to reach the coach.");
      }

      let reply = "";
      for await (const event of parseCoachAgentStream(response)) {
        if (event.type === "tool_call") {
          setActiveTool(event.name);
        } else if (event.type === "text_delta") {
          reply += event.text;
          setActiveTool(null);
          const cleaned = cleanCoachReply(reply);
          setMessages((current) =>
            current.map((message) =>
              message.id === coachMessageId ? { ...message, text: cleaned } : message
            )
          );
        } else if (event.type === "done") {
          setMessages((current) =>
            current.map((message) =>
              message.id === coachMessageId ? { ...message, toolTrace: event.toolTrace } : message
            )
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      if (!reply.trim()) {
        throw new Error("The coach did not send a reply. Please try again.");
      }
    } catch (sendError) {
      setMessages((current) => current.filter((message) => message.id !== coachMessageId));
      setError(sendError instanceof Error ? sendError.message : "Unable to reach the coach.");
    } finally {
      setIsLoading(false);
      setActiveTool(null);
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
          ? "w-[min(24rem,calc(100vw-1.5rem))] translate-y-0 opacity-100"
          : "w-auto translate-y-0 opacity-100"
      }`}
    >
      <div className={`${isOpen ? "coach-dock" : ""}`}>
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="coach-launcher"
          >
            <span className="coach-orb" aria-hidden="true"><span /></span>
            <span className="text-left">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Pattern copilot</span>
              <span className="mt-0.5 block text-sm font-semibold text-white">Think it through</span>
            </span>
            <span className="ml-2 text-slate-600" aria-hidden="true">↗</span>
          </button>
        ) : (
          <div className="coach-copilot">
        <div className="coach-copilot-header">
          <div className="flex items-center gap-3">
            <span className="coach-orb" aria-hidden="true"><span /></span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">Pattern copilot</p>
              <p className="mt-1 text-sm font-medium text-white">{pageTitles[pageKind]} · in context</p>
            </div>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} className="coach-close-button" aria-label="Close coach">×</button>
        </div>

          <>
            <div ref={conversationRef} className="coach-conversation space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => {
                const isStreamingEmpty =
                  isLoading && index === messages.length - 1 && message.speaker === "coach" && !message.text;

                return (
                  <div
                    key={message.id}
                    className={`coach-message chat-bubble-in ${message.speaker === "coach" ? "coach-message-ai" : "coach-message-user"}`}
                  >
                    {isStreamingEmpty ? (
                      <span className="coach-tool-status">
                        <span className="coach-thinking"><i /><i /><i /></span>
                        {activeTool ? coachToolLabel(activeTool) : "Reading the signal"}…
                      </span>
                    ) : (
                      <>
                        {message.text}
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
                  </div>
                );
              })}

              {error ? (
                <div className="mr-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="coach-next-actions border-t border-slate-200 px-4 py-3">
              {messages.length === 1 && !composerOpen ? (
                <>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Choose one</p>
                  <div className="grid gap-1">
                    {quickActions.slice(0, 3).map((action) => (
                      <button key={action} type="button" onClick={() => void sendMessage(action)} className="coach-suggestion">
                        <span>{action}</span><span aria-hidden="true">→</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setComposerOpen(true)} className="coach-own-question">Ask my own question</button>
                </>
              ) : null}

              {messages.length > 1 && !composerOpen && !isLoading ? (
                <div className="coach-response-actions">
                  <button type="button" onClick={() => setComposerOpen(true)}>Ask a follow-up</button>
                  <button type="button" onClick={() => setIsOpen(false)}>Done</button>
                </div>
              ) : null}

              {composerOpen ? <div className="coach-composer">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={2}
                  className="w-full resize-none border-0 bg-transparent text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder={
                    pageKind === "practice"
                      ? "Ask for one hint or a quick check..."
                      : "Ask one focused question..."
                  }
                />
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-slate-400">
                    {recordingState === "recording"
                      ? "Recording now. Tap the mic again when you want me to transcribe it."
                      : recordingState === "transcribing"
                        ? "Transcribing your recording..."
                        : primaryPattern
                          ? `Pattern context: ${primaryPattern.label}`
                          : "Keep it focused"}
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
                      className={`coach-voice-button ${
                        recordingState === "recording"
                          ? "border-coral/20 bg-coral text-white shadow-[0_10px_18px_rgba(255,92,92,0.18)]"
                          : recordingState === "transcribing"
                            ? "cursor-wait border-black/10 bg-black/6 text-black/40"
                            : "text-slate-500"
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
                      className="coach-send-button disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                  </div>
                </div>
              </div> : null}
            </div>
          </>
          </div>
        )}
      </div>
    </aside>
  );
}
