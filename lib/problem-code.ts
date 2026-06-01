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

export function hasNativeProblemCodeConfig(problemId: string) {
  return Boolean(problemCodeMap[problemId]);
}

export function getProblemCodeConfig(problem: Pick<AppProblem, "id" | "title" | "prompt">) {
  return problemCodeMap[problem.id] ?? buildFallbackProblemCodeConfig(problem);
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
      "Use the custom test panel below to paste one official sample input and expected output."
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

export const problemCodeMap: Record<string, ProblemCodeConfig> = {
  "two-sum": {
    functionName: "twoSum",
    starterCode: buildStarterCode(
      "function twoSum(nums, target)",
      [
        "Use a map from value to index.",
        "Return the two indices that add up to target."
      ]
    ),
    signature: {
      params: [
        { name: "nums", type: "intArray" },
        { name: "target", type: "int" }
      ],
      returnType: "intArray"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[2,7,11,15], 9]", expectedExpression: "[0,1]" },
      { label: "Example 2", argsExpression: "[[3,2,4], 6]", expectedExpression: "[1,2]" }
    ]
  },
  "contains-duplicate": {
    functionName: "containsDuplicate",
    starterCode: buildStarterCode(
      "function containsDuplicate(nums)",
      [
        "Return true as soon as a value repeats.",
        "A set is usually enough."
      ]
    ),
    signature: {
      params: [{ name: "nums", type: "intArray" }],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[1,2,3,1]]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[[1,2,3,4]]", expectedExpression: "false" }
    ]
  },
  "valid-anagram": {
    functionName: "isAnagram",
    starterCode: buildStarterCode(
      "function isAnagram(s, t)",
      [
        "Compare character frequencies.",
        "Return true only if every count balances exactly."
      ]
    ),
    signature: {
      params: [
        { name: "s", type: "string" },
        { name: "t", type: "string" }
      ],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[\"anagram\", \"nagaram\"]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[\"rat\", \"car\"]", expectedExpression: "false" }
    ]
  },
  "longest-consecutive": {
    functionName: "longestConsecutive",
    starterCode: buildStarterCode(
      "function longestConsecutive(nums)",
      [
        "Use a set to detect sequence starts.",
        "Only grow sequences from numbers that have no predecessor."
      ]
    ),
    signature: {
      params: [{ name: "nums", type: "intArray" }],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[100,4,200,1,3,2]]", expectedExpression: "4" },
      { label: "Example 2", argsExpression: "[[0,3,7,2,5,8,4,6,0,1]]", expectedExpression: "9" }
    ]
  },
  "shortest-subarray-target": {
    functionName: "minSubArrayLen",
    starterCode: buildStarterCode(
      "function minSubArrayLen(target, nums)",
      [
        "Use a sliding window over nums.",
        "Return the minimum window length whose sum is at least target.",
        "Return 0 if no valid window exists."
      ]
    ),
    signature: {
      params: [
        { name: "target", type: "int" },
        { name: "nums", type: "intArray" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[7, [2,3,1,2,4,3]]", expectedExpression: "2" },
      { label: "Example 2", argsExpression: "[11, [1,1,1,1,1,1,1,1]]", expectedExpression: "0" }
    ]
  },
  "longest-substring-no-repeat": {
    functionName: "lengthOfLongestSubstring",
    starterCode: buildStarterCode(
      "function lengthOfLongestSubstring(s)",
      [
        "Track a window with no repeated characters.",
        "Return the maximum valid window length."
      ]
    ),
    signature: {
      params: [{ name: "s", type: "string" }],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[\"abcabcbb\"]", expectedExpression: "3" },
      { label: "Example 2", argsExpression: "[\"bbbbb\"]", expectedExpression: "1" }
    ]
  },
  "minimum-window-substring": {
    functionName: "minWindow",
    starterCode: buildStarterCode(
      "function minWindow(s, t)",
      [
        "Return the smallest substring of s that contains every character from t.",
        "Return an empty string when no valid window exists."
      ]
    ),
    signature: {
      params: [
        { name: "s", type: "string" },
        { name: "t", type: "string" }
      ],
      returnType: "string"
    },
    examples: [
      { label: "Example 1", argsExpression: "[\"ADOBECODEBANC\", \"ABC\"]", expectedExpression: "\"BANC\"" },
      { label: "Example 2", argsExpression: "[\"a\", \"aa\"]", expectedExpression: "\"\"" }
    ]
  },
  "valid-palindrome": {
    functionName: "isPalindrome",
    starterCode: buildStarterCode(
      "function isPalindrome(s)",
      [
        "Ignore non-alphanumeric characters.",
        "Compare from both ends after lowercasing."
      ]
    ),
    signature: {
      params: [{ name: "s", type: "string" }],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[\"A man, a plan, a canal: Panama\"]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[\"race a car\"]", expectedExpression: "false" }
    ]
  },
  "container-most-water": {
    functionName: "maxArea",
    starterCode: buildStarterCode(
      "function maxArea(heights)",
      [
        "Use two pointers at the ends of the array.",
        "Return the maximum water area."
      ]
    ),
    signature: {
      params: [{ name: "heights", type: "intArray" }],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[1,8,6,2,5,4,8,3,7]]", expectedExpression: "49" },
      { label: "Example 2", argsExpression: "[[1,1]]", expectedExpression: "1" }
    ]
  },
  "three-sum": {
    functionName: "threeSum",
    starterCode: buildStarterCode(
      "function threeSum(nums)",
      [
        "Return all unique triplets [a, b, c] where a + b + c === 0.",
        "Triplet order does not matter."
      ]
    ),
    signature: {
      params: [{ name: "nums", type: "intArray" }],
      returnType: "nestedIntArray"
    },
    compareMode: "unordered-nested-array",
    examples: [
      { label: "Example 1", argsExpression: "[[-1,0,1,2,-1,-4]]", expectedExpression: "[[-1,-1,2],[-1,0,1]]" },
      { label: "Example 2", argsExpression: "[[0,1,1]]", expectedExpression: "[]" }
    ]
  },
  "valid-parentheses": {
    functionName: "isValid",
    starterCode: buildStarterCode(
      "function isValid(s)",
      [
        "Use a stack of opening brackets.",
        "Each closing bracket must match the most recent opening bracket."
      ]
    ),
    signature: {
      params: [{ name: "s", type: "string" }],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[\"()[]{}\"]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[\"(]\"]", expectedExpression: "false" }
    ]
  },
  "daily-temperatures": {
    functionName: "dailyTemperatures",
    starterCode: buildStarterCode(
      "function dailyTemperatures(temperatures)",
      [
        "Use a stack of unresolved day indices.",
        "Return how many days it takes to find a warmer temperature."
      ]
    ),
    signature: {
      params: [{ name: "temperatures", type: "intArray" }],
      returnType: "intArray"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[73,74,75,71,69,72,76,73]]", expectedExpression: "[1,1,4,2,1,1,0,0]" },
      { label: "Example 2", argsExpression: "[[30,40,50,60]]", expectedExpression: "[1,1,1,0]" }
    ]
  },
  "car-fleet": {
    functionName: "carFleet",
    starterCode: buildStarterCode(
      "function carFleet(target, position, speed)",
      [
        "Sort cars by position from closest to farthest from the target.",
        "Use arrival times to decide whether a car forms a new fleet or joins one ahead."
      ]
    ),
    signature: {
      params: [
        { name: "target", type: "int" },
        { name: "position", type: "intArray" },
        { name: "speed", type: "intArray" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[12, [10,8,0,5,3], [2,4,1,1,3]]", expectedExpression: "3" },
      { label: "Example 2", argsExpression: "[10, [3], [3]]", expectedExpression: "1" }
    ]
  },
  "binary-search": {
    functionName: "search",
    starterCode: buildStarterCode(
      "function search(nums, target)",
      [
        "Nums is sorted in ascending order.",
        "Return the index of target or -1."
      ]
    ),
    signature: {
      params: [
        { name: "nums", type: "intArray" },
        { name: "target", type: "int" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[-1,0,2,4,6,8], 4]", expectedExpression: "3" },
      { label: "Example 2", argsExpression: "[[-1,0,2,4,6,8], 3]", expectedExpression: "-1" }
    ]
  },
  "search-2d-matrix": {
    functionName: "searchMatrix",
    starterCode: buildStarterCode(
      "function searchMatrix(matrix, target)",
      [
        "Treat the matrix like a flattened sorted array if helpful.",
        "Return true if target exists, otherwise false."
      ]
    ),
    signature: {
      params: [
        { name: "matrix", type: "intMatrix" },
        { name: "target", type: "int" }
      ],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 13]", expectedExpression: "false" }
    ]
  },
  "koko-bananas": {
    functionName: "minEatingSpeed",
    starterCode: buildStarterCode(
      "function minEatingSpeed(piles, h)",
      [
        "Binary search over eating speed.",
        "Return the minimum speed that finishes within h hours."
      ]
    ),
    signature: {
      params: [
        { name: "piles", type: "intArray" },
        { name: "h", type: "int" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[3,6,7,11], 8]", expectedExpression: "4" },
      { label: "Example 2", argsExpression: "[[30,11,23,4,20], 5]", expectedExpression: "30" }
    ]
  },
  "network-delay-time": {
    functionName: "networkDelayTime",
    starterCode: buildStarterCode(
      "function networkDelayTime(times, n, k)",
      [
        "times contains directed edges [u, v, w].",
        "Return the time for a signal from k to reach every node, or -1 if some node is unreachable."
      ]
    ),
    signature: {
      params: [
        { name: "times", type: "intMatrix" },
        { name: "n", type: "int" },
        { name: "k", type: "int" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[[2,1,1],[2,3,1],[3,4,1]], 4, 2]", expectedExpression: "2" },
      { label: "Example 2", argsExpression: "[[[1,2,1]], 2, 1]", expectedExpression: "1" }
    ]
  },
  "course-schedule": {
    functionName: "canFinish",
    starterCode: buildStarterCode(
      "function canFinish(numCourses, prerequisites)",
      [
        "Treat prerequisites as directed edges: [course, prereq].",
        "Return true if every course can be completed."
      ]
    ),
    signature: {
      params: [
        { name: "numCourses", type: "int" },
        { name: "prerequisites", type: "intMatrix" }
      ],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[2, [[1,0]]]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[2, [[1,0],[0,1]]]", expectedExpression: "false" }
    ]
  },
  "open-the-lock": {
    functionName: "openLock",
    starterCode: buildStarterCode(
      "function openLock(deadends, target)",
      [
        "Each turn changes one wheel by plus or minus one.",
        "Return the minimum moves from 0000 to target, or -1."
      ]
    ),
    signature: {
      params: [
        { name: "deadends", type: "stringArray" },
        { name: "target", type: "string" }
      ],
      returnType: "int"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression: "[['0201','0101','0102','1212','2002'], '0202']",
        expectedExpression: "6"
      },
      { label: "Example 2", argsExpression: "[['8888'], '0009']", expectedExpression: "1" }
    ]
  },
  "clone-graph": {
    functionName: "cloneGraph",
    starterCode: buildStarterCode(
      "function cloneGraph(adjacency)",
      [
        "adjacency[i] lists the neighbors of node i + 1.",
        "Return a deep copy in the same adjacency-list format."
      ]
    ),
    signature: {
      params: [{ name: "adjacency", type: "nestedIntArray" }],
      returnType: "nestedIntArray"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression: "[[[2,4],[1,3],[2,4],[1,3]]]",
        expectedExpression: "[[2,4],[1,3],[2,4],[1,3]]"
      },
      { label: "Example 2", argsExpression: "[[[]]]", expectedExpression: "[[]]" }
    ]
  },
  "add-two-numbers": {
    functionName: "addTwoNumbers",
    starterCode: buildStarterCode(
      "function addTwoNumbers(l1, l2)",
      [
        "Assume both inputs use nodes like { val, next } or null.",
        "Walk both lists together, carry overflow forward, and build the result list node by node."
      ]
    ),
    signature: {
      params: [
        { name: "l1", type: "linkedList" },
        { name: "l2", type: "linkedList" }
      ],
      returnType: "linkedList"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression:
          "[{ val: 2, next: { val: 4, next: { val: 3, next: null } } }, { val: 5, next: { val: 6, next: { val: 4, next: null } } }]",
        expectedExpression:
          "{ val: 7, next: { val: 0, next: { val: 8, next: null } } }"
      },
      {
        label: "Example 2",
        argsExpression: "[{ val: 0, next: null }, { val: 0, next: null }]",
        expectedExpression: "{ val: 0, next: null }"
      },
      {
        label: "Example 3",
        argsExpression:
          "[{ val: 9, next: { val: 9, next: { val: 9, next: { val: 9, next: { val: 9, next: { val: 9, next: { val: 9, next: null } } } } } } }, { val: 9, next: { val: 9, next: { val: 9, next: { val: 9, next: null } } } }]",
        expectedExpression:
          "{ val: 8, next: { val: 9, next: { val: 9, next: { val: 9, next: { val: 0, next: { val: 0, next: { val: 0, next: { val: 1, next: null } } } } } } } }"
      }
    ]
  },
  "reverse-linked-list": {
    functionName: "reverseList",
    starterCode: buildStarterCode(
      "function reverseList(head)",
      [
        "Assume nodes look like { val, next } or null.",
        "Reverse the pointers in-place and return the new head."
      ]
    ),
    signature: {
      params: [{ name: "head", type: "linkedList" }],
      returnType: "linkedList"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression:
          "[{ val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: null } } } } }]",
        expectedExpression:
          "{ val: 5, next: { val: 4, next: { val: 3, next: { val: 2, next: { val: 1, next: null } } } } }"
      },
      { label: "Example 2", argsExpression: "[null]", expectedExpression: "null" }
    ]
  },
  "linked-list-cycle": {
    functionName: "hasCycle",
    starterCode: buildStarterCode(
      "function hasCycle(head)",
      [
        "Assume nodes look like { val, next } or null.",
        "Return true if the list contains a cycle."
      ]
    ),
    signature: {
      params: [{ name: "head", type: "linkedList" }],
      returnType: "bool"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression:
          "[{ val: 3, next: { val: 2, next: { val: 0, next: { val: -4, next: null } } } }]",
        expectedExpression: "false"
      },
      {
        label: "Example 2",
        argsExpression: "[{ val: 1, next: { val: 2, next: null } }]",
        expectedExpression: "false"
      }
    ]
  },
  "merge-two-sorted-lists": {
    functionName: "mergeTwoLists",
    starterCode: buildStarterCode(
      "function mergeTwoLists(list1, list2)",
      [
        "Assume both inputs use nodes like { val, next } or null.",
        "Merge the lists by pointer rewiring and return the head."
      ]
    ),
    signature: {
      params: [
        { name: "list1", type: "linkedList" },
        { name: "list2", type: "linkedList" }
      ],
      returnType: "linkedList"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression:
          "[{ val: 1, next: { val: 2, next: { val: 4, next: null } } }, { val: 1, next: { val: 3, next: { val: 4, next: null } } }]",
        expectedExpression:
          "{ val: 1, next: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 4, next: null } } } } } }"
      },
      { label: "Example 2", argsExpression: "[null, null]", expectedExpression: "null" }
    ]
  },
  "remove-nth-from-end": {
    functionName: "removeNthFromEnd",
    starterCode: buildStarterCode(
      "function removeNthFromEnd(head, n)",
      [
        "Assume nodes look like { val, next } or null.",
        "Use a gap between two pointers to find the node before the target."
      ]
    ),
    signature: {
      params: [
        { name: "head", type: "linkedList" },
        { name: "n", type: "int" }
      ],
      returnType: "linkedList"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression:
          "[{ val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: null } } } } }, 2]",
        expectedExpression:
          "{ val: 1, next: { val: 2, next: { val: 3, next: { val: 5, next: null } } } }"
      },
      {
        label: "Example 2",
        argsExpression: "[{ val: 1, next: null }, 1]",
        expectedExpression: "null"
      }
    ]
  },
  "binary-tree-level-order": {
    functionName: "levelOrder",
    starterCode: buildStarterCode(
      "function levelOrder(root)",
      [
        "Assume root is a plain object: { val, left, right } or null.",
        "Return values grouped level by level."
      ]
    ),
    signature: {
      params: [{ name: "root", type: "binaryTree" }],
      returnType: "nestedIntArray"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression:
          "[{ val: 3, left: { val: 9, left: null, right: null }, right: { val: 20, left: { val: 15, left: null, right: null }, right: { val: 7, left: null, right: null } } }]",
        expectedExpression: "[[3],[9,20],[15,7]]"
      },
      { label: "Example 2", argsExpression: "[null]", expectedExpression: "[]" }
    ]
  },
  "max-depth-tree": {
    functionName: "maxDepth",
    starterCode: buildStarterCode(
      "function maxDepth(root)",
      [
        "Assume root is a plain object: { val, left, right } or null.",
        "Return the number of nodes on the longest root-to-leaf path."
      ]
    ),
    signature: {
      params: [{ name: "root", type: "binaryTree" }],
      returnType: "int"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression:
          "[{ val: 3, left: { val: 9, left: null, right: null }, right: { val: 20, left: { val: 15, left: null, right: null }, right: { val: 7, left: null, right: null } } }]",
        expectedExpression: "3"
      },
      { label: "Example 2", argsExpression: "[null]", expectedExpression: "0" }
    ]
  },
  "same-tree": {
    functionName: "isSameTree",
    starterCode: buildStarterCode(
      "function isSameTree(p, q)",
      [
        "Assume both trees use plain objects: { val, left, right } or null.",
        "Return true if the trees match in structure and values."
      ]
    ),
    signature: {
      params: [
        { name: "p", type: "binaryTree" },
        { name: "q", type: "binaryTree" }
      ],
      returnType: "bool"
    },
    examples: [
      {
        label: "Example 1",
        argsExpression:
          "[{ val: 1, left: { val: 2, left: null, right: null }, right: { val: 3, left: null, right: null } }, { val: 1, left: { val: 2, left: null, right: null }, right: { val: 3, left: null, right: null } }]",
        expectedExpression: "true"
      },
      {
        label: "Example 2",
        argsExpression:
          "[{ val: 1, left: { val: 2, left: null, right: null }, right: null }, { val: 1, left: null, right: { val: 2, left: null, right: null } }]",
        expectedExpression: "false"
      }
    ]
  },
  "top-k-frequent-elements": {
    functionName: "topKFrequent",
    starterCode: buildStarterCode(
      "function topKFrequent(nums, k)",
      [
        "Return the k most frequent elements.",
        "Result order does not matter."
      ]
    ),
    signature: {
      params: [
        { name: "nums", type: "intArray" },
        { name: "k", type: "int" }
      ],
      returnType: "intArray"
    },
    compareMode: "unordered-number-array",
    examples: [
      { label: "Example 1", argsExpression: "[[1,1,1,2,2,3], 2]", expectedExpression: "[1,2]" },
      { label: "Example 2", argsExpression: "[[1], 1]", expectedExpression: "[1]" }
    ]
  },
  "k-closest-points": {
    functionName: "kClosest",
    starterCode: buildStarterCode(
      "function kClosest(points, k)",
      [
        "Return the k points with the smallest distance from [0, 0].",
        "Result order does not matter."
      ]
    ),
    signature: {
      params: [
        { name: "points", type: "pointArray" },
        { name: "k", type: "int" }
      ],
      returnType: "pointArray"
    },
    compareMode: "unordered-point-array",
    examples: [
      { label: "Example 1", argsExpression: "[[[1,3],[-2,2]], 1]", expectedExpression: "[[-2,2]]" },
      { label: "Example 2", argsExpression: "[[[3,3],[5,-1],[-2,4]], 2]", expectedExpression: "[[3,3],[-2,4]]" }
    ]
  },
  "task-scheduler": {
    functionName: "leastInterval",
    starterCode: buildStarterCode(
      "function leastInterval(tasks, n)",
      [
        "Tasks is an array like ['A', 'A', 'B'] and n is the cooldown.",
        "Return the minimum intervals needed to finish all tasks."
      ]
    ),
    signature: {
      params: [
        { name: "tasks", type: "stringArray" },
        { name: "n", type: "int" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[['A','A','A','B','B','B'], 2]", expectedExpression: "8" },
      { label: "Example 2", argsExpression: "[['A','C','A','B','D','B'], 1]", expectedExpression: "6" }
    ]
  },
  subsets: {
    functionName: "subsets",
    starterCode: buildStarterCode(
      "function subsets(nums)",
      [
        "Return every subset of nums.",
        "Subset order does not matter."
      ]
    ),
    signature: {
      params: [{ name: "nums", type: "intArray" }],
      returnType: "nestedIntArray"
    },
    compareMode: "unordered-nested-array",
    examples: [
      { label: "Example 1", argsExpression: "[[1,2]]", expectedExpression: "[[],[1],[2],[1,2]]" },
      { label: "Example 2", argsExpression: "[[0]]", expectedExpression: "[[],[0]]" }
    ]
  },
  "combination-sum": {
    functionName: "combinationSum",
    starterCode: buildStarterCode(
      "function combinationSum(candidates, target)",
      [
        "Return all unique combinations that sum to target.",
        "You may reuse the same candidate multiple times."
      ]
    ),
    signature: {
      params: [
        { name: "candidates", type: "intArray" },
        { name: "target", type: "int" }
      ],
      returnType: "nestedIntArray"
    },
    compareMode: "unordered-nested-array",
    examples: [
      { label: "Example 1", argsExpression: "[[2,3,6,7], 7]", expectedExpression: "[[2,2,3],[7]]" },
      { label: "Example 2", argsExpression: "[[2,3,5], 8]", expectedExpression: "[[2,2,2,2],[2,3,3],[3,5]]" }
    ]
  },
  "word-search": {
    functionName: "exist",
    starterCode: buildStarterCode(
      "function exist(board, word)",
      [
        "Return true if word can be formed from adjacent cells without reuse.",
        "Board is a 2D array of characters."
      ]
    ),
    signature: {
      params: [
        { name: "board", type: "charMatrix" },
        { name: "word", type: "string" }
      ],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], 'ABCCED']", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], 'ABCB']", expectedExpression: "false" }
    ]
  },
  "number-of-islands": {
    functionName: "numIslands",
    starterCode: buildStarterCode(
      "function numIslands(grid)",
      [
        "Grid contains '1' for land and '0' for water.",
        "Return the number of disconnected islands."
      ]
    ),
    signature: {
      params: [{ name: "grid", type: "charMatrix" }],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[['1','1','1','1','0'],['1','1','0','1','0'],['1','1','0','0','0'],['0','0','0','0','0']]]", expectedExpression: "1" },
      { label: "Example 2", argsExpression: "[[['1','1','0','0','0'],['1','1','0','0','0'],['0','0','1','0','0'],['0','0','0','1','1']]]", expectedExpression: "3" }
    ]
  },
  "rotting-oranges": {
    functionName: "orangesRotting",
    starterCode: buildStarterCode(
      "function orangesRotting(grid)",
      [
        "Grid contains 0 for empty, 1 for fresh, and 2 for rotten.",
        "Return the minimum minutes to rot all reachable fresh oranges, or -1."
      ]
    ),
    signature: {
      params: [{ name: "grid", type: "intMatrix" }],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[[2,1,1],[1,1,0],[0,1,1]]]", expectedExpression: "4" },
      { label: "Example 2", argsExpression: "[[[2,1,1],[0,1,1],[1,0,1]]]", expectedExpression: "-1" }
    ]
  },
  "counting-bits": {
    functionName: "countBits",
    starterCode: buildStarterCode(
      "function countBits(n)",
      [
        "Return an array of bit counts from 0 through n.",
        "Reuse smaller answers instead of recounting every number from scratch."
      ]
    ),
    signature: {
      params: [{ name: "n", type: "int" }],
      returnType: "intArray"
    },
    examples: [
      { label: "Example 1", argsExpression: "[2]", expectedExpression: "[0,1,1]" },
      { label: "Example 2", argsExpression: "[5]", expectedExpression: "[0,1,1,2,1,2]" }
    ]
  },
  "house-robber": {
    functionName: "rob",
    starterCode: buildStarterCode(
      "function rob(nums)",
      [
        "Return the maximum amount that can be robbed without taking adjacent houses."
      ]
    ),
    signature: {
      params: [{ name: "nums", type: "intArray" }],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[1,2,3,1]]", expectedExpression: "4" },
      { label: "Example 2", argsExpression: "[[2,7,9,3,1]]", expectedExpression: "12" }
    ]
  },
  "coin-change": {
    functionName: "coinChange",
    starterCode: buildStarterCode(
      "function coinChange(coins, amount)",
      [
        "Return the fewest coins needed to make amount.",
        "Return -1 when it is impossible."
      ]
    ),
    signature: {
      params: [
        { name: "coins", type: "intArray" },
        { name: "amount", type: "int" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[1,2,5], 11]", expectedExpression: "3" },
      { label: "Example 2", argsExpression: "[[2], 3]", expectedExpression: "-1" }
    ]
  },
  "partition-equal-subset-sum": {
    functionName: "canPartition",
    starterCode: buildStarterCode(
      "function canPartition(nums)",
      [
        "Return true if nums can be split into two subsets with equal sum."
      ]
    ),
    signature: {
      params: [{ name: "nums", type: "intArray" }],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[1,5,11,5]]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[[1,2,3,5]]", expectedExpression: "false" }
    ]
  },
  "unique-paths": {
    functionName: "uniquePaths",
    starterCode: buildStarterCode(
      "function uniquePaths(m, n)",
      [
        "Return the number of paths from top-left to bottom-right moving only right or down."
      ]
    ),
    signature: {
      params: [
        { name: "m", type: "int" },
        { name: "n", type: "int" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[3, 7]", expectedExpression: "28" },
      { label: "Example 2", argsExpression: "[3, 2]", expectedExpression: "3" }
    ]
  },
  "longest-common-subsequence": {
    functionName: "longestCommonSubsequence",
    starterCode: buildStarterCode(
      "function longestCommonSubsequence(text1, text2)",
      [
        "Return the length of the longest common subsequence."
      ]
    ),
    signature: {
      params: [
        { name: "text1", type: "string" },
        { name: "text2", type: "string" }
      ],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[\"abcde\", \"ace\"]", expectedExpression: "3" },
      { label: "Example 2", argsExpression: "[\"abc\", \"def\"]", expectedExpression: "0" }
    ]
  },
  "best-time-stock": {
    functionName: "maxProfit",
    starterCode: buildStarterCode(
      "function maxProfit(prices)",
      [
        "Track the cheapest buy seen so far.",
        "Update the best profit as you scan to the right."
      ]
    ),
    signature: {
      params: [{ name: "prices", type: "intArray" }],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[7,1,5,3,6,4]]", expectedExpression: "5" },
      { label: "Example 2", argsExpression: "[[7,6,4,3,1]]", expectedExpression: "0" }
    ]
  },
  "jump-game": {
    functionName: "canJump",
    starterCode: buildStarterCode(
      "function canJump(nums)",
      [
        "Return true if the last index is reachable from the first index."
      ]
    ),
    signature: {
      params: [{ name: "nums", type: "intArray" }],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[2,3,1,1,4]]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[[3,2,1,0,4]]", expectedExpression: "false" }
    ]
  },
  "merge-intervals": {
    functionName: "merge",
    starterCode: buildStarterCode(
      "function merge(intervals)",
      [
        "Sort by start time first.",
        "Merge intervals whenever the next start is inside the current end boundary."
      ]
    ),
    signature: {
      params: [{ name: "intervals", type: "intMatrix" }],
      returnType: "intMatrix"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[[1,3],[2,6],[8,10],[15,18]]]", expectedExpression: "[[1,6],[8,10],[15,18]]" },
      { label: "Example 2", argsExpression: "[[[1,4],[4,5]]]", expectedExpression: "[[1,5]]" }
    ]
  },
  "insert-interval": {
    functionName: "insert",
    starterCode: buildStarterCode(
      "function insert(intervals, newInterval)",
      [
        "Intervals are already sorted and non-overlapping.",
        "Return the merged result after inserting newInterval."
      ]
    ),
    signature: {
      params: [
        { name: "intervals", type: "intMatrix" },
        { name: "newInterval", type: "intArray" }
      ],
      returnType: "intMatrix"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[[1,3],[6,9]], [2,5]]", expectedExpression: "[[1,5],[6,9]]" },
      { label: "Example 2", argsExpression: "[[[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]]", expectedExpression: "[[1,2],[3,10],[12,16]]" }
    ]
  },
  "non-overlapping-intervals": {
    functionName: "eraseOverlapIntervals",
    starterCode: buildStarterCode(
      "function eraseOverlapIntervals(intervals)",
      [
        "Sort intervals so overlap decisions are local.",
        "Return the minimum number removed to leave only non-overlapping intervals."
      ]
    ),
    signature: {
      params: [{ name: "intervals", type: "intMatrix" }],
      returnType: "int"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[[1,2],[2,3],[3,4],[1,3]]]", expectedExpression: "1" },
      { label: "Example 2", argsExpression: "[[[1,2],[1,2],[1,2]]]", expectedExpression: "2" }
    ]
  },
  "merge-triplets": {
    functionName: "mergeTriplets",
    starterCode: buildStarterCode(
      "function mergeTriplets(triplets, target)",
      [
        "Return true if repeated merges can form target exactly."
      ]
    ),
    signature: {
      params: [
        { name: "triplets", type: "intMatrix" },
        { name: "target", type: "intArray" }
      ],
      returnType: "bool"
    },
    examples: [
      { label: "Example 1", argsExpression: "[[[2,5,3],[1,8,4],[1,7,5]], [2,7,5]]", expectedExpression: "true" },
      { label: "Example 2", argsExpression: "[[[3,4,5],[4,5,6]], [3,2,5]]", expectedExpression: "false" }
    ]
  }
};
