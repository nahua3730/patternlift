import type { AppProblem } from "@/lib/product";

export type SupportedLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "ruby"
  | "c"
  | "csharp"
  | "java"
  | "cpp"
  | "swift"
  | "go"
  | "kotlin";

export const languageLabels: Record<SupportedLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  ruby: "Ruby",
  c: "C",
  csharp: "C#",
  java: "Java",
  cpp: "C++",
  swift: "Swift",
  go: "Go",
  kotlin: "Kotlin"
};

export type ValueType =
  | "int"
  | "bool"
  | "string"
  | "intArray"
  | "stringArray"
  | "intMatrix"
  | "charMatrix"
  | "pointArray"
  | "nestedIntArray"
  | "binaryTree"
  | "linkedList";

export type CompareMode =
  | "strict"
  | "unordered-number-array"
  | "unordered-string-array"
  | "unordered-nested-array"
  | "unordered-point-array";

export type ProblemCodeConfig = {
  functionName: string;
  signature?: {
    params: { name: string; type: ValueType }[];
    returnType: ValueType;
  };
  starterCode: string;
  compareMode?: CompareMode;
  examples: {
    label: string;
    argsExpression: string;
    expectedExpression: string;
  }[];
};

function buildStarterCode(signature: string, notes: string[]) {
  return `${signature} {\n${notes
    .map((note) => `  // ${note}`)
    .join("\n")}\n\n}`;
}

function buildPythonStarterCode(functionName: string, params: string[], notes: string[]) {
  const formattedParams = params.join(", ");

  return `def ${functionName}(${formattedParams}):\n${notes
    .map((note) => `    # ${note}`)
    .join("\n")}\n    pass`;
}

function buildTypeScriptStarterCode(functionName: string, params: string[], notes: string[]) {
  const typedParams = params.map((param) => `${param}: any`).join(", ");

  return `function ${functionName}(${typedParams}): any {\n${notes
    .map((note) => `  // ${note}`)
    .join("\n")}\n\n}`;
}

function buildRubyStarterCode(functionName: string, params: string[], notes: string[]) {
  const formattedParams = params.join(", ");

  return `def ${functionName}(${formattedParams})\n${notes
    .map((note) => `  # ${note}`)
    .join("\n")}\nend`;
}

function buildCStarterCode(
  functionName: string,
  params: { name: string; type: ValueType }[],
  returnType: ValueType,
  notes: string[]
) {
  const signature = toCFunctionSignature(functionName, params, returnType);
  const fallback = cDefaultReturn(returnType);

  return `#include <stdbool.h>\n#include <stdlib.h>\n#include <string.h>\n\n${signature} {\n${notes
    .map((note) => `  // ${note}`)
    .join("\n")}\n\n  ${fallback}\n}`;
}

function buildCSharpStarterCode(
  functionName: string,
  params: { name: string; type: ValueType }[],
  returnType: ValueType,
  notes: string[]
) {
  const signature = params
    .map((param) => `${toCSharpType(param.type)} ${param.name}`)
    .join(", ");
  const fallback = csharpDefaultReturn(returnType);

  return `using System;\nusing System.Collections.Generic;\n\n${buildCSharpHelpers(params)}public class Solution {\n  public ${toCSharpType(returnType)} ${functionName}(${signature}) {\n${notes
    .map((note) => `    // ${note}`)
    .join("\n")}\n\n    ${fallback}\n  }\n}`;
}

function buildJavaStarterCode(
  functionName: string,
  params: { name: string; type: ValueType }[],
  returnType: ValueType,
  notes: string[]
) {
  const signature = params
    .map((param) => `${toJavaType(param.type)} ${param.name}`)
    .join(", ");
  const fallback = javaDefaultReturn(returnType);

  return `import java.util.*;\n\n${buildJavaHelpers(params)}class Solution {\n  public ${toJavaType(returnType)} ${functionName}(${signature}) {\n${notes
    .map((note) => `    // ${note}`)
    .join("\n")}\n\n    ${fallback}\n  }\n}`;
}

function buildCppStarterCode(
  functionName: string,
  params: { name: string; type: ValueType }[],
  returnType: ValueType,
  notes: string[]
) {
  const signature = params
    .map((param) => `${toCppType(param.type)} ${param.name}`)
    .join(", ");
  const fallback = cppDefaultReturn(returnType);

  return `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\n${buildCppHelpers(params)}class Solution {\npublic:\n  ${toCppType(returnType)} ${functionName}(${signature}) {\n${notes
    .map((note) => `    // ${note}`)
    .join("\n")}\n\n    ${fallback}\n  }\n};`;
}

function buildSwiftStarterCode(
  functionName: string,
  params: { name: string; type: ValueType }[],
  returnType: ValueType,
  notes: string[]
) {
  const fallback = swiftDefaultReturn(returnType);
  const labeledParams = params
    .map((param, index) => `${index === 0 ? "_" : "_"} ${param.name}: ${toSwiftType(param.type)}`)
    .join(", ");

  return `${buildSwiftHelpers(params)}func ${functionName}(${labeledParams}) -> ${toSwiftType(returnType)} {\n${notes
    .map((note) => `  // ${note}`)
    .join("\n")}\n\n  ${fallback}\n}`;
}

function buildGoStarterCode(
  functionName: string,
  params: { name: string; type: ValueType }[],
  returnType: ValueType,
  notes: string[]
) {
  const signature = params
    .map((param) => `${param.name} ${toGoType(param.type)}`)
    .join(", ");
  const fallback = goDefaultReturn(returnType);

  return `${buildGoHelpers(params)}func ${functionName}(${signature}) ${toGoType(returnType)} {\n${notes
    .map((note) => `\t// ${note}`)
    .join("\n")}\n\n\t${fallback}\n}`;
}

function buildKotlinStarterCode(
  functionName: string,
  params: { name: string; type: ValueType }[],
  returnType: ValueType,
  notes: string[]
) {
  const signature = params
    .map((param) => `${param.name}: ${toKotlinType(param.type)}`)
    .join(", ");
  const fallback = kotlinDefaultReturn(returnType);

  return `${buildKotlinHelpers(params)}class Solution {\n  fun ${functionName}(${signature}): ${toKotlinType(returnType)} {\n${notes
    .map((note) => `    // ${note}`)
    .join("\n")}\n\n    ${fallback}\n  }\n}`;
}

export function getStarterCode(
  config: ProblemCodeConfig | undefined,
  title: string,
  language: SupportedLanguage
) {
  if (language === "typescript") {
    if (config) {
      const params = extractParamsFromStarter(config.starterCode);
      const notes = extractNotesFromStarter(config.starterCode);
      return buildTypeScriptStarterCode(config.functionName, params, notes);
    }

    return defaultTypeScriptStarter(title);
  }

  if (language === "python") {
    if (config) {
      const params = extractParamsFromStarter(config.starterCode);
      const notes = extractNotesFromStarter(config.starterCode);
      return buildPythonStarterCode(config.functionName, params, notes);
    }

    return defaultPythonStarter(title);
  }

  if (language === "ruby") {
    if (config) {
      const params = extractParamsFromStarter(config.starterCode);
      const notes = extractNotesFromStarter(config.starterCode);
      return buildRubyStarterCode(config.functionName, params, notes);
    }

    return defaultRubyStarter(title);
  }

  if (language === "c") {
    if (config?.signature && supportsCLanguage(config.signature)) {
      const notes = extractNotesFromStarter(config.starterCode);
      return buildCStarterCode(
        config.functionName,
        config.signature.params,
        config.signature.returnType,
        notes
      );
    }

    return "// C runner is not available for this problem yet.";
  }

  if (language === "csharp") {
    if (config?.signature) {
      const notes = extractNotesFromStarter(config.starterCode);
      return buildCSharpStarterCode(
        config.functionName,
        config.signature.params,
        config.signature.returnType,
        notes
      );
    }

    return "// C# runner is not available for this problem yet.";
  }

  if (language === "java") {
    if (config?.signature) {
      const notes = extractNotesFromStarter(config.starterCode);
      return buildJavaStarterCode(
        config.functionName,
        config.signature.params,
        config.signature.returnType,
        notes
      );
    }

    return "// Java runner is not available for this problem yet.";
  }

  if (language === "cpp") {
    if (config?.signature) {
      const notes = extractNotesFromStarter(config.starterCode);
      return buildCppStarterCode(
        config.functionName,
        config.signature.params,
        config.signature.returnType,
        notes
      );
    }

    return "// C++ runner is not available for this problem yet.";
  }

  if (language === "swift") {
    if (config?.signature) {
      const notes = extractNotesFromStarter(config.starterCode);
      return buildSwiftStarterCode(
        config.functionName,
        config.signature.params,
        config.signature.returnType,
        notes
      );
    }

    return "// Swift runner is not available for this problem yet.";
  }

  if (language === "go") {
    if (config?.signature) {
      const notes = extractNotesFromStarter(config.starterCode);
      return buildGoStarterCode(
        config.functionName,
        config.signature.params,
        config.signature.returnType,
        notes
      );
    }

    return "// Go runner is not available for this problem yet.";
  }

  if (language === "kotlin") {
    if (config?.signature) {
      const notes = extractNotesFromStarter(config.starterCode);
      return buildKotlinStarterCode(
        config.functionName,
        config.signature.params,
        config.signature.returnType,
        notes
      );
    }

    return "// Kotlin runner is not available for this problem yet.";
  }

  return config?.starterCode ?? defaultJavaScriptStarter(title);
}

export function getAvailableLanguages(config: ProblemCodeConfig | undefined): SupportedLanguage[] {
  const base: SupportedLanguage[] = ["javascript", "typescript", "python", "ruby"];
  if (config?.signature) {
    if (supportsCLanguage(config.signature)) {
      base.push("c");
    }
    base.push("csharp", "java", "cpp", "swift", "go", "kotlin");
  }
  return base;
}
function extractParamsFromStarter(starterCode: string) {
  const match = starterCode.match(/function\s+\w+\((.*?)\)/);
  if (!match) return ["input"];

  return match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractNotesFromStarter(starterCode: string) {
  const matches = [...starterCode.matchAll(/\/\/\s(.+)/g)].map((entry) => entry[1]);
  return matches.length > 0 ? matches : ["Write your solution here."];
}

function defaultJavaScriptStarter(title: string) {
  const functionName = toCamelName(title);
  return `function ${functionName}(input) {\n  // Write your solution here.\n  return input;\n}`;
}

