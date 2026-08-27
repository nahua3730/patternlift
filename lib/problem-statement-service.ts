import OpenAI from "openai";
import { createId, dbExecute, dbOne } from "@/lib/db";
import { getOfficialProblemRoadmapMeta, type AppProblem } from "@/lib/product";
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

export type ProblemStatementResult =
  | { ok: true; source: "native" | "cache" | "generated"; statement: ProblemStatement }
  | { ok: false; error: string };

// Shared by the /statement route (learner-facing "what is this problem" view) and
// the /approaches route (which needs the real statement, not the vague fallback
// placeholder, to generate reliable brute-force/optimized code). Both cache
// through the same problem_statements table so there is exactly one generation
// per problem regardless of which feature triggers it first.
export async function getOrCreateProblemStatement(problem: AppProblem): Promise<ProblemStatementResult> {
  if (hasNativeProblemCodeConfig(problem.id)) {
    return { ok: true, source: "native", statement: { summary: problem.prompt, examples: [], constraints: [] } };
  }

  const cached = await dbOne<{ statement_json: string }>(
    `SELECT statement_json FROM problem_statements WHERE problem_id = ?`,
    [problem.id]
  );
  if (cached) {
    const parsed = JSON.parse(cached.statement_json) as unknown;
    if (isProblemStatement(parsed)) {
      return { ok: true, source: "cache", statement: parsed };
    }
  }

  if (!client) {
    return { ok: false, error: "Missing OPENAI_API_KEY. The problem statement can't be generated right now." };
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
      return { ok: false, error: "Unable to generate the problem statement right now." };
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

    return { ok: true, source: "generated", statement };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to generate the problem statement right now."
    };
  }
}
