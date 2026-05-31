import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  coachResponseSchema,
  type CoachRequest,
  type CoachResponse
} from "@/lib/coach";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  if (!client) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY. Add it to your environment to enable AI coaching." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as CoachRequest;

  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      max_output_tokens: 350,
      instructions:
        "You are PatternLift, an interview prep coach focused on LeetCode learning, pattern recognition, and thoughtful code guidance. The payload includes the study mode, coach style, the user's latest response, and a short conversation history. Respond like a real chat coach: react directly to the learner's exact words, carry the thread forward naturally, and ask the next most useful question. Be warm, specific, and personalized, not generic or stubborn. In learn mode, explain why the next step helps. In recognize mode, focus on clue interpretation and pattern distinction. In practice mode, keep the reply lighter and more optional. Do not dump a full coded answer. Keep every field short: one crisp sentence when possible, two at most. Avoid long recaps, avoid listing everything you know, and prioritize the learner's immediate confusion over a full report. Make nextHint and nextQuestion especially short and useful for the next turn.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(body)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "patternlift_coach_feedback",
          strict: true,
          schema: coachResponseSchema
        }
      }
    });

    const parsed = JSON.parse(response.output_text) as CoachResponse;
    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate AI coaching right now.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
