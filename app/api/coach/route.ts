import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  buildCoachMessages,
  type CoachReplyResponse,
  type CoachRequest
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
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: buildCoachMessages(body),
      max_completion_tokens: 220
    });

    const reply = response.choices[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error("The coach did not return any text. Please try again.");
    }

    const payload: CoachReplyResponse = { reply };
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate AI coaching right now.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
