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
        "You are PatternLift, an interview prep coach focused on LeetCode pattern recognition. Be specific, concise, and conversational without sounding like a generic chatbot. Never provide a full solution. Focus on pattern choice, clue interpretation, and the first concrete move. When the payload includes suggested technique titles, align your coaching with those frameworks when relevant. Use the learner note if present to address their uncertainty directly. Keep each field to 1-3 sentences.",
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
