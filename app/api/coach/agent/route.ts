import OpenAI from "openai";
import type { ResponseFunctionToolCall } from "openai/resources/responses/responses";
import { getCurrentUser } from "@/lib/auth";
import { loadRecentAttempts } from "@/lib/attempts-repo";
import type { CoachRequest } from "@/lib/coach";
import {
  buildCoachAgentInput,
  buildCoachAgentInstructions,
  coachAgentTools,
  executeCoachAgentTool
} from "@/lib/coach-agent";

const model = process.env.OPENAI_COACH_MODEL?.trim() || "gpt-4.1-mini";
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type ToolOutput = { type: "function_call_output"; call_id: string; output: string };

export async function POST(request: Request) {
  const body = (await request.json()) as CoachRequest;
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      if (!client) {
        send({
          type: "error",
          message: "Missing OPENAI_API_KEY. Add it to your environment to enable AI coaching."
        });
        controller.close();
        return;
      }

      try {
        const user = await getCurrentUser();
        const attempts = user ? await loadRecentAttempts(user.id) : [];
        const toolContext = {
          problemId: body.problemId ?? null,
          patternId: body.patternId ?? null,
          contrastPatternId: body.contrastPatternId ?? null,
          attempts
        };

        const toolTrace: string[] = [];
        let previousResponseId: string | undefined;
        let input: string | ToolOutput[] = buildCoachAgentInput(body);
        let sawText = false;

        for (let round = 0; round < 4; round += 1) {
          const eventStream = await client.responses.create({
            model,
            instructions: round === 0 ? buildCoachAgentInstructions(body.coachStyle) : undefined,
            input,
            previous_response_id: previousResponseId,
            tools: coachAgentTools,
            tool_choice: "auto",
            max_output_tokens: 260,
            stream: true
          });

          const calls: ResponseFunctionToolCall[] = [];

          for await (const event of eventStream) {
            if (event.type === "response.output_text.delta") {
              sawText = true;
              send({ type: "text_delta", text: event.delta });
            } else if (event.type === "response.output_item.done" && event.item.type === "function_call") {
              calls.push(event.item);
            } else if (event.type === "response.completed") {
              previousResponseId = event.response.id;
            }
          }

          if (calls.length === 0) break;

          input = calls.map((call) => {
            toolTrace.push(call.name);
            send({ type: "tool_call", name: call.name });
            const result = executeCoachAgentTool(call.name, safeArguments(call.arguments), toolContext);
            return {
              type: "function_call_output" as const,
              call_id: call.call_id,
              output: JSON.stringify(result)
            };
          });
        }

        if (!sawText) {
          send({ type: "error", message: "The coach did not send a reply. Please try again." });
        } else {
          send({ type: "done", toolTrace });
        }
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Unable to generate AI coaching right now."
        });
      }

      controller.close();
    }
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

function safeArguments(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}
