export const techniqueLibrary = [
  {
    id: "two-pointers",
    title: "Two Pointers",
    whenToThink:
      "Use this when indices can move relative to each other based on ordering, symmetry, or pair/triplet conditions.",
    coreIdea:
      "Keep two positions whose movement rule is driven by a direct comparison or target gap.",
    starterQuestion:
      "What condition tells me which pointer should move next?",
    commonTrap:
      "Confusing a generic left/right scan with sliding window when no validity constraint is being maintained.",
    quickTips: [
      "Sorted input is a strong signal.",
      "Write the pointer movement rule before coding.",
      "Check whether both pointers move in the same direction or from opposite ends."
    ]
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    whenToThink:
      "Use this for contiguous ranges where the window expands and sometimes shrinks while preserving a rule.",
    coreIdea:
      "Track a valid interval and adjust its boundaries without restarting from scratch.",
    starterQuestion:
      "What must stay true inside the current window?",
    commonTrap:
      "Treating every substring problem as sliding window even when there is no reusable validity condition.",
    quickTips: [
      "Longest or shortest subarray language is a strong clue.",
      "Decide what state you need inside the window: count, sum, frequency, or set membership.",
      "Ask when the left edge should move."
    ]
  },
  {
    id: "binary-search",
    title: "Binary Search",
    whenToThink:
      "Use this when the answer space or input order lets you eliminate half the possibilities each step.",
    coreIdea:
      "Maintain a search interval and move left or right based on a monotonic check.",
    starterQuestion:
      "What monotonic property lets me discard half the space?",
    commonTrap:
      "Only looking for sorted arrays and missing binary search on answer.",
    quickTips: [
      "Separate the search space from the check function.",
      "Choose a clear loop invariant before picking <= or <.",
      "For answer search, define what counts as feasible."
    ]
  },
  {
    id: "bfs",
    title: "Breadth-First Search",
    whenToThink:
      "Use this when a problem unfolds level by level or asks for the shortest path in an unweighted graph.",
    coreIdea:
      "Expand all states at the current depth before moving deeper.",
    starterQuestion:
      "Does this problem naturally care about levels or minimum steps?",
    commonTrap:
      "Using DFS when the prompt is really about levels, distance, or earliest reachability.",
    quickTips: [
      "Queue plus visited set is the default skeleton.",
      "Level-order tree traversal is BFS even if recursion feels tempting.",
      "Track what each layer means before coding."
    ]
  },
  {
    id: "dfs-backtracking",
    title: "DFS and Backtracking",
    whenToThink:
      "Use this when you need to explore choices, paths, permutations, subsets, or constraint-based search.",
    coreIdea:
      "Make a choice, recurse, then undo the choice so you can explore the next branch cleanly.",
    starterQuestion:
      "What state changes when I go deeper, and what must be restored when I return?",
    commonTrap:
      "Writing recursion without naming the path state, termination condition, and undo step.",
    quickTips: [
      "A path container plus choose / recurse / unchoose is a good mental frame.",
      "Decide whether nodes can be reused before coding.",
      "Prune early when a branch can no longer succeed."
    ]
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    whenToThink:
      "Use this when smaller subproblems overlap and a current answer depends on previously solved states.",
    coreIdea:
      "Define state, transition, and base case so repeated work becomes reusable structure.",
    starterQuestion:
      "What is the smallest state that fully captures future decisions?",
    commonTrap:
      "Jumping into tables before clearly naming state and transition.",
    quickTips: [
      "Write the state in plain English first.",
      "Try recursion plus memo before tabulation if the structure is fuzzy.",
      "Check whether the answer depends on previous position, remaining budget, or a choice count."
    ]
  },
  {
    id: "greedy",
    title: "Greedy",
    whenToThink:
      "Use this when a locally best move can be justified as preserving a globally optimal path.",
    coreIdea:
      "Make the strongest local choice that never blocks the best final answer.",
    starterQuestion:
      "Why is this local decision safe to commit immediately?",
    commonTrap:
      "Calling an idea greedy just because it feels intuitive, without proving the exchange or cut argument.",
    quickTips: [
      "Look for interval scheduling, sorting by a key, or one-pass commitment decisions.",
      "Ask what invariant the greedy choice preserves.",
      "If safety is unclear, it may not be greedy."
    ]
  },
  {
    id: "divide-conquer",
    title: "Divide and Conquer",
    whenToThink:
      "Use this when a problem becomes simpler after splitting it into independent subproblems and merging results.",
    coreIdea:
      "Break the problem into smaller pieces, solve each piece, then combine them with a structured merge.",
    starterQuestion:
      "What natural subproblem split gives me smaller instances of the same task?",
    commonTrap:
      "Using recursion without a meaningful combine step.",
    quickTips: [
      "Merge sort and tree recursion are classic anchors.",
      "Be explicit about the combine cost.",
      "Watch whether the split creates balanced work or pathological depth."
    ]
  },
  {
    id: "binary-tree-recursion",
    title: "Binary Tree Recursion",
    whenToThink:
      "Use this when each node's answer depends on answers from its children or the path from the root.",
    coreIdea:
      "Think in terms of what information the subtree returns or what context the parent passes down.",
    starterQuestion:
      "Do I need information flowing upward, downward, or both?",
    commonTrap:
      "Mixing subtree return values with path-side effects without separating responsibilities.",
    quickTips: [
      "Postorder often fits subtree aggregation.",
      "Preorder often fits passing context downward.",
      "Decide what one recursive call should promise to return."
    ]
  },
  {
    id: "complexity",
    title: "Complexity Checks",
    whenToThink:
      "Use this before and after coding to catch solutions that are correct but too expensive.",
    coreIdea:
      "Estimate the dominant loop or recursion cost early so you do not over-invest in the wrong approach.",
    starterQuestion:
      "If input size doubles, what part of this solution grows the fastest?",
    commonTrap:
      "Only counting loops and missing hidden costs from sorting, recursion trees, or nested data structure operations.",
    quickTips: [
      "Name the expensive operation, not just the outer loop.",
      "Check auxiliary space separately from input storage.",
      "Use the constraints to rule out whole families of approaches."
    ]
  }
] as const;
