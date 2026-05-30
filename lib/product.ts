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
    id: "binary-search",
    label: "Binary Search",
    firstSteps: [
      "Define the search interval and midpoint rule",
      "Check whether the middle value or candidate is enough",
      "Throw away the half that can no longer contain the answer"
    ],
    clues: [
      "sorted input or monotonic answer space",
      "minimum feasible or maximum feasible threshold",
      "discard half the possibilities each step"
    ],
    coachPrompt:
      "Ask whether the prompt gives you a monotonic condition that lets you eliminate half the search space."
  },
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
  },
  {
    id: "greedy",
    label: "Greedy",
    firstSteps: [
      "Identify the strongest local choice available right now",
      "State the invariant that makes that choice safe",
      "Scan forward without revisiting earlier decisions"
    ],
    clues: [
      "commit to the best local move",
      "interval or scheduling language",
      "can reach or maximize with one-pass decisions"
    ],
    coachPrompt:
      "Ask whether a local choice can be proven safe without exploring every future branch."
  }
] as const;

export type ProblemCategory =
  | "Two Pointers"
  | "Sliding Window"
  | "Binary Search"
  | "Linked Lists"
  | "Trees"
  | "Heap / Priority Queue"
  | "Backtracking"
  | "Graphs"
  | "1-D Dynamic Programming"
  | "2-D Dynamic Programming"
  | "Greedy";

