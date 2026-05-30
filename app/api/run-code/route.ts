import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import type {
  CompareMode,
  SupportedLanguage,
  ValueType
} from "@/lib/problem-code";
import ts from "typescript";

const execFileAsync = promisify(execFile);

type RunCodeRequest = {
  language: SupportedLanguage;
  code: string;
  functionName: string;
  signature?: {
    params: { name: string; type: ValueType }[];
    returnType: ValueType;
  };
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
            : body.language === "c"
              ? await runC(body.code, body.functionName, body.signature, examples)
            : body.language === "java"
              ? await runJava(body.code, body.functionName, body.signature, examples)
              : body.language === "cpp"
                ? await runCpp(body.code, body.functionName, body.signature, examples)
                : body.language === "swift"
                  ? await runSwift(body.code, body.functionName, body.signature, examples)
                  : body.language === "go"
                    ? await runGo(body.code, body.functionName, body.signature, examples)
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

async function runC(
  code: string,
  functionName: string,
  signature: RunCodeRequest["signature"],
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  if (!signature) {
    throw new Error("C runner is not available for this problem yet.");
  }

  const tempDir = join(tmpdir(), `patternlift-${randomUUID()}`);
  const filePath = join(tempDir, "runner.c");
  const binPath = join(tempDir, "runner");
  await fs.mkdir(tempDir, { recursive: true });

  const script = `#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${code}

void printEscapedString(const char* value) {
  if (value == NULL) {
    printf("null");
    return;
  }

  printf("\\"");
  for (const char* current = value; *current != '\\0'; current++) {
    if (*current == '\\\\') printf("\\\\\\\\");
    else if (*current == '\\"') printf("\\\\\\"");
    else if (*current == '\\n') printf("\\\\n");
    else putchar(*current);
  }
  printf("\\"");
}

void printJsonInt(int value) { printf("%d", value); }
void printJsonBool(bool value) { printf(value ? "true" : "false"); }
void printJsonString(const char* value) { printEscapedString(value); }

int main(void) {
  printf("[");
${examples
  .map((example, index) => {
    const args = buildCArgumentList(example.args, signature.params);
    const resultType = toCResultType(signature.returnType);
    return `  ${resultType} result${index} = ${functionName}(${args});
  if (${index} > 0) printf(",");
  printf("{\\"label\\":\\"${escapeForSource(example.label)}\\",\\"actual\\":");
  ${buildCPrintStatement(`result${index}`, signature.returnType)}
  printf(",\\"expected\\":");
  ${buildCPrintStatement(buildCLiteral(example.expected, signature.returnType), signature.returnType)}
  printf("}");`;
  })
  .join("\n")}
  printf("]");
  return 0;
}
`;

  await fs.writeFile(filePath, script, "utf8");

  try {
    await execFileAsync("clang", [filePath, "-o", binPath], {
      timeout: 8000,
      maxBuffer: 1024 * 1024
    });
    const { stdout, stderr } = await execFileAsync(binPath, [], {
      timeout: 8000,
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
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runJava(
  code: string,
  functionName: string,
  signature: RunCodeRequest["signature"],
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  if (!signature) {
    throw new Error("Java runner is not available for this problem yet.");
  }

  const tempDir = join(tmpdir(), `patternlift-${randomUUID()}`);
  const filePath = join(tempDir, "Runner.java");
  await fs.mkdir(tempDir, { recursive: true });

  const script = `${code}

class Runner {
  static String escape(String value) {
    return value
      .replace("\\\\", "\\\\\\\\")
      .replace("\\\"", "\\\\\\\"")
      .replace("\\n", "\\\\n");
  }

  static String toJson(Object value, String type) {
    if (type.equals("int")) return String.valueOf((Integer) value);
    if (type.equals("bool")) return ((Boolean) value) ? "true" : "false";
    if (type.equals("string")) return "\\"" + escape((String) value) + "\\"";
    if (type.equals("intArray")) return intArrayToJson((int[]) value);
    if (type.equals("stringArray")) return stringArrayToJson((String[]) value);
    if (type.equals("intMatrix") || type.equals("pointArray")) return intMatrixToJson((int[][]) value);
    if (type.equals("charMatrix")) return charMatrixToJson((char[][]) value);
    if (type.equals("nestedIntArray")) return nestedIntListToJson((java.util.List<java.util.List<Integer>>) value);
    return "null";
  }

  static String intArrayToJson(int[] arr) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < arr.length; i++) {
      if (i > 0) sb.append(",");
      sb.append(arr[i]);
    }
    sb.append("]");
    return sb.toString();
  }

  static String stringArrayToJson(String[] arr) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < arr.length; i++) {
      if (i > 0) sb.append(",");
      sb.append("\\"").append(escape(arr[i])).append("\\"");
    }
    sb.append("]");
    return sb.toString();
  }

  static String intMatrixToJson(int[][] matrix) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < matrix.length; i++) {
      if (i > 0) sb.append(",");
      sb.append(intArrayToJson(matrix[i]));
    }
    sb.append("]");
    return sb.toString();
  }

  static String charMatrixToJson(char[][] matrix) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < matrix.length; i++) {
      if (i > 0) sb.append(",");
      sb.append("[");
      for (int j = 0; j < matrix[i].length; j++) {
        if (j > 0) sb.append(",");
        sb.append("\\"").append(escape(String.valueOf(matrix[i][j]))).append("\\"");
      }
      sb.append("]");
    }
    sb.append("]");
    return sb.toString();
  }

  static String nestedIntListToJson(java.util.List<java.util.List<Integer>> value) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < value.size(); i++) {
      if (i > 0) sb.append(",");
      sb.append("[");
      java.util.List<Integer> inner = value.get(i);
      for (int j = 0; j < inner.size(); j++) {
        if (j > 0) sb.append(",");
        sb.append(inner.get(j));
      }
      sb.append("]");
    }
    sb.append("]");
    return sb.toString();
  }

  public static void main(String[] args) {
    Solution solution = new Solution();
    StringBuilder sb = new StringBuilder("[");
${examples
  .map((example, index) => {
    const args = signature.params
      .map((param, paramIndex) =>
        buildJavaLiteral(example.args[paramIndex], param.type)
      )
      .join(", ");
    return `    Object result${index} = solution.${functionName}(${args});
    if (${index} > 0) sb.append(",");
    sb.append("{\\"label\\":\\"${escapeForSource(example.label)}\\",\\"actual\\":")
      .append(toJson(result${index}, "${signature.returnType}"))
      .append(",\\"expected\\":")
      .append(toJson(${buildJavaLiteral(example.expected, signature.returnType)}, "${signature.returnType}"))
      .append("}");`;
  })
  .join("\n")}
    sb.append("]");
    System.out.println(sb.toString());
  }
}
`;

  await fs.writeFile(filePath, script, "utf8");

  try {
    await execFileAsync("javac", [filePath], {
      timeout: 8000,
      maxBuffer: 1024 * 1024
    });
    const { stdout, stderr } = await execFileAsync("java", ["-cp", tempDir, "Runner"], {
      timeout: 8000,
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
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runCpp(
  code: string,
  functionName: string,
  signature: RunCodeRequest["signature"],
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  if (!signature) {
    throw new Error("C++ runner is not available for this problem yet.");
  }

  const tempDir = join(tmpdir(), `patternlift-${randomUUID()}`);
  const filePath = join(tempDir, "runner.cpp");
  const binPath = join(tempDir, "runner");
  await fs.mkdir(tempDir, { recursive: true });

  const script = `#include <iostream>
#include <string>
#include <type_traits>
#include <vector>
using namespace std;

${code}

string escapeJson(const string& value) {
  string result;
  for (char c : value) {
    if (c == '\\\\') result += "\\\\\\\\";
    else if (c == '\"') result += "\\\\\\"";
    else if (c == '\\n') result += "\\\\n";
    else result += c;
  }
  return result;
}

string toJson(const int& value) { return to_string(value); }
string toJson(const bool& value) { return value ? "true" : "false"; }
string toJson(const string& value) { return "\\\"" + escapeJson(value) + "\\\""; }
string toJson(const vector<int>& values) {
  string result = "[";
  for (size_t i = 0; i < values.size(); ++i) {
    if (i) result += ",";
    result += to_string(values[i]);
  }
  result += "]";
  return result;
}
string toJson(const vector<string>& values) {
  string result = "[";
  for (size_t i = 0; i < values.size(); ++i) {
    if (i) result += ",";
    result += "\\\"" + escapeJson(values[i]) + "\\\"";
  }
  result += "]";
  return result;
}
template <typename T>
string matrixToJson(const vector<vector<T>>& values) {
  string result = "[";
  for (size_t i = 0; i < values.size(); ++i) {
    if (i) result += ",";
    result += "[";
    for (size_t j = 0; j < values[i].size(); ++j) {
      if (j) result += ",";
      if constexpr (is_same_v<T, char>) result += "\\\"" + escapeJson(string(1, values[i][j])) + "\\\"";
      else result += to_string(values[i][j]);
    }
    result += "]";
  }
  result += "]";
  return result;
}
string toJson(const vector<vector<int>>& values) { return matrixToJson(values); }
string toJson(const vector<vector<char>>& values) { return matrixToJson(values); }

int main() {
  Solution solution;
  string result = "[";
${examples
  .map((example, index) => {
    const args = signature.params
      .map((param, paramIndex) =>
        buildCppLiteral(example.args[paramIndex], param.type)
      )
      .join(", ");
    return `  auto result${index} = solution.${functionName}(${args});
  if (${index} > 0) result += ",";
  result += "{\\"label\\":\\"${escapeForSource(example.label)}\\",\\"actual\\":" + toJson(result${index}) + ",\\"expected\\":" + toJson(${buildCppLiteral(example.expected, signature.returnType)}) + "}";`;
  })
  .join("\n")}
  result += "]";
  cout << result;
  return 0;
}
`;

  await fs.writeFile(filePath, script, "utf8");

  try {
    await execFileAsync("g++", ["-std=c++17", filePath, "-o", binPath], {
      timeout: 8000,
      maxBuffer: 1024 * 1024
    });
    const { stdout, stderr } = await execFileAsync(binPath, [], {
      timeout: 8000,
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
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runSwift(
  code: string,
  functionName: string,
  signature: RunCodeRequest["signature"],
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  if (!signature) {
    throw new Error("Swift runner is not available for this problem yet.");
  }

  const tempDir = join(tmpdir(), `patternlift-${randomUUID()}`);
  const filePath = join(tempDir, "Runner.swift");
  const binPath = join(tempDir, "runner");
  await fs.mkdir(tempDir, { recursive: true });

  const script = `import Foundation

${code}

func toJsonCompatible(_ value: Any, type: String) -> Any {
  switch type {
  case "int", "bool", "string":
    return value
  case "intArray":
    return value as! [Int]
  case "stringArray":
    return value as! [String]
  case "intMatrix", "pointArray", "nestedIntArray":
    return value as! [[Int]]
  case "charMatrix":
    return (value as! [[Character]]).map { row in row.map { String($0) } }
  default:
    return NSNull()
  }
}

let results: [[String: Any]] = [
${examples
  .map((example) => {
    const args = signature.params
      .map((param, paramIndex) => buildSwiftLiteral(example.args[paramIndex], param.type))
      .join(", ");
    return `  [
    "label": "${escapeForSource(example.label)}",
    "actual": toJsonCompatible(${functionName}(${args}), type: "${signature.returnType}"),
    "expected": toJsonCompatible(${buildSwiftLiteral(example.expected, signature.returnType)}, type: "${signature.returnType}")
  ]`;
  })
  .join(",\n")}
]

let data = try JSONSerialization.data(withJSONObject: results, options: [])
print(String(data: data, encoding: .utf8)!)
`;

  await fs.writeFile(filePath, script, "utf8");

  try {
    await execFileAsync("swiftc", [filePath, "-o", binPath], {
      timeout: 8000,
      maxBuffer: 1024 * 1024
    });
    const { stdout, stderr } = await execFileAsync(binPath, [], {
      timeout: 8000,
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
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runGo(
  code: string,
  functionName: string,
  signature: RunCodeRequest["signature"],
  examples: { label: string; args: unknown[]; expected: unknown }[]
) {
  if (!signature) {
    throw new Error("Go runner is not available for this problem yet.");
  }

  const tempDir = join(tmpdir(), `patternlift-${randomUUID()}`);
  const filePath = join(tempDir, "runner.go");
  await fs.mkdir(tempDir, { recursive: true });

  const script = `package main

import (
  "encoding/json"
  "fmt"
)

${code}

func toJSONCompatible(value any, kind string) any {
  switch kind {
  case "int", "bool", "string":
    return value
  case "intArray":
    return value.([]int)
  case "stringArray":
    return value.([]string)
  case "intMatrix", "pointArray", "nestedIntArray":
    return value.([][]int)
  case "charMatrix":
    rows := value.([][]byte)
    converted := make([][]string, len(rows))
    for i, row := range rows {
      converted[i] = make([]string, len(row))
      for j, ch := range row {
        converted[i][j] = string(ch)
      }
    }
    return converted
  default:
    return nil
  }
}

type runResult struct {
  Label string \`json:"label"\`
  Actual any \`json:"actual"\`
  Expected any \`json:"expected"\`
}

func main() {
  results := []runResult{
${examples
  .map((example) => {
    const args = signature.params
      .map((param, paramIndex) => buildGoLiteral(example.args[paramIndex], param.type))
      .join(", ");
    return `    {
      Label: "${escapeForSource(example.label)}",
      Actual: toJSONCompatible(${functionName}(${args}), "${signature.returnType}"),
      Expected: toJSONCompatible(${buildGoLiteral(example.expected, signature.returnType)}, "${signature.returnType}"),
    },`;
  })
  .join("\n")}
  }

  payload, err := json.Marshal(results)
  if err != nil {
    panic(err)
  }
  fmt.Print(string(payload))
}
`;

  await fs.writeFile(filePath, script, "utf8");

  try {
    const { stdout, stderr } = await execFileAsync("go", ["run", filePath], {
      timeout: 8000,
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
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function buildJavaLiteral(value: unknown, type: ValueType): string {
  switch (type) {
    case "int":
      return String(value);
    case "bool":
      return value ? "true" : "false";
    case "string":
      return `"${escapeForSource(String(value))}"`;
    case "intArray":
      return `new int[]{${(value as number[]).join(", ")}}`;
    case "stringArray":
      return `new String[]{${(value as string[]).map((item) => `"${escapeForSource(item)}"`).join(", ")}}`;
    case "intMatrix":
    case "pointArray":
      return `new int[][]{${(value as number[][])
        .map((row) => `{${row.join(", ")}}`)
        .join(", ")}}`;
    case "charMatrix":
      return `new char[][]{${(value as string[][])
        .map((row) => `{${row.map((char) => `'${escapeForSource(char)}'`).join(", ")}}`)
        .join(", ")}}`;
    case "nestedIntArray":
      return `java.util.Arrays.asList(${(value as number[][])
        .map((row) => `java.util.Arrays.asList(${row.join(", ")})`)
        .join(", ")})`;
  }
}

function buildCppLiteral(value: unknown, type: ValueType): string {
  switch (type) {
    case "int":
      return String(value);
    case "bool":
      return value ? "true" : "false";
    case "string":
      return `"${escapeForSource(String(value))}"`;
    case "intArray":
      return `{${(value as number[]).join(", ")}}`;
    case "stringArray":
      return `{${(value as string[]).map((item) => `"${escapeForSource(item)}"`).join(", ")}}`;
    case "intMatrix":
    case "pointArray":
    case "nestedIntArray":
      return `{${(value as number[][])
        .map((row) => `{${row.join(", ")}}`)
        .join(", ")}}`;
    case "charMatrix":
      return `{${(value as string[][])
        .map((row) => `{${row.map((char) => `'${escapeForSource(char)}'`).join(", ")}}`)
        .join(", ")}}`;
  }
}

function buildCArgumentList(
  args: unknown[],
  params: { name: string; type: ValueType }[]
) {
  return params
    .flatMap((param, index) => {
      const value = args[index];
      if (param.type === "intArray") {
        const arrayValue = value as number[];
        return [buildCLiteral(arrayValue, param.type), String(arrayValue.length)];
      }

      if (param.type === "stringArray") {
        const arrayValue = value as string[];
        return [buildCLiteral(arrayValue, param.type), String(arrayValue.length)];
      }

      return [buildCLiteral(value, param.type)];
    })
    .join(", ");
}

function buildCLiteral(value: unknown, type: ValueType): string {
  switch (type) {
    case "int":
      return String(value);
    case "bool":
      return value ? "true" : "false";
    case "string":
      return `"${escapeForSource(String(value))}"`;
    case "intArray":
      return `(int[]){${(value as number[]).join(", ")}}`;
    case "stringArray":
      return `(char*[]){${(value as string[]).map((item) => `"${escapeForSource(item)}"`).join(", ")}}`;
    default:
      throw new Error(`C runner does not support type ${type}.`);
  }
}

function buildCPrintStatement(expression: string, type: ValueType) {
  switch (type) {
    case "int":
      return `printJsonInt(${expression});`;
    case "bool":
      return `printJsonBool(${expression});`;
    case "string":
      return `printJsonString(${expression});`;
    default:
      throw new Error(`C runner does not support return type ${type}.`);
  }
}

function toCResultType(type: ValueType) {
  switch (type) {
    case "int":
      return "int";
    case "bool":
      return "bool";
    case "string":
      return "char*";
    default:
      throw new Error(`C runner does not support return type ${type}.`);
  }
}

function buildSwiftLiteral(value: unknown, type: ValueType): string {
  switch (type) {
    case "int":
      return String(value);
    case "bool":
      return value ? "true" : "false";
    case "string":
      return `"${escapeForSource(String(value))}"`;
    case "intArray":
      return `[${(value as number[]).join(", ")}]`;
    case "stringArray":
      return `[${(value as string[]).map((item) => `"${escapeForSource(item)}"`).join(", ")}]`;
    case "intMatrix":
    case "pointArray":
    case "nestedIntArray":
      return `[${(value as number[][])
        .map((row) => `[${row.join(", ")}]`)
        .join(", ")}]`;
    case "charMatrix":
      return `[${(value as string[][])
        .map((row) => `[${row.map((char) => `"${escapeForSource(char)}"`).join(", ")}]`)
        .join(", ")}]`;
  }
}

function buildGoLiteral(value: unknown, type: ValueType): string {
  switch (type) {
    case "int":
      return String(value);
    case "bool":
      return value ? "true" : "false";
    case "string":
      return `"${escapeForSource(String(value))}"`;
    case "intArray":
      return `[]int{${(value as number[]).join(", ")}}`;
    case "stringArray":
      return `[]string{${(value as string[]).map((item) => `"${escapeForSource(item)}"`).join(", ")}}`;
    case "intMatrix":
    case "pointArray":
    case "nestedIntArray":
      return `[][]int{${(value as number[][])
        .map((row) => `[]int{${row.join(", ")}}`)
        .join(", ")}}`;
    case "charMatrix":
      return `[][]byte{${(value as string[][])
        .map((row) => `[]byte{${row.map((char) => `'${escapeForSource(char)}'`).join(", ")}}`)
        .join(", ")}}`;
  }
}

function escapeForSource(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'");
}
