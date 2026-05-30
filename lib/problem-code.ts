export type SupportedLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "ruby"
  | "java"
  | "cpp";

export type ValueType =
  | "int"
  | "bool"
  | "string"
  | "intArray"
  | "stringArray"
  | "intMatrix"
  | "charMatrix"
  | "pointArray"
  | "nestedIntArray";

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

  return `import java.util.*;\n\nclass Solution {\n  public ${toJavaType(returnType)} ${functionName}(${signature}) {\n${notes
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

  return `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n  ${toCppType(returnType)} ${functionName}(${signature}) {\n${notes
    .map((note) => `    // ${note}`)
    .join("\n")}\n\n    ${fallback}\n  }\n};`;
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

  return config?.starterCode ?? defaultJavaScriptStarter(title);
}

export function getAvailableLanguages(config: ProblemCodeConfig | undefined): SupportedLanguage[] {
  const base: SupportedLanguage[] = ["javascript", "typescript", "python", "ruby"];
  if (config?.signature) {
    base.push("java", "cpp");
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
  }
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
  "binary-tree-level-order": {
    functionName: "levelOrder",
    starterCode: buildStarterCode(
      "function levelOrder(root)",
      [
        "Assume root is a plain object: { val, left, right } or null.",
        "Return values grouped level by level."
      ]
    ),
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
