import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import type { CompareMode, SupportedLanguage } from "@/lib/problem-code";
import ts from "typescript";

const execFileAsync = promisify(execFile);

type RunCodeRequest = {
  language: SupportedLanguage;
  code: string;
  functionName: string;
  compareMode: CompareMode;
  examples: {
    label: string;
    argsExpression: string;
    expectedExpression: string;
  }[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as RunCodeRequest;

  try {
    const examples = body.examples.map((example) => ({
      label: example.label,
      args: evaluateExpression(example.argsExpression),
      expected: evaluateExpression(example.expectedExpression)
    }));

    const runResults =
      body.language === "python"
        ? await runPython(body.code, body.functionName, examples)
        : body.language === "typescript"
          ? await runTypeScript(body.code, body.functionName, examples)
          : body.language === "ruby"
            ? await runRuby(body.code, body.functionName, examples)
            : await runJavaScript(body.code, body.functionName, examples);

    return NextResponse.json({ results: runResults });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run the submitted code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function evaluateExpression(expression: string) {
  return new Function(`return ${expression};`)();
}

async function runJavaScript(
  code: string,
  functionName: string,
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  const filePath = join(tmpdir(), `patternlift-${randomUUID()}.mjs`);
  const payload = JSON.stringify({ functionName, examples });

  const script = `${code}

const payload = ${JSON.stringify(payload)};
const parsed = JSON.parse(payload);
const candidate = globalThis[parsed.functionName] ?? (typeof ${functionName} !== "undefined" ? ${functionName} : null);

if (typeof candidate !== "function") {
  throw new Error("I couldn't find a function named ${functionName}.");
}

const results = parsed.examples.map((example) => ({
  label: example.label,
  actual: candidate(...example.args),
  expected: example.expected
}));

console.log(JSON.stringify(results));
`;

  await fs.writeFile(filePath, script, "utf8");

  try {
    const { stdout, stderr } = await execFileAsync("node", [filePath], {
      timeout: 4000,
      maxBuffer: 1024 * 1024
    });

    if (stderr) {
      throw new Error(stderr.trim());
    }

    return JSON.parse(stdout.trim()) as {
      label: string;
      actual: unknown;
      expected: unknown;
    }[];
  } finally {
    await fs.rm(filePath, { force: true });
  }
}

async function runPython(
  code: string,
  functionName: string,
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  const filePath = join(tmpdir(), `patternlift-${randomUUID()}.py`);
  const payload = JSON.stringify({ functionName, examples });

  const script = `${code}

import json

payload = json.loads(${JSON.stringify(payload)})
candidate = globals().get(payload["functionName"])

if not callable(candidate):
    raise Exception("I couldn't find a function named ${functionName}.")

def to_jsonable(value):
    if isinstance(value, tuple):
        return [to_jsonable(item) for item in value]
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: to_jsonable(val) for key, val in value.items()}
    return value

results = []
for example in payload["examples"]:
    actual = candidate(*example["args"])
    results.append({
        "label": example["label"],
        "actual": to_jsonable(actual),
        "expected": example["expected"],
    })

print(json.dumps(results))
`;

  await fs.writeFile(filePath, script, "utf8");

  try {
    const { stdout, stderr } = await execFileAsync("python3", [filePath], {
      timeout: 4000,
      maxBuffer: 1024 * 1024
    });

    if (stderr) {
      throw new Error(stderr.trim());
    }

    return JSON.parse(stdout.trim()) as {
      label: string;
      actual: unknown;
      expected: unknown;
    }[];
  } finally {
    await fs.rm(filePath, { force: true });
  }
}

async function runTypeScript(
  code: string,
  functionName: string,
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2020
    }
  }).outputText;

  return runJavaScript(transpiled, functionName, examples);
}

async function runRuby(
  code: string,
  functionName: string,
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  const filePath = join(tmpdir(), `patternlift-${randomUUID()}.rb`);
  const payload = JSON.stringify({ functionName, examples });

  const script = `${code}

require "json"

payload = JSON.parse(${JSON.stringify(payload)})
candidate = method(payload["functionName"]) rescue nil

raise "I couldn't find a function named ${functionName}." unless candidate

def to_jsonable(value)
  case value
  when Array
    value.map { |item| to_jsonable(item) }
  when Hash
    value.transform_values { |item| to_jsonable(item) }
  else
    value
  end
end

results = payload["examples"].map do |example|
  actual = candidate.call(*example["args"])
  {
    label: example["label"],
    actual: to_jsonable(actual),
    expected: example["expected"]
  }
end

puts JSON.generate(results)
`;

  await fs.writeFile(filePath, script, "utf8");

  try {
    const { stdout, stderr } = await execFileAsync("ruby", [filePath], {
      timeout: 4000,
      maxBuffer: 1024 * 1024
    });

    if (stderr) {
      throw new Error(stderr.trim());
    }

    return JSON.parse(stdout.trim()) as {
      label: string;
      actual: unknown;
      expected: unknown;
    }[];
  } finally {
    await fs.rm(filePath, { force: true });
  }
}
