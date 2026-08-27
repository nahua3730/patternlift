import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createId, dbExecute, dbOne } from "@/lib/db";
import { allProblems, getOfficialProblemRoadmapMeta } from "@/lib/product";
import { hasNativeProblemCodeConfig } from "@/lib/problem-code";
import {
  problemStatementSchema,
  validateProblemStatement,
  type ProblemStatement
} from "@/lib/problem-statement-agent";

const model = process.env.OPENAI_STATEMENT_MODEL?.trim() || "gpt-4.1-mini";
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function isProblemStatement(value: unknown): value is ProblemStatement {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Array.isArray((value as { examples?: unknown }).examples) &&
    typeof (value as { summary?: unknown }).summary === "string"
  );
}

export async function GET(request: Request, { params }: { params: { problemId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const problem = allProblems.find((entry) => entry.id === params.problemId);
  if (!problem) return NextResponse.json({ error: "Unknown problem" }, { status: 404 });

  if (hasNativeProblemCodeConfig(problem.id)) {
    return NextResponse.json({
      source: "native",
      statement: { summary: problem.prompt, examples: [], constraints: [] }
    });
  }

  const cached = await dbOne<{ statement_json: string }>(
    `SELECT statement_json FROM problem_statements WHERE problem_id = ?`,
    [problem.id]
  );
  if (cached) {
    const parsed = JSON.parse(cached.statement_json) as unknown;
    if (isProblemStatement(parsed)) {
      return NextResponse.json({ source: "cache", statement: parsed });
    }
  }

  if (!client) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY. The problem statement can't be generated right now." },
      { status: 503 }
    );
  }

  const meta = getOfficialProblemRoadmapMeta(problem.id);

  try {
    const response = await client.responses.create({
      model,
      instructions: [
        "You reproduce the real, well-known LeetCode problem statement for a given problem so a learner can read it without leaving the app.",
        "Write the complete description faithfully - the actual framing of this specific, real, publicly documented problem - not a generic summary and not a paraphrase that loses precision.",
        "The `summary` field is ONLY the narrative description (what the problem is asking, any function-signature-relevant notes). Do NOT include worked examples or the constraints list inside `summary` - those belong exclusively in the separate `examples` and `constraints` fields, so nothing is duplicated between them.",
        "Put 2 to 4 worked examples in `examples`, each with concrete input, output, and a short explanation of why that output is correct.",
        "Put the real constraints (input size bounds, value ranges, etc.) in `constraints` as short individual bullet strings.",
        "Do not include a solution, hints, or approach anywhere - only the problem statement itself, as it would appear before anyone starts solving it."
      ].join(" "),
      input: [
        `Problem title: ${problem.title}`,
        meta?.leetcodeNumber ? `LeetCode number: ${meta.leetcodeNumber}` : null,
        `Category: ${problem.category}`
      ]
        .filter(Boolean)
        .join("\n"),
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: "problem_statement",
          description: "The real problem statement, examples, and constraints for a coding interview problem.",
          strict: true,
          schema: problemStatementSchema
        }
      },
      max_output_tokens: 1200
    });

    const parsed = response.output_text ? (JSON.parse(response.output_text) as unknown) : null;
    const statement = validateProblemStatement(parsed);
    if (!statement) {
      return NextResponse.json({ error: "Unable to generate the problem statement right now." }, { status: 500 });
    }

    await dbExecute(
      `
        INSERT INTO problem_statements (id, problem_id, model, statement_json)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (problem_id) DO UPDATE SET
          model = excluded.model,
          statement_json = excluded.statement_json
      `,
      [createId("statement"), problem.id, model, JSON.stringify(statement)]
    );

    return NextResponse.json({ source: "generated", statement });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate the problem statement right now." },
      { status: 500 }
    );
  }
}