function defaultPythonStarter(title: string) {
  const functionName = toSnakeName(title);
  return `def ${functionName}(input):\n    # Write your solution here.\n    return input`;
}

function defaultTypeScriptStarter(title: string) {
  const functionName = toCamelName(title);
  return `function ${functionName}(input: any): any {\n  // Write your solution here.\n  return input;\n}`;
}

function defaultRubyStarter(title: string) {
  const functionName = toSnakeName(title);
  return `def ${functionName}(input)\n  # Write your solution here.\n  input\nend`;
}

function buildFallbackProblemCodeConfig(problem: Pick<AppProblem, "id" | "title" | "prompt">): ProblemCodeConfig {
  return {
    functionName: "solve",
    starterCode: buildStarterCode("function solve(rawInput)", [
      `Work on ${problem.title} here even though we have not modeled a bespoke harness yet.`,
      "Parse rawInput into the structure you want, solve the problem, and return the answer as a string.",
      "The test panel below is pre-filled with real examples for this problem."
    ]),
    signature: {
      params: [{ name: "rawInput", type: "string" }],
      returnType: "string"
    },
    examples: [
      {
        label: "Custom case 1",
        argsExpression: '["paste sample input here"]',
        expectedExpression: '"paste expected output here"'
      }
    ]
  };
}

