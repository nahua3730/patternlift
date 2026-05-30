export const productFeatures = [
  {
    title: "Pattern Contrast",
    description:
      "Teach the difference between lookalike approaches such as sliding window vs two pointers or DFS vs BFS."
  },
  {
    title: "Guided Hints",
    description:
      "Provide progressive coaching prompts that help users think before seeing the full path to a solution."
  },
  {
    title: "Mistake Tracking",
    description:
      "Capture recurring weak spots so review is based on real confusion instead of random repetition."
  },
  {
    title: "Recall Review",
    description:
      "Bring old problems back through quick drills that reinforce pattern recognition and retention."
  }
] as const;

export const demoProblem = {
  title: "Longest Substring Without Repeating Characters",
  difficulty: "Medium",
  prompt:
    "Given a string s, find the length of the longest substring without repeating characters.",
  cues: [
    "The answer depends on a contiguous part of the string.",
    "You need to grow and shrink a range while preserving a condition.",
    "Repeated characters tell you when the current range has become invalid."
  ],
  options: [
    {
      id: "sliding-window",
      label: "Sliding Window",
      summary:
        "Track a moving substring and adjust the left edge when a duplicate breaks the rule.",
      isCorrect: true
    },
    {
      id: "two-pointers",
      label: "Two Pointers",
      summary:
        "This sounds close, but the key idea is maintaining a valid window under a changing constraint.",
      isCorrect: false
    },
    {
      id: "hashmap",
      label: "Hash Map",
      summary:
        "A hash map helps implement the solution, but it is not the main solving pattern by itself.",
      isCorrect: false
    },
    {
      id: "dynamic-programming",
      label: "Dynamic Programming",
      summary:
        "There is no overlapping state recurrence driving the solution here.",
      isCorrect: false
    }
  ],
  hints: [
    "Start by asking whether the problem cares about a contiguous region or scattered positions.",
    "If adding one more character breaks the rule, what could you move to restore validity without restarting?",
    "Keep a left pointer, scan with a right pointer, and track the characters inside the current substring."
  ],
  takeaway:
    "PatternLift should help you tell the difference between a broad tool like hash maps and a strategy like sliding window."
} as const;

export const patternOptions = [
  {
    id: "sliding-window",
    label: "Sliding Window",
    firstSteps: [
      "Track a left and right pointer over a contiguous range",
      "Maintain a running condition while expanding the window",
      "Shrink from the left when the rule is already satisfied"
    ],
    clues: [
      "contiguous array or substring",
      "valid range that grows and shrinks",
      "longest or shortest segment under a rule"
    ],
    coachPrompt:
      "Ask whether the condition can be preserved by moving the left edge instead of restarting."
  },
  {
    id: "two-pointers",
    label: "Two Pointers",
    firstSteps: [
      "Place one pointer at each end or at neighboring positions",
      "Move pointers based on direct comparisons or a target value",
      "Use ordering to decide which pointer should move next"
    ],
    clues: [
      "sorted input",
      "pair or triplet relationship",
      "move two indices toward a target"
    ],
    coachPrompt:
      "Ask whether two indices can move based on an ordering or direct comparison."
  },
  {
    id: "bfs",
    label: "Breadth-First Search",
    firstSteps: [
      "Initialize a queue with the starting node or state",
      "Expand neighbors level by level",
      "Track visited nodes so the same state is not reprocessed"
    ],
    clues: [
      "level order exploration",
      "shortest unweighted path",
      "expand all neighbors before going deeper"
    ],
    coachPrompt:
      "Ask whether the problem naturally unfolds level by level rather than down one branch at a time."
  },
  {
    id: "dfs",
    label: "Depth-First Search",
    firstSteps: [
      "Go down one branch recursively or with a stack",
      "Track path state while exploring alternatives",
      "Backtrack after finishing the current branch"
    ],
    clues: [
      "explore one branch fully",
      "backtracking or subtree reasoning",
      "path state matters during recursion"
    ],
    coachPrompt:
      "Ask whether the solution depends on exploring a branch deeply before trying alternatives."
  },
  {
    id: "heap",
    label: "Heap / Priority Queue",
    firstSteps: [
      "Push candidate values into a min-heap or max-heap",
      "Pop the current best item when you need the next answer",
      "Keep heap size bounded if you only care about top k"
    ],
    clues: [
      "top k items",
      "repeatedly need current smallest or largest",
      "streaming updates with ranking"
    ],
    coachPrompt:
      "Ask whether you need quick access to the current best candidate again and again."
  },
  {
    id: "dynamic-programming",
    label: "Dynamic Programming",
    firstSteps: [
      "Define the state that captures the smaller subproblem",
      "Write a recurrence from previous states to the current one",
      "Store results to avoid recomputing overlapping work"
    ],
    clues: [
      "overlapping subproblems",
      "best answer built from smaller states",
      "choice at one step affects future states"
    ],
    coachPrompt:
      "Ask whether a state and recurrence can capture repeated work or an optimal substructure."
  }
] as const;
