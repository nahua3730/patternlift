import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createId, dbExecute, dbOne } from "@/lib/db";
import { allProblems } from "@/lib/product";
import { approachesSchema, validateProblemApproaches, type ProblemApproaches } from "@/lib/approaches-agent";

const model = process.env.OPENAI_APPROACHES_MODEL?.trim() || "gpt-4.1-mini";
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function GET(request: Request, { params }: { params: { problemId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const problem = allProblems.find((entry) => entry.id === params.problemId);
  if (!problem) return NextResponse.json({ error: "Unknown problem" }, { status: 404 });

  const cached = await dbOne<{ approaches_json: string }>(
    `SELECT approaches_json FROM problem_approaches WHERE problem_id = ?`,
    [problem.id]
  );
  if (cached) {
    const parsed = JSON.parse(cached.approaches_json) as ProblemApproaches;
    return NextResponse.json({ source: "cache", ...parsed });
  }

  if (!client) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY. Approaches can't be generated right now." },
      { status: 503 }
    );
  }

  try {
    const response = await client.responses.create({
      model,
      instructions: [
        "You are a technical interview coach writing a concise approaches summary for a coding problem.",
        "Give 2 to 3 approach tiers in increasing sophistication - typically Brute Force, then Optimized, and optionally a further-optimized tier if a meaningfully better one exists.",
        "For each tier: name it clearly, describe the core strategy in 1-2 sentences WITHOUT writing code or pseudocode, and state its time and space complexity in strict Big-O notation such as O(n), O(n log n), or O(1).",
        "Complexity must be accurate for the approach described - this helps someone study for real technical interviews, so correctness matters more than anything else here.",
        "Describe the strategy only. Do not reveal a full working solution."
      ].join(" "),
      input: `Problem: ${problem.title}\n\n${problem.prompt}`,
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: "problem_approaches",
          description: "Approach tiers with complexity for a coding interview problem.",
          strict: true,
          schema: approachesSchema
        }
      },
      max_output_tokens: 600
    });

    const parsed = response.output_text ? (JSON.parse(response.output_text) as unknown) : null;
    const validated = validateProblemApproaches(parsed);
    if (!validated) {
      return NextResponse.json({ error: "Unable to generate approaches for this problem." }, { status: 500 });
    }

    await dbExecute(
      `
        INSERT INTO problem_approaches (id, problem_id, model, approaches_json)
        SELECT ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM problem_approaches WHERE problem_id = ?)
      `,
      [createId("approaches"), problem.id, model, JSON.stringify(validated), problem.id]
    );

    return NextResponse.json({ source: "generated", ...validated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate approaches right now." },
      { status: 500 }
    );
  }
}