function toJavaType(type: ValueType) {
  switch (type) {
    case "int":
      return "int";
    case "bool":
      return "boolean";
    case "string":
      return "String";
    case "intArray":
      return "int[]";
    case "stringArray":
      return "String[]";
    case "intMatrix":
    case "pointArray":
    case "charMatrix":
      return type === "charMatrix" ? "char[][]" : "int[][]";
    case "nestedIntArray":
      return "List<List<Integer>>";
    case "binaryTree":
      return "TreeNode";
    case "linkedList":
      return "ListNode";
  }
}

function toCType(type: ValueType) {
  switch (type) {
    case "int":
      return "int";
    case "bool":
      return "bool";
    case "string":
      return "char*";
    case "intArray":
      return "int*";
    case "stringArray":
      return "char**";
    default:
      return null;
  }
}

function toCSharpType(type: ValueType) {
  switch (type) {
    case "int":
      return "int";
    case "bool":
      return "bool";
    case "string":
      return "string";
    case "intArray":
      return "int[]";
    case "stringArray":
      return "string[]";
    case "intMatrix":
    case "pointArray":
      return "int[][]";
    case "charMatrix":
      return "char[][]";
    case "nestedIntArray":
      return "IList<IList<int>>";
    case "binaryTree":
      return "TreeNode";
    case "linkedList":
      return "ListNode";
  }
}

