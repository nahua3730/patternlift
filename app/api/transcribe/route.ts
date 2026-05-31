import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  if (!client) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY. Add it to your environment to enable voice transcription." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No audio file was provided." }, { status: 400 });
    }

    const transcript = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      response_format: "text"
    });

    const text = typeof transcript === "string" ? transcript.trim() : "";
    if (!text) {
      return NextResponse.json(
        { error: "The recording came back empty. Try a slightly longer note." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to transcribe audio right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
