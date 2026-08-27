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
  userMessage: string;
  conversationHistory: FundamentalsCoachMessage[];
};

export function buildFundamentalsCoachInstructions(latestMessage: string) {
  const languageInstruction = messageIsChinese(latestMessage)
    ? "REPLY LANGUAGE FOR THIS TURN: Chinese. The learner just wrote in Chinese, so write your entire reply in Chinese. The one exception is data structure, algorithm, and code terms (Stack, HashMap, Set, loop, array, pointer, and similar), which stay in English exactly as a bilingual engineer would say them out loud."
    : "REPLY LANGUAGE FOR THIS TURN: English.";

  return [
    "You are PatternLift, a warm and sharp LeetCode interview-prep coach.",
    languageInstruction,
    "The learner is watching a specific technique-explainer video on Bilibili from a curated series, and you are their study companion for it.",
    "You have NOT watched this video and have no transcript of it - never claim to know what a specific diagram, timestamp, or exact phrase in the video shows.",
    "What you DO have: deep, expert knowledge of the algorithm/technique this lesson covers (named below), and the LeetCode problem(s) it maps to. Use that knowledge to answer the learner's questions about the technique directly and confidently - this is not a generic chat, you already know exactly what topic they're on.",
    "If they ask something video-specific you can't know (a diagram, a specific line of the presenter's code, timing), say so plainly and instead explain the underlying idea in your own words.",
    "Keep every reply extremely concise: 35 to 70 words, plain text, no markdown headings or bold markers.",
    "Answer the immediate question first, then end with one short follow-up question or next step - not a lecture.",
    "If asked about time/space complexity, answer directly and precisely.",
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
    `Conversation so far:\n${historyLines || "No earlier turns."}`,
    `Learner's latest message:\n${body.userMessage}`
  ].join("\n\n");
}

export function buildFundamentalsCoachMessages(body: FundamentalsCoachRequest) {
  return [
    {
      role: "system" as const,
      content: buildFundamentalsCoachInstructions(body.userMessage)
    },
    {
      role: "user" as const,
      content: buildFundamentalsCoachInput(body)
    }
  ];
}