function toCppType(type: ValueType) {
  switch (type) {
    case "int":
      return "int";
    case "bool":
      return "bool";
    case "string":
      return "string";
    case "intArray":
      return "vector<int>";
    case "stringArray":
      return "vector<string>";
    case "intMatrix":
    case "pointArray":
    case "charMatrix":
      return type === "charMatrix" ? "vector<vector<char>>" : "vector<vector<int>>";
    case "nestedIntArray":
      return "vector<vector<int>>";
    case "binaryTree":
      return "TreeNode*";
    case "linkedList":
      return "ListNode*";
  }
}

function toSwiftType(type: ValueType) {
  switch (type) {
    case "int":
      return "Int";
    case "bool":
      return "Bool";
    case "string":
      return "String";
    case "intArray":
      return "[Int]";
    case "stringArray":
      return "[String]";
    case "intMatrix":
    case "pointArray":
    case "nestedIntArray":
      return "[[Int]]";
    case "charMatrix":
      return "[[Character]]";
    case "binaryTree":
      return "TreeNode?";
    case "linkedList":
      return "ListNode?";
  }
}

function toGoType(type: ValueType) {
  switch (type) {
    case "int":
      return "int";
    case "bool":
      return "bool";
    case "string":
      return "string";
    case "intArray":
      return "[]int";
    case "stringArray":
      return "[]string";
    case "intMatrix":
    case "pointArray":
    case "nestedIntArray":
      return "[][]int";
    case "charMatrix":
      return "[][]byte";
    case "binaryTree":
      return "*TreeNode";
    case "linkedList":
      return "*ListNode";
  }
}

function toKotlinType(type: ValueType) {
  switch (type) {
    case "int":
      return "Int";
    case "bool":
      return "Boolean";
    case "string":
      return "String";
    case "intArray":
      return "IntArray";
    case "stringArray":
      return "Array<String>";
    case "intMatrix":
    case "pointArray":
      return "Array<IntArray>";
    case "charMatrix":
      return "Array<CharArray>";
    case "nestedIntArray":
      return "List<List<Int>>";
    case "binaryTree":
      return "TreeNode?";
    case "linkedList":
      return "ListNode?";
  }
}

function usesBinaryTree(params: { name: string; type: ValueType }[]) {
  return params.some((param) => param.type === "binaryTree");
}

function usesLinkedList(params: { name: string; type: ValueType }[]) {
  return params.some((param) => param.type === "linkedList");
}

function buildJavaHelpers(params: { name: string; type: ValueType }[]) {
  const chunks: string[] = [];
  if (usesBinaryTree(params)) {
    chunks.push(`class TreeNode {\n  int val;\n  TreeNode left;\n  TreeNode right;\n\n  TreeNode(int val) { this.val = val; }\n  TreeNode(int val, TreeNode left, TreeNode right) {\n    this.val = val;\n    this.left = left;\n    this.right = right;\n  }\n}`);
  }
  if (usesLinkedList(params)) {
    chunks.push(`class ListNode {\n  int val;\n  ListNode next;\n\n  ListNode(int val) { this.val = val; }\n  ListNode(int val, ListNode next) {\n    this.val = val;\n    this.next = next;\n  }\n}`);
  }
  return chunks.length > 0 ? `${chunks.join("\n\n")}\n\n` : "";
}

