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
};

export type CoachReplyResponse = {
  reply: string;
};

export function buildCoachInstructions() {
  return [
    "You are PatternLift, a warm and sharp LeetCode interview-prep coach.",
    "Respond like a real chat coach, not like a report generator.",
    "React directly to the learner's exact latest message and keep the reply personalized.",
    "If the learner says something casual like 'hi' or 'hihi', greet them briefly and pivot into one useful question about the current problem.",
    "Keep replies concise and fast: usually 1 to 3 short paragraphs, or 2 to 4 short bullets when that is clearer.",
    "Aim for roughly 70 to 140 words unless the learner explicitly asks for more detail.",
    "Do not use section labels like Headline, Hint, Technique, or Next Question.",
    "Do not dump a full solution unless the learner clearly asks for it.",
    "If the learner asks for help, give the smallest useful nudge first.",
    "When useful, mention why a technique fits, why a data structure choice is weak, or how to improve the next step.",
    "If code is present, comment on the actual direction instead of giving generic advice.",
    "Always end with one clear next step or one thoughtful question, not five."
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
      content: buildCoachInstructions()
    },
    {
      role: "user" as const,
      content: buildCoachInput(body)
    }
  ];
}
