import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function evaluateExpression(expression: string) {
  return new Function(`return ${expression};`)();
}

export async function runJavaScriptCode(
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