function buildCSharpHelpers(params: { name: string; type: ValueType }[]) {
  const chunks: string[] = [];
  if (usesBinaryTree(params)) {
    chunks.push(`public class TreeNode {\n  public int val;\n  public TreeNode left;\n  public TreeNode right;\n\n  public TreeNode(int val = 0, TreeNode left = null, TreeNode right = null) {\n    this.val = val;\n    this.left = left;\n    this.right = right;\n  }\n}`);
  }
  if (usesLinkedList(params)) {
    chunks.push(`public class ListNode {\n  public int val;\n  public ListNode next;\n\n  public ListNode(int val = 0, ListNode next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}`);
  }
  return chunks.length > 0 ? `${chunks.join("\n\n")}\n\n` : "";
}

function buildCppHelpers(params: { name: string; type: ValueType }[]) {
  const chunks: string[] = [];
  if (usesBinaryTree(params)) {
    chunks.push(`struct TreeNode {\n  int val;\n  TreeNode* left;\n  TreeNode* right;\n  TreeNode(int value) : val(value), left(nullptr), right(nullptr) {}\n  TreeNode(int value, TreeNode* leftNode, TreeNode* rightNode) : val(value), left(leftNode), right(rightNode) {}\n};`);
  }
  if (usesLinkedList(params)) {
    chunks.push(`struct ListNode {\n  int val;\n  ListNode* next;\n  ListNode(int value) : val(value), next(nullptr) {}\n  ListNode(int value, ListNode* nextNode) : val(value), next(nextNode) {}\n};`);
  }
  return chunks.length > 0 ? `${chunks.join("\n\n")}\n\n` : "";
}

function buildSwiftHelpers(params: { name: string; type: ValueType }[]) {
  const chunks: string[] = [];
  if (usesBinaryTree(params)) {
    chunks.push(`final class TreeNode {\n  var val: Int\n  var left: TreeNode?\n  var right: TreeNode?\n\n  init(_ val: Int, _ left: TreeNode? = nil, _ right: TreeNode? = nil) {\n    self.val = val\n    self.left = left\n    self.right = right\n  }\n}`);
  }
  if (usesLinkedList(params)) {
    chunks.push(`final class ListNode {\n  var val: Int\n  var next: ListNode?\n\n  init(_ val: Int, _ next: ListNode? = nil) {\n    self.val = val\n    self.next = next\n  }\n}`);
  }
  return chunks.length > 0 ? `${chunks.join("\n\n")}\n\n` : "";
}

function buildGoHelpers(params: { name: string; type: ValueType }[]) {
  const chunks: string[] = [];
  if (usesBinaryTree(params)) {
    chunks.push(`type TreeNode struct {\n\tVal int\n\tLeft *TreeNode\n\tRight *TreeNode\n}`);
  }
  if (usesLinkedList(params)) {
    chunks.push(`type ListNode struct {\n\tVal int\n\tNext *ListNode\n}`);
  }
  return chunks.length > 0 ? `${chunks.join("\n\n")}\n\n` : "";
}

function buildKotlinHelpers(params: { name: string; type: ValueType }[]) {
  const chunks: string[] = [];
  if (usesBinaryTree(params)) {
    chunks.push(`class TreeNode(var \`val\`: Int, var left: TreeNode? = null, var right: TreeNode? = null)`);
  }
  if (usesLinkedList(params)) {
    chunks.push(`class ListNode(var \`val\`: Int, var next: ListNode? = null)`);
  }
  return chunks.length > 0 ? `${chunks.join("\n\n")}\n\n` : "";
}

function supportsCLanguage(signature: NonNullable<ProblemCodeConfig["signature"]>) {
  const supportedParamTypes = new Set<ValueType>([
    "int",
    "bool",
    "string",
    "intArray",
    "stringArray"
  ]);
  const supportedReturnTypes = new Set<ValueType>(["int", "bool", "string"]);

  return (
    signature.params.every((param) => supportedParamTypes.has(param.type)) &&
    supportedReturnTypes.has(signature.returnType)
  );
}

