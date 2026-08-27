import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { compareValues } from "@/lib/compare-values";
import { createId, dbExecute, dbOne } from "@/lib/db";
import { allProblems } from "@/lib/product";
import {
  getProblemCodeConfig,
  hasNativeProblemCodeConfig,
  languageLabels,
  type SupportedLanguage
} from "@/lib/problem-code";
import { evaluateExpression, runJavaScriptCode, runPython, runTypeScript } from "@/lib/run-javascript";
import {
  buildApproachesSchema,
  validateProblemApproaches,
  type ApproachTier
} from "@/lib/approaches-agent";
import { getOrCreateProblemStatement } from "@/lib/problem-statement-service";

// Only languages with a working, no-external-toolchain (or confirmed-working)
// runner in this deployment get functional verification - matches the same
// set /api/run-code can actually execute in production. Every other
// language still gets code generated in that language, just always shown
// as "unverified" rather than attempting a run that would only ever fail.
const VERIFIABLE_LANGUAGES = new Set<SupportedLanguage>(["javascript", "typescript", "python"]);

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return Boolean(value) && Object.hasOwn(languageLabels, value as SupportedLanguage);
}

async function runForVerification(
  language: SupportedLanguage,
  code: string,
  functionName: string,
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  if (language === "python") return runPython(code, functionName, examples);
  if (language === "typescript") return runTypeScript(code, functionName, examples);
  return runJavaScriptCode(code, functionName, examples);
}

const model = process.env.OPENAI_APPROACHES_MODEL?.trim() || "gpt-4.1-mini";
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function isApproachTierArray(value: unknown): value is ApproachTier[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => entry && typeof entry === "object" && typeof (entry as { code?: unknown }).code === "string")
  );
}

export async function GET(request: Request, { params }: { params: { problemId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const problem = allProblems.find((entry) => entry.id === params.problemId);
  if (!problem) return NextResponse.json({ error: "Unknown problem" }, { status: 404 });

  const requestedLanguage = new URL(request.url).searchParams.get("language");
  const language: SupportedLanguage = isSupportedLanguage(requestedLanguage) ? requestedLanguage : "javascript";
  const languageLabel = languageLabels[language];
  // Cache is keyed per (problem, language) - no schema change needed, the
  // language just becomes part of the existing problem_id cache key. Real
  // problem ids never contain "::", so this can't collide with a real id.
  const cacheKey = `${problem.id}::${language}`;

  const cached = await dbOne<{ approaches_json: string }>(
    `SELECT approaches_json FROM problem_approaches WHERE problem_id = ?`,
    [cacheKey]
  );
  if (cached) {
    const parsedCache = JSON.parse(cached.approaches_json) as unknown;
    if (isApproachTierArray(parsedCache)) {
      return NextResponse.json({ source: "cache", approaches: parsedCache });
    }
    // Older cache rows predate the code/verified fields - fall through and regenerate.
  }

  if (!client) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY. Approaches can't be generated right now." },
      { status: 503 }
    );
  }

  const codeConfig = getProblemCodeConfig(problem);
  const verifiable = hasNativeProblemCodeConfig(problem.id) && VERIFIABLE_LANGUAGES.has(language);
  const functionName = codeConfig.functionName;
  const schema = buildApproachesSchema(functionName, languageLabel);

  // For auto-generated problems, problem.prompt is just a generic roadmap
  // placeholder - use the real statement (same one the Problem tab shows) so
  // the model is generating code against the actual problem, not a guess from
  // the title alone. Falls back to problem.prompt if statement generation fails.
  const statementResult = await getOrCreateProblemStatement(problem);
  const problemContext = statementResult.ok
    ? [
        statementResult.statement.summary,
        statementResult.statement.examples.length > 0
          ? statementResult.statement.examples
              .map((example) => `Example: input ${example.input} -> output ${example.output}`)
              .join("\n")
          : null,
        statementResult.statement.constraints.length > 0
          ? `Constraints: ${statementResult.statement.constraints.join("; ")}`
          : null
      ]
        .filter(Boolean)
        .join("\n\n")
    : problem.prompt;

  try {
    const response = await client.responses.create({
      model,
      instructions: [
        "You are a technical interview coach writing worked solutions for a coding problem.",
        "Give 2 to 3 approach tiers in increasing sophistication - typically Brute Force, then Optimized, and optionally a further-optimized tier if a meaningfully better one exists.",
        `For each tier: name it clearly, describe the core strategy in 1-2 sentences, and write COMPLETE, CORRECT, runnable ${languageLabel} defining a function named exactly "${functionName}" that implements that specific tier's approach. The code must be ${languageLabel}, not any other language.`,
        "timeComplexity and spaceComplexity must be ONLY the bare Big-O notation and nothing else - exactly \"O(n)\", \"O(n log n)\", \"O(1)\", etc, with no explanation, no variable definitions, and no trailing words appended.",
        "The code must be self-contained (no imports, no external libraries), must actually return the answer (not console.log it), and must be directly callable with the problem's inputs as positional arguments.",
        "Complexity and code correctness matter more than anything else here - this is used to help someone study for real technical interviews.",
        "Keep each tier's code reasonably concise but complete - do not omit logic or leave placeholders."
      ].join(" "),
      input: `Problem: ${problem.title}\n\n${problemContext}`,
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: "problem_approaches",
          description: "Approach tiers with complexity and working code for a coding interview problem.",
          strict: true,
          schema
        }
      },
      max_output_tokens: 2400
    });

    if (response.status === "incomplete") {
      return NextResponse.json(
        { error: "The generated approaches were too long to finish - try again." },
        { status: 500 }
      );
    }

    let parsed: unknown = null;
    try {
      parsed = response.output_text ? JSON.parse(response.output_text) : null;
    } catch {
      return NextResponse.json(
        { error: "The generated approaches were cut off before finishing - try again." },
        { status: 500 }
      );
    }
    const approaches = validateProblemApproaches(parsed, functionName, language);
    if (!approaches) {
      return NextResponse.json({ error: "Unable to generate approaches for this problem." }, { status: 500 });
    }

    if (verifiable) {
      const examples = codeConfig.examples.map((example) => ({
        label: example.label,
        args: evaluateExpression(example.argsExpression) as unknown[],
        expected: evaluateExpression(example.expectedExpression)
      }));

      for (const tier of approaches) {
        try {
          const results = await runForVerification(language, tier.code, functionName, examples);
          tier.verified =
            results.length > 0 &&
            results.every((result) => compareValues(result.actual, result.expected, codeConfig.compareMode ?? "strict"));
        } catch {
          tier.verified = false;
        }
      }
    }

    await dbExecute(
      `
        INSERT INTO problem_approaches (id, problem_id, model, approaches_json)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (problem_id) DO UPDATE SET
          model = excluded.model,
          approaches_json = excluded.approaches_json
      `,
      [createId("approaches"), cacheKey, model, JSON.stringify(approaches)]
    );

    return NextResponse.json({ source: "generated", approaches });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate approaches right now." },
      { status: 500 }
    );
  }
}