export const sampleProblems = [
  {
    id: "shortest-subarray-target",
    category: "Sliding Window",
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
    id: "longest-substring-no-repeat",
    category: "Sliding Window",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    prompt:
      "Given a string, return the length of the longest substring that contains no repeated characters.",
    targetPatternId: "sliding-window",
    recommendedClues: [
      "contiguous subarray",
      "longest or shortest range",
      "need to shrink after expanding"
    ],
    recommendedFirstStep: "Maintain a running sum or frequency state",
    reviewQuestion:
      "What condition inside the current window becomes invalid when a character repeats?",
    contrastPatternId: "two-pointers"
  },
  {
    id: "minimum-window-substring",
    category: "Sliding Window",
    title: "Minimum Window Substring",
    difficulty: "Hard",
    prompt:
      "Given two strings s and t, return the smallest substring of s that contains every character from t with the right frequency.",
    targetPatternId: "sliding-window",
    recommendedClues: [
      "contiguous subarray",
      "longest or shortest range",
      "need to shrink after expanding"
    ],
    recommendedFirstStep: "Maintain a running sum or frequency state",
    reviewQuestion:
      "How do you know the window is valid before trying to shrink it?",
    contrastPatternId: "two-pointers"
  },
  {
    id: "valid-palindrome",
    category: "Two Pointers",
    title: "Valid Palindrome",
    difficulty: "Easy",
    prompt:
      "Given a string, determine whether it reads the same forward and backward after ignoring non-alphanumeric characters and letter case.",
    targetPatternId: "two-pointers",
    recommendedClues: ["sorted input"],
    recommendedFirstStep: "Track left and right pointers",
    reviewQuestion:
      "Why does comparing the left and right ends directly tell you more than scanning from one side only?",
    contrastPatternId: "sliding-window"
  },
  {
    id: "container-most-water",
    category: "Two Pointers",
    title: "Container With Most Water",
    difficulty: "Medium",
    prompt:
      "Given heights of vertical lines, choose two lines that hold the maximum amount of water between them.",
    targetPatternId: "two-pointers",
    recommendedClues: ["sorted input"],
    recommendedFirstStep: "Track left and right pointers",
    reviewQuestion:
      "Why is it safe to move the shorter wall rather than the taller one?",
    contrastPatternId: "greedy"
  },
  {
    id: "three-sum",
    category: "Two Pointers",
    title: "3Sum",
    difficulty: "Medium",
    prompt:
      "Given an integer array, return all unique triplets whose sum is zero.",
    targetPatternId: "two-pointers",
    recommendedClues: ["sorted input"],
    recommendedFirstStep: "Track left and right pointers",
    reviewQuestion:
      "Why does sorting turn the inner search into a pointer problem instead of a full nested scan?",
    contrastPatternId: "binary-search"
  },
  {
    id: "binary-search",
    category: "Binary Search",
    title: "Binary Search",
    difficulty: "Easy",
    prompt:
      "Given a sorted array of distinct integers and a target value, return the target index or -1 if it is missing.",
    targetPatternId: "binary-search",
    recommendedClues: ["sorted input", "sorted or monotonic search space"],
    recommendedFirstStep: "Set a left/right search interval and test the midpoint",
    reviewQuestion:
      "What lets you discard exactly half of the remaining search interval each step?",
    contrastPatternId: "two-pointers"
  },
  {
    id: "search-2d-matrix",
    category: "Binary Search",
    title: "Search a 2D Matrix",
    difficulty: "Medium",
    prompt:
      "Given a matrix where rows are sorted and each row starts after the previous row ends, determine whether a target exists.",
    targetPatternId: "binary-search",
    recommendedClues: ["sorted input", "sorted or monotonic search space"],
    recommendedFirstStep: "Set a left/right search interval and test the midpoint",
    reviewQuestion:
      "Why can the whole matrix be treated like one sorted search space?",
    contrastPatternId: "two-pointers"
  },
  {
    id: "koko-bananas",
    category: "Binary Search",
    title: "Koko Eating Bananas",
    difficulty: "Medium",
    prompt:
      "Given piles of bananas and a deadline in hours, return the minimum eating speed that allows all bananas to be eaten in time.",
    targetPatternId: "binary-search",
    recommendedClues: ["sorted or monotonic search space", "minimum feasible / maximum feasible"],
    recommendedFirstStep: "Set a left/right search interval and test the midpoint",
    reviewQuestion:
      "What makes the answer space monotonic even though the array is not sorted for direct search?",
    contrastPatternId: "greedy"
  },
  {
    id: "course-schedule",
    category: "Graphs",
    title: "Course Schedule",
    difficulty: "Medium",
    prompt:
      "Given the number of courses and prerequisite pairs, determine whether it is possible to finish every course.",
    targetPatternId: "bfs",
    recommendedClues: ["level-order traversal", "repeated best choice"],
    recommendedFirstStep: "Use a queue for level order expansion",
    reviewQuestion:
      "What does it mean for a course to become available only after its incoming requirements drop to zero?",
    contrastPatternId: "dfs"
  },
  {
    id: "open-the-lock",
    category: "Graphs",
    title: "Open the Lock",
    difficulty: "Medium",
    prompt:
      "You start at the combination 0000. Given deadends and a target combination, return the minimum number of turns needed to reach the target, or -1 if it is impossible.",
    targetPatternId: "bfs",
    recommendedClues: ["level-order traversal"],
    recommendedFirstStep: "Use a queue for level order expansion",
    reviewQuestion:
      "Why does breadth-first search give the fewest turns before a deeper search would?",
    contrastPatternId: "dfs"
  },
  {
    id: "clone-graph",
    category: "Graphs",
    title: "Clone Graph (Adjacency View)",
    difficulty: "Medium",
    prompt:
      "A connected undirected graph is given as an adjacency list where the nth list contains the neighbors of node n + 1. Return a deep copy of the graph in the same adjacency-list format.",
    targetPatternId: "dfs",
    recommendedClues: ["explore one branch fully"],
    recommendedFirstStep: "Go deeper recursively before trying alternatives",
    reviewQuestion:
      "What extra structure keeps you from cloning the same node again when the graph loops back?",
    contrastPatternId: "bfs"
  },
  {
    id: "reverse-linked-list",
    category: "Linked Lists",
    title: "Reverse Linked List",
    difficulty: "Easy",
    prompt:
      "Given the head of a singly linked list, reverse the list and return the new head.",
    targetPatternId: "two-pointers",
    recommendedClues: ["sorted input"],
    recommendedFirstStep: "Track left and right pointers",
    reviewQuestion:
      "What three pointers do you need to keep from losing the rest of the list while reversing a link?",
    contrastPatternId: "dfs"
  },
  {
    id: "linked-list-cycle",
    category: "Linked Lists",
    title: "Linked List Cycle",
    difficulty: "Easy",
    prompt:
      "Given the head of a linked list, determine whether the list contains a cycle.",
    targetPatternId: "two-pointers",
    recommendedClues: ["sorted input"],
    recommendedFirstStep: "Track left and right pointers",
    reviewQuestion:
      "Why do a slow pointer and a fast pointer reveal a cycle without extra memory?",
    contrastPatternId: "dfs"
  },
  {
    id: "merge-two-sorted-lists",
    category: "Linked Lists",
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    prompt:
      "Given the heads of two sorted linked lists, merge them into one sorted linked list and return its head.",
    targetPatternId: "two-pointers",
    recommendedClues: ["sorted input"],
    recommendedFirstStep: "Track left and right pointers",
    reviewQuestion:
      "What makes this pointer merge safer than copying values into a new array first?",
    contrastPatternId: "greedy"
  },
  {
    id: "remove-nth-from-end",
    category: "Linked Lists",
    title: "Remove Nth Node From End of List",
    difficulty: "Medium",
    prompt:
      "Given the head of a linked list, remove the nth node from the end and return the head of the modified list.",
    targetPatternId: "two-pointers",
    recommendedClues: ["sorted input"],
    recommendedFirstStep: "Track left and right pointers",
    reviewQuestion:
      "Why is a fixed gap between two pointers enough to find the node just before the removal target?",
    contrastPatternId: "dfs"
  },
  {
    id: "binary-tree-level-order",
    category: "Trees",
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
    id: "max-depth-tree",
    category: "Trees",
    title: "Maximum Depth of Binary Tree",
    difficulty: "Easy",
    prompt:
      "Given the root of a binary tree, return the maximum depth from the root to any leaf.",
    targetPatternId: "dfs",
    recommendedClues: ["level-order traversal"],
    recommendedFirstStep: "Go deeper recursively before trying alternatives",
    reviewQuestion:
      "What should one recursive call return so the parent can compute the deeper subtree?",
    contrastPatternId: "bfs"
  },
  {
    id: "same-tree",
    category: "Trees",
    title: "Same Tree",
    difficulty: "Easy",
    prompt:
      "Given two binary trees, determine whether they are structurally identical and contain the same values in corresponding nodes.",
    targetPatternId: "dfs",
    recommendedClues: ["level-order traversal"],
    recommendedFirstStep: "Go deeper recursively before trying alternatives",
    reviewQuestion:
      "Why is comparing both subtrees recursively cleaner than building full traversal arrays first?",
    contrastPatternId: "bfs"
  },
  {
    id: "top-k-frequent-elements",
    category: "Heap / Priority Queue",
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
  },
  {
    id: "k-closest-points",
    category: "Heap / Priority Queue",
    title: "K Closest Points to Origin",
    difficulty: "Medium",
    prompt:
      "Given points on a 2D plane and an integer k, return the k points closest to the origin.",
    targetPatternId: "heap",
    recommendedClues: ["top k ranking", "repeated best choice"],
    recommendedFirstStep: "Push candidates into a heap",
    reviewQuestion:
      "Why does the problem only care about the best k candidates instead of a full global ordering?",
    contrastPatternId: "binary-search"
  },
  {
    id: "task-scheduler",
    category: "Heap / Priority Queue",
    title: "Task Scheduler",
    difficulty: "Medium",
    prompt:
      "Given tasks and a cooldown, compute the minimum time needed to finish all tasks while respecting the cooldown between identical tasks.",
    targetPatternId: "heap",
    recommendedClues: ["top k ranking", "repeated best choice"],
    recommendedFirstStep: "Push candidates into a heap",
    reviewQuestion:
      "Why do repeated best-available choices matter more than solving this as plain dynamic programming first?",
    contrastPatternId: "greedy"
  },
  {
    id: "subsets",
    category: "Backtracking",
    title: "Subsets",
    difficulty: "Medium",
    prompt:
      "Given an array of unique integers, return every possible subset.",
    targetPatternId: "dfs",
    recommendedClues: ["overlapping subproblems"],
    recommendedFirstStep: "Go deeper recursively before trying alternatives",
    reviewQuestion:
      "What are the two choices available for each element as you build a subset?",
    contrastPatternId: "dynamic-programming"
  },
  {
    id: "combination-sum",
    category: "Backtracking",
    title: "Combination Sum",
    difficulty: "Medium",
    prompt:
      "Given distinct candidate numbers and a target, return all unique combinations where numbers can be reused and sum to the target.",
    targetPatternId: "dfs",
    recommendedClues: ["overlapping subproblems"],
    recommendedFirstStep: "Go deeper recursively before trying alternatives",
    reviewQuestion:
      "What path state changes when you include a number again in the current combination?",
    contrastPatternId: "dynamic-programming"
  },
  {
    id: "word-search",
    category: "Backtracking",
    title: "Word Search",
    difficulty: "Medium",
    prompt:
      "Given a board of characters and a word, determine whether the word can be formed by sequentially adjacent cells without reusing a cell.",
    targetPatternId: "dfs",
    recommendedClues: ["overlapping subproblems"],
    recommendedFirstStep: "Go deeper recursively before trying alternatives",
    reviewQuestion:
      "What needs to be marked and then restored while you explore neighboring cells?",
    contrastPatternId: "bfs"
  },
  {
    id: "number-of-islands",
    category: "Graphs",
    title: "Number of Islands",
    difficulty: "Medium",
    prompt:
      "Given a grid of land and water, count how many disconnected islands exist.",
    targetPatternId: "dfs",
    recommendedClues: ["level-order traversal"],
    recommendedFirstStep: "Go deeper recursively before trying alternatives",
    reviewQuestion:
      "Why is flood-filling one connected component at a time enough to count islands?",
    contrastPatternId: "bfs"
  },
  {
    id: "rotting-oranges",
    category: "Graphs",
    title: "Rotting Oranges",
    difficulty: "Medium",
    prompt:
      "Given a grid of fresh and rotten oranges, return the minimum minutes until all reachable fresh oranges become rotten.",
    targetPatternId: "bfs",
    recommendedClues: ["level-order traversal"],
    recommendedFirstStep: "Use a queue for level order expansion",
    reviewQuestion:
      "Why does one BFS layer naturally correspond to one minute in the spread process?",
    contrastPatternId: "dfs"
  },
  {
    id: "house-robber",
    category: "1-D Dynamic Programming",
    title: "House Robber",
    difficulty: "Medium",
    prompt:
      "Given values in a row of houses, return the maximum amount you can steal without taking from adjacent houses.",
    targetPatternId: "dynamic-programming",
    recommendedClues: ["overlapping subproblems"],
    recommendedFirstStep: "Define a DP state and recurrence",
    reviewQuestion:
      "What choice at house i determines which previous result you are allowed to use?",
    contrastPatternId: "greedy"
  },
  {
    id: "coin-change",
    category: "1-D Dynamic Programming",
    title: "Coin Change",
    difficulty: "Medium",
    prompt:
      "Given coin denominations and a target amount, return the fewest coins needed to make that amount or -1 if it is impossible.",
    targetPatternId: "dynamic-programming",
    recommendedClues: ["overlapping subproblems"],
    recommendedFirstStep: "Define a DP state and recurrence",
    reviewQuestion:
      "What smaller amount should the current state depend on after choosing one coin?",
    contrastPatternId: "dfs"
  },
  {
    id: "partition-equal-subset-sum",
    category: "1-D Dynamic Programming",
    title: "Partition Equal Subset Sum",
    difficulty: "Medium",
    prompt:
      "Given positive integers, determine whether they can be split into two subsets with equal sum.",
    targetPatternId: "dynamic-programming",
    recommendedClues: ["overlapping subproblems"],
    recommendedFirstStep: "Define a DP state and recurrence",
    reviewQuestion:
      "What does the state need to remember about the target half-sum as you process numbers?",
    contrastPatternId: "dfs"
  },
  {
    id: "unique-paths",
    category: "2-D Dynamic Programming",
    title: "Unique Paths",
    difficulty: "Medium",
    prompt:
      "Given an m by n grid, return the number of paths from top-left to bottom-right when you can only move right or down.",
    targetPatternId: "dynamic-programming",
    recommendedClues: ["overlapping subproblems"],
    recommendedFirstStep: "Define a DP state and recurrence",
    reviewQuestion:
      "Which smaller grid positions fully determine the number of paths into the current cell?",
    contrastPatternId: "bfs"
  },
  {
    id: "longest-common-subsequence",
    category: "2-D Dynamic Programming",
    title: "Longest Common Subsequence",
    difficulty: "Medium",
    prompt:
      "Given two strings, return the length of their longest common subsequence.",
    targetPatternId: "dynamic-programming",
    recommendedClues: ["overlapping subproblems"],
    recommendedFirstStep: "Define a DP state and recurrence",
    reviewQuestion:
      "What pair of indices is enough to represent the remaining subproblem?",
    contrastPatternId: "dfs"
  },
  {
    id: "jump-game",
    category: "Greedy",
    title: "Jump Game",
    difficulty: "Medium",
    prompt:
      "Given jump lengths at each index, determine whether the last index is reachable.",
    targetPatternId: "greedy",
    recommendedClues: ["commit best local choice"],
    recommendedFirstStep: "Sort or scan for the best safe local choice",
    reviewQuestion:
      "What running invariant tells you the farthest reachable position so far?",
    contrastPatternId: "dynamic-programming"
  },
  {
    id: "merge-triplets",
    category: "Greedy",
    title: "Merge Triplets to Form Target Triplet",
    difficulty: "Medium",
    prompt:
      "Given triplets and a target triplet, determine whether repeated merges can produce the exact target values.",
    targetPatternId: "greedy",
    recommendedClues: ["commit best local choice"],
    recommendedFirstStep: "Sort or scan for the best safe local choice",
    reviewQuestion:
      "Why can invalid triplets be ignored immediately without losing a possible solution?",
    contrastPatternId: "dynamic-programming"
  }
] as const;