function toCFunctionSignature(
  functionName: string,
  params: { name: string; type: ValueType }[],
  returnType: ValueType
) {
  const expandedParams = params.flatMap((param) => {
    const baseType = toCType(param.type);
    if (!baseType) {
      return [];
    }

    if (param.type === "intArray" || param.type === "stringArray") {
      return [`${baseType} ${param.name}`, `int ${param.name}_len`];
    }

    return [`${baseType} ${param.name}`];
  });

  return `${toCType(returnType)} ${functionName}(${expandedParams.join(", ")})`;
}

function javaDefaultReturn(type: ValueType) {
  switch (type) {
    case "int":
      return "return 0;";
    case "bool":
      return "return false;";
    case "string":
      return 'return "";';
    case "intArray":
      return "return new int[]{};";
    case "stringArray":
      return "return new String[]{};";
    case "intMatrix":
    case "pointArray":
      return "return new int[][]{};";
    case "charMatrix":
      return "return new char[][]{};";
    case "nestedIntArray":
      return "return new ArrayList<>();";
    case "binaryTree":
    case "linkedList":
      return "return null;";
  }
}

function cppDefaultReturn(type: ValueType) {
  switch (type) {
    case "int":
      return "return 0;";
    case "bool":
      return "return false;";
    case "string":
      return 'return "";';
    case "intArray":
      return "return {};";
    case "stringArray":
      return "return {};";
    case "intMatrix":
    case "pointArray":
    case "charMatrix":
    case "nestedIntArray":
      return "return {};";
    case "binaryTree":
    case "linkedList":
      return "return {};";
  }
}

function cDefaultReturn(type: ValueType) {
  switch (type) {
    case "int":
      return "return 0;";
    case "bool":
      return "return false;";
    case "string":
      return 'return "";';
    case "binaryTree":
    case "linkedList":
      return "return null;";
    default:
      return "return 0;";
  }
}

function swiftDefaultReturn(type: ValueType) {
  switch (type) {
    case "int":
      return "return 0";
    case "bool":
      return "return false";
    case "string":
      return 'return ""';
    case "intArray":
    case "stringArray":
    case "intMatrix":
    case "charMatrix":
    case "pointArray":
    case "nestedIntArray":
      return "return []";
    case "binaryTree":
    case "linkedList":
      return "return nil";
  }
}

function goDefaultReturn(type: ValueType) {
  switch (type) {
    case "int":
      return "return 0";
    case "bool":
      return "return false";
    case "string":
      return 'return ""';
    case "intArray":
    case "stringArray":
    case "intMatrix":
    case "charMatrix":
    case "pointArray":
    case "nestedIntArray":
      return "return nil";
    case "binaryTree":
    case "linkedList":
      return "return nil";
  }
}

function csharpDefaultReturn(type: ValueType) {
  switch (type) {
    case "int":
      return "return 0;";
    case "bool":
      return "return false;";
    case "string":
      return 'return "";';
    case "intArray":
      return "return Array.Empty<int>();";
    case "stringArray":
      return "return Array.Empty<string>();";
    case "intMatrix":
    case "pointArray":
      return "return Array.Empty<int[]>();";
    case "charMatrix":
      return "return Array.Empty<char[]>();";
    case "nestedIntArray":
      return "return new List<IList<int>>();";
    case "binaryTree":
    case "linkedList":
      return "return null;";
  }
}

function kotlinDefaultReturn(type: ValueType) {
  switch (type) {
    case "int":
      return "return 0";
    case "bool":
      return "return false";
    case "string":
      return "return \"\"";
    case "intArray":
      return "return intArrayOf()";
    case "stringArray":
      return "return emptyArray()";
    case "intMatrix":
    case "pointArray":
      return "return emptyArray()";
    case "charMatrix":
      return "return emptyArray()";
    case "nestedIntArray":
      return "return emptyList()";
    case "binaryTree":
    case "linkedList":
      return "return null";
  }
}

function toCamelName(title: string) {
  const sanitized = title.replace(/[^a-zA-Z0-9]+/g, " ").trim() || "solveProblem";
  const words = sanitized.split(/\s+/);
  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
}

function toSnakeName(title: string) {
  return (title.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "solve_problem")
    .toLowerCase();
}
