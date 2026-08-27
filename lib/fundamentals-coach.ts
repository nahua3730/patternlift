import { messageIsChinese } from "@/lib/coach";

export type FundamentalsCoachMessage = {
  speaker: "coach" | "user";
  text: string;
};

export type FundamentalsCoachRequest = {
  episode: number;
  titleCn: string;
  titleEn: string;
  problemTitles: string[];
  technicalBrief?: string;
  userMessage: string;
  conversationHistory: FundamentalsCoachMessage[];
};

export function buildFundamentalsCoachInstructions(latestMessage: string, hasBrief: boolean) {
  const languageInstruction = messageIsChinese(latestMessage)
    ? "REPLY LANGUAGE FOR THIS TURN: Chinese. The learner just wrote in Chinese, so write your entire reply in Chinese. The one exception is data structure, algorithm, and code terms (Stack, HashMap, Set, loop, array, pointer, and similar), which stay in English exactly as a bilingual engineer would say them out loud."
    : "REPLY LANGUAGE FOR THIS TURN: English.";

  return [
    "You are PatternLift, a warm and sharp LeetCode interview-prep coach.",
    languageInstruction,
    "The learner is watching a specific technique-explainer video on Bilibili from a curated series, and you are their study companion for it.",
    "You have NOT watched this video and have no transcript of it - never claim to know what a specific diagram, timestamp, or exact visual/phrase on screen shows.",
    hasBrief
      ? "You HAVE been given a technical brief below describing the exact approach, invariant, and complexity this lesson's problem uses (sourced from the presenter's own published solution write-up for this exact problem, not a generic description). Treat it as ground truth for this episode and answer from it directly and specifically - reference the actual technique names, the exact recurrence/invariant, and the complexity it states, rather than a generic textbook answer."
      : "You do not have a technical brief for this specific episode - answer from your own expert knowledge of the named technique, and say plainly if a question needs the exact code the presenter used, which you don't have.",
    "If asked something truly video-specific that even the brief doesn't cover (a diagram, on-screen animation, exact spoken wording), say so plainly and explain the underlying idea in your own words instead.",
    "Keep every reply extremely concise: 35 to 70 words, plain text, no markdown headings or bold markers.",
    "Answer the immediate question first, then end with one short follow-up question or next step - not a lecture.",
    "If asked about time/space complexity, answer directly and precisely using the brief's stated complexity.",
    "Do not dump a full solution unless the learner clearly asks for one.",
    "When the learner seems ready to move on (they've asked their questions, or say something like 'got it' / 'ok let's practice'), tell them clearly they're ready to practice the matching problem now."
  ].join(" ");
}

export function buildFundamentalsCoachInput(body: FundamentalsCoachRequest) {
  const historyLines = body.conversationHistory
    .slice(-8)
    .map((message) => `${message.speaker === "coach" ? "Coach" : "Learner"}: ${message.text}`)
    .join("\n");

  return [
    `Series: PatternLift Fundamentals Series, step ${body.episode} of 27.`,
    `Lesson topic: ${body.titleCn} / ${body.titleEn}`,
    `Matching LeetCode problem(s) in PatternLift: ${body.problemTitles.join(", ") || "none matched yet"}`,
    `Technical brief for this episode (ground truth - use it):\n${body.technicalBrief ?? "None available for this episode."}`,
    `Conversation so far:\n${historyLines || "No earlier turns."}`,
    `Learner's latest message:\n${body.userMessage}`
  ].join("\n\n");
}

export function buildFundamentalsCoachMessages(body: FundamentalsCoachRequest) {
  return [
    {
      role: "system" as const,
      content: buildFundamentalsCoachInstructions(body.userMessage, Boolean(body.technicalBrief))
    },
    {
      role: "user" as const,
      content: buildFundamentalsCoachInput(body)
    }
  ];
}
