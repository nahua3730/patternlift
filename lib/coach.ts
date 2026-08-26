export type AttemptOutcome = "solid" | "partial" | "confused";

export type CoachRequest = {
  studyMode: "learn" | "recognize" | "practice";
  coachStyle: "beginner" | "guided" | "optional" | "off";
  problemTitle: string;
  problemPrompt: string;
  userResponse: string;
  conversationHistory: {
    speaker: "coach" | "user";
    text: string;
  }[];
  selectedPatternLabel: string;
  correctPatternLabel: string;
  contrastPatternLabel: string;
  suggestedTechniques: {
    title: string;
    whyItFits: string;
    starterQuestion: string;
    commonTrap: string;
    quickTips: string[];
    coachMoves: string[];
  }[];
  selectedClues: string[];
  selectedFirstStep: string | null;
  learnerNote: string;
  currentCode: string;
  localOutcome: AttemptOutcome;
  localScore: number;
  reviewQuestion: string;
  inputMethod?: "text" | "voice";
  learnerConfidence?: 1 | 2 | 3;
  problemId?: string;
  patternId?: string;
  contrastPatternId?: string;
};

export type CoachAgentEvent =
  | { type: "tool_call"; name: string }
  | { type: "text_delta"; text: string }
  | { type: "done"; toolTrace: string[] }
  | { type: "error"; message: string };

export async function* parseCoachAgentStream(response: Response): AsyncGenerator<CoachAgentEvent> {
  if (!response.body) {
    yield { type: "error", message: "The coach did not send a response." };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) yield JSON.parse(line) as CoachAgentEvent;
      newlineIndex = buffer.indexOf("\n");
    }
  }

  const trailing = buffer.trim();
  if (trailing) yield JSON.parse(trailing) as CoachAgentEvent;
}

export function buildCoachInstructions(coachStyle: CoachRequest["coachStyle"] = "guided") {
  const styleInstruction =
    coachStyle === "beginner"
      ? "Coaching level: Step-by-step. Explain why the current step matters, use smaller next actions, and define unfamiliar terms without taking over the solution."
      : coachStyle === "optional"
        ? "Coaching level: On demand. Answer only what the learner asked, avoid unsolicited critique, and keep control fully with the learner."
        : coachStyle === "off"
          ? "Coaching level: Off. Do not provide coaching unless the product explicitly asks for a brief status message."
          : "Coaching level: Adaptive. Be quiet on routine correct steps; intervene clearly when there is a misconception, bug, or meaningful decision, and give only the smallest useful next move.";

  return [
    "You are PatternLift, a warm and sharp LeetCode interview-prep coach.",
    styleInstruction,
    "Stay strictly within coding interview patterns and the PatternLift product. Never suggest system-design or behavioral-interview modes.",
    "Respond like a real chat coach, not like a report generator.",
    "React directly to the learner's exact latest message and keep the reply personalized.",
    "If the learner says something casual like 'hi' or 'hihi', greet them briefly and pivot into one useful question about the current problem.",
    "Keep every normal reply extremely concise: 35 to 65 words, with no more than 3 short bullets.",
    "Treat 65 words as a hard limit unless the learner explicitly asks for a detailed explanation.",
    "Answer the immediate question first, then give exactly one next action or one follow-up question.",
    "Do not repeat the learner's question or summarize the entire learning mode before answering.",
    "Use plain text. Do not use markdown headings, bold markers, or decorative formatting.",
    "Do not use section labels like Headline, Hint, Technique, or Next Question.",
    "Do not dump a full solution unless the learner clearly asks for it.",
    "If the learner asks for help, give the smallest useful nudge first.",
    "When useful, mention why a technique fits, why a data structure choice is weak, or how to improve the next step.",
    "If code is present, comment on the actual direction instead of giving generic advice.",
    "Always end with one clear next step or one thoughtful question, not five.",
    "When the learner used voice, behave like an interviewer: evaluate the stated signal and invariant, then ask one probing follow-up without revealing the answer."
  ].join(" ");
}

export function buildCoachInput(body: CoachRequest) {
  const techniqueLines = body.suggestedTechniques
    .slice(0, 4)
    .map(
      (technique) =>
        `- ${technique.title}: fits because ${technique.whyItFits}; ask: ${technique.starterQuestion}; trap: ${technique.commonTrap}`
    )
    .join("\n");

  const historyLines = body.conversationHistory
    .slice(-8)
    .map((message) => `${message.speaker === "coach" ? "Coach" : "Learner"}: ${message.text}`)
    .join("\n");

  return [
    `Study mode: ${body.studyMode}`,
    `Coach style: ${body.coachStyle}`,
    `Problem: ${body.problemTitle}`,
    `Problem statement:\n${body.problemPrompt}`,
    `Learner latest message:\n${body.userResponse}`,
    `Response format: ${body.inputMethod ?? "text"}`,
    `Learner confidence: ${body.learnerConfidence ?? 2}/3`,
    `Conversation so far:\n${historyLines || "No earlier turns."}`,
    `Likely target pattern: ${body.correctPatternLabel}`,
    `Easy-to-confuse neighbor: ${body.contrastPatternLabel}`,
    `Learner's guessed pattern: ${body.selectedPatternLabel}`,
    `Clues already mentioned: ${body.selectedClues.join(", ") || "None yet"}`,
    `First move already mentioned: ${body.selectedFirstStep ?? "None yet"}`,
    `Local scoring signal: ${body.localOutcome} (${body.localScore}/100)`,
    `Review question to keep in mind: ${body.reviewQuestion}`,
    `Useful technique context:\n${techniqueLines || "- None"}`,
    `Learner note:\n${body.learnerNote}`,
    `Current code:\n${body.currentCode || "// no code yet"}`
  ].join("\n\n");
}

export function buildCoachMessages(body: CoachRequest) {
  return [
    {
      role: "system" as const,
      content: buildCoachInstructions(body.coachStyle)
    },
    {
      role: "user" as const,
      content: buildCoachInput(body)
    }
  ];
}
