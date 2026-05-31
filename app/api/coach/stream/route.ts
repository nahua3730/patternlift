import OpenAI from "openai";
import {
  buildCoachMessages,
  type CoachRequest
} from "@/lib/coach";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  if (!client) {
    return new Response("Missing OPENAI_API_KEY. Add it to your environment to enable AI coaching.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const body = (await request.json()) as CoachRequest;

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: buildCoachMessages(body),
      max_completion_tokens: 220,
      stream: true
    });

    const encoder = new TextEncoder();

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
        } catch (error) {
          controller.error(error);
          return;
        }

        controller.close();
      }
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to stream AI coaching right now.";

    return new Response(message, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
