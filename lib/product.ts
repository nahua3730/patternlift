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

export const sampleProblems = [
  {
    id: "shortest-subarray-target",
    title: "Shortest Subarray At Least Target",
    difficulty: "Medium",
    prompt:
      "Given an array of positive integers and a target, find the length of the shortest contiguous subarray whose sum is at least target.",
    targetPatternId: "sliding-window",
    recommendedClues: [
      "contiguous subarray",
      "longest or shortest range",
      "need to shrink after expanding"
    ],
    recommendedFirstStep: "Track left and right pointers",
    reviewQuestion:
      "Which signal tells you this should shrink from the left instead of restarting from scratch?",
    contrastPatternId: "two-pointers"
  },
  {
    id: "binary-tree-level-order",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    prompt:
      "Given the root of a binary tree, return the values of the nodes level by level from left to right.",
    targetPatternId: "bfs",
    recommendedClues: ["level-order traversal"],
    recommendedFirstStep: "Use a queue for level order expansion",
    reviewQuestion:
      "What part of the prompt makes breadth-first search a better fit than depth-first search here?",
    contrastPatternId: "dfs"
  },
  {
    id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    prompt:
      "Given an integer array and an integer k, return the k most frequent elements.",
    targetPatternId: "heap",
    recommendedClues: ["top k ranking", "repeated best choice"],
    recommendedFirstStep: "Push candidates into a heap",
    reviewQuestion:
      "Why is a heap a more natural first move than sorting the full array each time?",
    contrastPatternId: "dynamic-programming"
  }
] as const;

export const starterHistory = [
  {
    id: "attempt-1",
    problemTitle: "Longest Substring Without Repeating Characters",
    selectedPatternLabel: "Sliding Window",
    outcome: "solid",
    insight: "Strong pattern match after noticing contiguous substring plus validity constraint."
  },
  {
    id: "attempt-2",
    problemTitle: "Binary Tree Level Order Traversal",
    selectedPatternLabel: "Depth-First Search",
    outcome: "confused",
    insight: "Confused DFS with BFS because traversal was recognized but level-order detail was missed."
  }
] as const;
