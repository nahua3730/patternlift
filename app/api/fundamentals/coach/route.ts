import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { buildFundamentalsCoachMessages, type FundamentalsCoachMessage } from "@/lib/fundamentals-coach";
import { fundamentalsSeries } from "@/lib/fundamentals-series";
import { allProblems } from "@/lib/product";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const problemsById = new Map(allProblems.map((problem) => [problem.id, problem]));

type RequestBody = {
  episode: number;
  userMessage: string;
  conversationHistory: FundamentalsCoachMessage[];
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!client) {
    return new Response("Missing OPENAI_API_KEY. Add it to your environment to enable AI coaching.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const body = (await request.json()) as RequestBody;
  const episode = fundamentalsSeries.find((ep) => ep.episode === body.episode);
  if (!episode) {
    return new Response("Unknown episode.", { status: 400 });
  }

  const problemTitles = [...episode.problemIds, ...(episode.relatedProblemIds ?? [])]
    .map((id) => problemsById.get(id)?.title)
    .filter((title): title is string => Boolean(title));

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: buildFundamentalsCoachMessages({
        episode: episode.episode,
        titleCn: episode.titleCn,
        titleEn: episode.titleEn,
        problemTitles,
        userMessage: body.userMessage,
        conversationHistory: body.conversationHistory ?? []
      }),
      max_completion_tokens: 220,
      stream: true
    });

    const encoder = new TextEncoder();

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
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
    const message = error instanceof Error ? error.message : "Unable to stream AI coaching right now.";
    return new Response(message, { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
