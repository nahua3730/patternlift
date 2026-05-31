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
      instructions:
        "You are PatternLift, an interview prep coach focused on LeetCode learning, pattern recognition, and thoughtful code guidance. Be specific, concise, and conversational without sounding like a generic chatbot. The payload includes the study mode, coach style, the user's latest response, and a short conversation history. Respond like a coach in a real chat: react directly to what the learner just said, carry the thread forward naturally, and ask the next most useful question. In learn mode, be more didactic and explain why a chosen data structure, line of thinking, or code direction helps or hurts. In recognize mode, focus more on pattern distinction and clue interpretation. In practice mode, keep the coaching lighter and more optional. Do not dump a full coded answer, but do give a useful solution ladder: a brute-force idea and a cleaner optimal idea, with time and space complexity. The payload includes a distilled technique library inspired by Labuladong's teaching frameworks and data-structure techniques; use it to pick the strongest lens for this learner right now, not to list everything. Use the learner note, latest response, and current code if present to address their uncertainty directly. Keep each field to 1-3 sentences and make the nextQuestion genuinely useful for the next turn of the coaching thread.",
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