export const starterHistory = [
  {
    id: "attempt-1",
    problemId: "longest-substring-no-repeat",
    problemTitle: "Longest Substring Without Repeating Characters",
    selectedPatternLabel: "Sliding Window",
    outcome: "solid",
    insight: "Strong pattern match after noticing contiguous substring plus validity constraint."
  },
  {
    id: "attempt-2",
    problemId: "binary-tree-level-order",
    problemTitle: "Binary Tree Level Order Traversal",
    selectedPatternLabel: "Depth-First Search",
    outcome: "confused",
    insight: "Confused DFS with BFS because traversal was recognized but level-order detail was missed."
  }
] as const;

export type RoadmapTrack = "blind75" | "neetcode150";

export const roadmapTrackTotals: Record<RoadmapTrack, number> = {
  blind75: 75,
  neetcode150: 150
};

export const problemRoadmapMeta: Record<
  string,
  {
    leetcodeNumber: number;
    tracks: RoadmapTrack[];
  }
> = {
  "longest-substring-no-repeat": { leetcodeNumber: 3, tracks: ["blind75", "neetcode150"] },
  "minimum-window-substring": { leetcodeNumber: 76, tracks: ["neetcode150"] },
  "valid-palindrome": { leetcodeNumber: 125, tracks: ["neetcode150"] },
  "container-most-water": { leetcodeNumber: 11, tracks: ["blind75", "neetcode150"] },
  "three-sum": { leetcodeNumber: 15, tracks: ["blind75", "neetcode150"] },
  "binary-search": { leetcodeNumber: 704, tracks: ["neetcode150"] },
  "search-2d-matrix": { leetcodeNumber: 74, tracks: ["neetcode150"] },
  "koko-bananas": { leetcodeNumber: 875, tracks: ["neetcode150"] },
  "course-schedule": { leetcodeNumber: 207, tracks: ["blind75", "neetcode150"] },
  "open-the-lock": { leetcodeNumber: 752, tracks: ["neetcode150"] },
  "clone-graph": { leetcodeNumber: 133, tracks: ["blind75", "neetcode150"] },
  "reverse-linked-list": { leetcodeNumber: 206, tracks: ["blind75", "neetcode150"] },
  "linked-list-cycle": { leetcodeNumber: 141, tracks: ["blind75", "neetcode150"] },
  "merge-two-sorted-lists": { leetcodeNumber: 21, tracks: ["blind75", "neetcode150"] },
  "remove-nth-from-end": { leetcodeNumber: 19, tracks: ["blind75", "neetcode150"] },
  "binary-tree-level-order": { leetcodeNumber: 102, tracks: ["neetcode150"] },
  "max-depth-tree": { leetcodeNumber: 104, tracks: ["blind75", "neetcode150"] },
  "same-tree": { leetcodeNumber: 100, tracks: ["neetcode150"] },
  "top-k-frequent-elements": { leetcodeNumber: 347, tracks: ["neetcode150"] },
  "k-closest-points": { leetcodeNumber: 973, tracks: ["neetcode150"] },
  "task-scheduler": { leetcodeNumber: 621, tracks: ["neetcode150"] },
  subsets: { leetcodeNumber: 78, tracks: ["blind75", "neetcode150"] },
  "combination-sum": { leetcodeNumber: 39, tracks: ["blind75", "neetcode150"] },
  "word-search": { leetcodeNumber: 79, tracks: ["blind75", "neetcode150"] },
  "number-of-islands": { leetcodeNumber: 200, tracks: ["blind75", "neetcode150"] },
  "rotting-oranges": { leetcodeNumber: 994, tracks: ["neetcode150"] },
  "house-robber": { leetcodeNumber: 198, tracks: ["blind75", "neetcode150"] },
  "coin-change": { leetcodeNumber: 322, tracks: ["blind75", "neetcode150"] },
  "partition-equal-subset-sum": { leetcodeNumber: 416, tracks: ["neetcode150"] },
  "unique-paths": { leetcodeNumber: 62, tracks: ["neetcode150"] },
  "longest-common-subsequence": { leetcodeNumber: 1143, tracks: ["neetcode150"] },
  "jump-game": { leetcodeNumber: 55, tracks: ["blind75", "neetcode150"] },
  "merge-triplets": { leetcodeNumber: 1899, tracks: ["neetcode150"] }
};

export function getProblemRoadmapMeta(problemId: string) {
  return problemRoadmapMeta[problemId] ?? null;
}
