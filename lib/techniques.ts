type TechniqueSeed = {
  id: string;
  title: string;
  sourceTrack: "essential-technique" | "data-structure";
  aliases: string[];
  whenToThink: string;
  coreIdea: string;
  starterQuestion: string;
  commonTrap: string;
  quickTips: string[];
  coachMoves: string[];
  signalMatchers: string[];
};

export const techniqueLibrary = [
  {
    id: "framework-thinking",
    title: "Framework Thinking",
    sourceTrack: "essential-technique",
    aliases: ["algorithm summary", "framework thinking"],
    whenToThink:
      "Use this before committing to a pattern when the problem still feels blurry.",
    coreIdea:
      "Reduce the prompt to what is being traversed, what state is being maintained, and what repeated work can be avoided.",
    starterQuestion:
      "Is this really a traversal problem, a range-maintenance problem, or a repeated-state problem?",
    commonTrap:
      "Jumping into syntax before naming the structure being explored and the information that must persist.",
    quickTips: [
      "Name the object you are traversing first: array, graph, tree, state space, or answer space.",
      "Ask what would be recomputed if you used pure brute force.",
      "If a problem feels messy, rewrite it as a smaller decision process."
    ],
    coachMoves: [
      "Ask the learner to classify the problem family before discussing code.",
      "Use this when the user is guessing patterns with no clear evidence.",
      "Steer attention toward traversal, state, and repeated work."
    ],
    signalMatchers: ["prompt", "array", "graph", "tree", "search", "state"]
  },
  {
    id: "recursion-perspective",
    title: "Recursion Perspective",
    sourceTrack: "essential-technique",
    aliases: ["recursion", "recursive thinking"],
    whenToThink:
      "Use this when the solution naturally repeats the same reasoning on smaller structure.",
    coreIdea:
      "Pick one recursive promise and stay consistent about what each call returns or what context each call receives.",
    starterQuestion:
      "What exactly should one recursive call be responsible for?",
    commonTrap:
      "Mixing traversal-style side effects with divide-and-conquer return values without separating responsibilities.",
    quickTips: [
      "Choose between traversal thinking and decomposition thinking before writing code.",
      "Say the recursive contract in plain English.",
      "Base case first, then child calls, then combine or restore."
    ],
    coachMoves: [
      "Use when the learner is hand-waving recursion.",
      "Compare traversal recursion with decomposition recursion.",
      "Force the learner to state what a call returns."
    ],
    signalMatchers: ["tree", "recursive", "subtree", "linked list", "dfs", "backtrack"]
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    sourceTrack: "essential-technique",
    aliases: ["fast slow pointers", "left right pointers"],
    whenToThink:
      "Use this when indices can move relative to each other based on ordering, symmetry, or pair/triplet conditions.",
    coreIdea:
      "Keep two positions whose movement rule is driven by a direct comparison or target gap.",
    starterQuestion:
      "What condition tells me which pointer should move next?",
    commonTrap:
      "Confusing a generic left-right scan with sliding window when no validity constraint is being maintained.",
    quickTips: [
      "Sorted input is a strong signal.",
      "Write the pointer movement rule before coding.",
      "Check whether both pointers move in the same direction or from opposite ends."
    ],
    coachMoves: [
      "Contrast it with sliding window.",
      "Ask the learner to justify how pointer movement changes information.",
      "Use it for arrays and linked lists when structure is linear."
    ],
    signalMatchers: [
      "sorted",
      "pair",
      "triplet",
      "palindrome",
      "linked list",
      "cycle",
      "remove duplicate"
    ]
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    sourceTrack: "essential-technique",
    aliases: ["window", "expand and shrink"],
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
    ],
    coachMoves: [
      "Ask for the invariant inside the window.",
      "Use it when the prompt says contiguous and the work can be reused.",
      "Push the learner to name the shrink condition."
    ],
    signalMatchers: [
      "substring",
      "subarray",
      "contiguous",
      "longest",
      "shortest",
      "window",
      "at most",
      "at least"
    ]
  },
  {
    id: "binary-search",
    title: "Binary Search",
    sourceTrack: "essential-technique",
    aliases: ["search interval", "binary search on answer"],
    whenToThink:
      "Use this when the input or answer space has a monotonic property that lets you discard half the candidates.",
    coreIdea:
      "Maintain a search interval and move left or right based on a feasibility or ordering check.",
    starterQuestion:
      "What monotonic property lets me throw away half the space?",
    commonTrap:
      "Only looking for sorted arrays and missing answer-space binary search.",
    quickTips: [
      "Separate the search space from the check function.",
      "Pick a loop invariant before choosing <= or <.",
      "For answer search, define what counts as feasible."
    ],
    coachMoves: [
      "Ask whether bigger answers become easier or harder.",
      "Contrast direct search with search on answer.",
      "Use it when the user says sorted, threshold, capacity, minimum feasible, or maximum feasible."
    ],
    signalMatchers: [
      "sorted",
      "rotated",
      "minimum feasible",
      "maximum feasible",
      "capacity",
      "threshold",
      "search",
      "koko"
    ]
  },
  {
    id: "bfs",
    title: "Breadth-First Search",
    sourceTrack: "essential-technique",
    aliases: ["level order", "shortest path in unweighted graph"],
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
    ],
    coachMoves: [
      "Ask what one BFS layer represents.",
      "Use it when the prompt mentions level, minimum moves, or shortest path.",
      "Push the learner to define visited state clearly."
    ],
    signalMatchers: [
      "level order",
      "minimum steps",
      "shortest path",
      "unweighted",
      "open lock",
      "word ladder",
      "nearest"
    ]
  },
  {
    id: "dfs-backtracking",
    title: "DFS and Backtracking",
    sourceTrack: "essential-technique",
    aliases: ["decision tree", "backtrack"],
    whenToThink:
      "Use this when you need to explore choices, paths, permutations, subsets, or constraint-based search.",
    coreIdea:
      "Make a choice, recurse, then undo the choice so you can explore the next branch cleanly.",
    starterQuestion:
      "What state changes when I go deeper, and what must be restored when I return?",
    commonTrap:
      "Writing recursion without naming the path, remaining choices, termination condition, and undo step.",
    quickTips: [
      "A path container plus choose / recurse / unchoose is a strong default.",
      "Decide whether elements can be reused before coding.",
      "Prune early when a branch can no longer succeed."
    ],
    coachMoves: [
      "Ask the learner to describe the decision tree.",
      "Use it for subset, permutation, combination, and constraint search problems.",
      "Contrast traversal thinking with DP when repeated states appear."
    ],
    signalMatchers: [
      "permutation",
      "combination",
      "subset",
      "n queens",
      "all possible",
      "restore",
      "path",
      "choices"
    ]
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    sourceTrack: "essential-technique",
    aliases: ["memoization", "state transition"],
    whenToThink:
      "Use this when smaller subproblems overlap and the current answer depends on earlier or smaller states.",
    coreIdea:
      "Define state, transition, and base case so repeated work becomes reusable structure.",
    starterQuestion:
      "What is the smallest state that fully captures the future decision?",
    commonTrap:
      "Jumping into tables before clearly naming the state and transition.",
    quickTips: [
      "Write the state in plain English first.",
      "Try recursion plus memo before tabulation if the structure is fuzzy.",
      "Look for repeated subproblems and optimal substructure."
    ],
    coachMoves: [
      "Ask for state, choice, and base case explicitly.",
      "Use it when the learner senses repetition but cannot structure it.",
      "Contrast memoization with brute force and greedy."
    ],
    signalMatchers: [
      "minimum cost",
      "maximum profit",
      "ways",
      "dp",
      "memo",
      "overlapping",
      "coins",
      "rob"
    ]
  },
  {
    id: "greedy",
    title: "Greedy",
    sourceTrack: "essential-technique",
    aliases: ["locally optimal"],
    whenToThink:
      "Use this when a local decision can be justified as safely preserving a globally optimal path.",
    coreIdea:
      "Commit to the strongest local move that never harms the best final answer.",
    starterQuestion:
      "Why is this local decision safe to make immediately?",
    commonTrap:
      "Calling an idea greedy just because it feels intuitive, without an exchange or safety argument.",
    quickTips: [
      "Look for interval scheduling, one-pass commitment, or sort-by-key structure.",
      "State the invariant the local choice preserves.",
      "If you cannot explain safety, test DP or backtracking instead."
    ],
    coachMoves: [
      "Ask the learner to justify safety, not just convenience.",
      "Use it when the best local move appears repeatedly.",
      "Contrast with DP when future consequences really matter."
    ],
    signalMatchers: [
      "interval",
      "jump",
      "minimum arrows",
      "can reach",
      "schedule",
      "erase overlap"
    ]
  },
  {
    id: "divide-conquer",
    title: "Divide and Conquer",
    sourceTrack: "essential-technique",
    aliases: ["problem decomposition"],
    whenToThink:
      "Use this when the problem becomes simpler after splitting it into smaller independent subproblems and merging the results.",
    coreIdea:
      "Break the task apart, solve subproblems recursively, and combine their answers in a meaningful merge step.",
    starterQuestion:
      "What natural split gives me smaller versions of the same problem?",
    commonTrap:
      "Using recursion without a clear merge or decomposition benefit.",
    quickTips: [
      "Merge sort and tree aggregation are classic anchors.",
      "Be explicit about the combine cost.",
      "Check whether the split creates repeated subproblems, which may push you toward DP."
    ],
    coachMoves: [
      "Ask what each subproblem returns.",
      "Use it when the answer is a merge of left and right halves or subtrees.",
      "Contrast it with traversal recursion."
    ],
    signalMatchers: [
      "merge",
      "subtree",
      "left half",
      "right half",
      "split",
      "combine"
    ]
  },
  {
    id: "binary-tree-recursion",
    title: "Binary Tree Recursion",
    sourceTrack: "essential-technique",
    aliases: ["tree dp", "tree traversal"],
    whenToThink:
      "Use this when each node's answer depends on answers from its children or on context flowing from the root.",
    coreIdea:
      "Think in terms of what the subtree returns upward or what information the parent passes downward.",
    starterQuestion:
      "Do I need information flowing upward, downward, or both?",
    commonTrap:
      "Mixing subtree return values with path-side effects without separating responsibilities.",
    quickTips: [
      "Postorder often fits subtree aggregation.",
      "Preorder often fits passing context downward.",
      "State what one recursive call promises to return."
    ],
    coachMoves: [
      "Use it when the prompt is about tree structure rather than just graph search.",
      "Ask the learner to define the subtree contract.",
      "Connect it back to recursion perspective."
    ],
    signalMatchers: [
      "binary tree",
      "subtree",
      "lowest common ancestor",
      "path sum",
      "diameter",
      "balanced tree"
    ]
  },
  {
    id: "prefix-sum",
    title: "Prefix Sum",
    sourceTrack: "data-structure",
    aliases: ["range sum", "preSum"],
    whenToThink:
      "Use this when the array stays fixed and you need many fast range-sum or cumulative queries.",
    coreIdea:
      "Precompute cumulative totals so each range answer becomes a subtraction instead of a loop.",
    starterQuestion:
      "Can I precompute something once so every interval query becomes O(1)?",
    commonTrap:
      "Using prefix sum when the underlying array changes frequently or when the operation has no clean inverse.",
    quickTips: [
      "Immutable range query language is a strong clue.",
      "Think of prefix sum as paying once up front to answer many queries cheaply.",
      "It extends beyond sums if the operation has an inverse."
    ],
    coachMoves: [
      "Use it for repeated interval queries.",
      "Contrast it with sliding window: one is offline precompute, the other is online maintenance.",
      "Warn when updates break the precomputation."
    ],
    signalMatchers: [
      "range sum",
      "many queries",
      "immutable",
      "submatrix sum",
      "interval sum",
      "prefix"
    ]
  },
  {
    id: "difference-array",
    title: "Difference Array",
    sourceTrack: "data-structure",
    aliases: ["range update", "diff array"],
    whenToThink:
      "Use this when many operations add or subtract across index intervals and you only need the final array or totals later.",
    coreIdea:
      "Record changes at the boundaries, then rebuild the final values with a prefix sweep.",
    starterQuestion:
      "Can I mark where each range update starts and ends instead of touching every element?",
    commonTrap:
      "Applying updates element by element even though the work only matters after all operations are done.",
    quickTips: [
      "Range addition and bookings problems are classic signals.",
      "Difference array pairs naturally with prefix reconstruction.",
      "It is about batch updates, not interactive queries."
    ],
    coachMoves: [
      "Use it when many interval updates appear.",
      "Contrast it with prefix sum: updates first, reconstruction later.",
      "Ask whether the learner needs intermediate states or only the final one."
    ],
    signalMatchers: [
      "range addition",
      "bookings",
      "car pooling",
      "increment",
      "decrement",
      "batch update"
    ]
  },
  {
    id: "monotonic-stack",
    title: "Monotonic Stack",
    sourceTrack: "data-structure",
    aliases: ["next greater element", "previous smaller"],
    whenToThink:
      "Use this when each element wants the next or previous larger or smaller candidate while preserving order.",
    coreIdea:
      "Keep a stack in monotonic order so dominated candidates disappear as soon as a stronger one arrives.",
    starterQuestion:
      "What candidates can never matter again once this new value appears?",
    commonTrap:
      "Treating these as nested-loop comparison problems instead of removing dominated candidates early.",
    quickTips: [
      "Next greater, daily temperatures, and histogram-style problems are strong clues.",
      "Decide whether you need increasing or decreasing order before coding.",
      "Indices are often more useful than raw values."
    ],
    coachMoves: [
      "Use it when the prompt asks for nearest greater or smaller relationships.",
      "Ask what the stack invariant is.",
      "Mention circular-array handling when the prompt wraps around."
    ],
    signalMatchers: [
      "next greater",
      "previous smaller",
      "daily temperatures",
      "histogram",
      "span",
      "circular array"
    ]
  },
  {
    id: "monotonic-queue",
    title: "Monotonic Queue",
    sourceTrack: "data-structure",
    aliases: ["sliding window maximum", "deque optimization"],
    whenToThink:
      "Use this when a sliding window repeatedly asks for the max or min while elements enter and leave.",
    coreIdea:
      "Maintain a deque of useful candidates so the current window's extreme stays available in constant time.",
    starterQuestion:
      "How can I keep the window's best candidate without rescanning the whole window?",
    commonTrap:
      "Knowing it is a sliding window problem but still recomputing the max or min from scratch each step.",
    quickTips: [
      "Sliding window maximum is the signature problem.",
      "Expired indices leave from the front, dominated ones leave from the back.",
      "This is a data structure upgrade on top of sliding window."
    ],
    coachMoves: [
      "Use it when sliding window needs a fast extreme value.",
      "Contrast it with heaps when strict window expiration matters.",
      "Ask what gets popped from each side of the deque."
    ],
    signalMatchers: [
      "sliding window maximum",
      "sliding window minimum",
      "deque",
      "window max",
      "window min"
    ]
  },
  {
    id: "heap",
    title: "Heap / Priority Queue",
    sourceTrack: "data-structure",
    aliases: ["priority queue", "top k"],
    whenToThink:
      "Use this when you repeatedly need the current smallest or largest item, especially for top-k, streaming, or best-first extraction tasks.",
    coreIdea:
      "Maintain a structure where each push or pop keeps the highest-priority candidate easy to access.",
    starterQuestion:
      "Do I need the best item over and over, or just once at the end?",
    commonTrap:
      "Sorting everything up front when the problem only needs the next best candidate repeatedly.",
    quickTips: [
      "Top-k language is a strong clue.",
      "Decide whether a min-heap or max-heap makes the invariant easier.",
      "If only k items matter, cap the heap size."
    ],
    coachMoves: [
      "Use it for repeated best-candidate access.",
      "Contrast it with monotonic queue when order expiration matters.",
      "Ask whether the full ordering is necessary."
    ],
    signalMatchers: [
      "top k",
      "kth largest",
      "priority",
      "stream",
      "merge k",
      "smallest pair"
    ]
  },
  {
    id: "complexity",
    title: "Complexity Checks",
    sourceTrack: "essential-technique",
    aliases: ["time complexity", "space complexity"],
    whenToThink:
      "Use this before and after coding to catch solutions that are correct but too expensive.",
    coreIdea:
      "Estimate the dominant cost early so you do not over-invest in a doomed approach.",
    starterQuestion:
      "If the input doubles, which part of this approach grows the fastest?",
    commonTrap:
      "Only counting visible loops and missing sorting, recursion branching, or hidden data structure costs.",
    quickTips: [
      "Use the constraints to eliminate whole approach families.",
      "Name the expensive operation, not just the outer loop.",
      "Check auxiliary space separately from input storage."
    ],
    coachMoves: [
      "Use it when the learner's idea is plausible but too slow.",
      "Connect constraints to acceptable complexity bands.",
      "Force comparison between brute force and optimized paths."
    ],
    signalMatchers: [
      "constraint",
      "10^5",
      "10^4",
      "time limit",
      "optimize",
      "efficient"
    ]
  }
] as const satisfies readonly TechniqueSeed[];

export type Technique = (typeof techniqueLibrary)[number];
export type TechniqueId = Technique["id"];

export type TechniqueBrief = {
  title: string;
  whyItFits: string;
  starterQuestion: string;
  commonTrap: string;
  quickTips: string[];
  coachMoves: string[];
};

const techniqueById = new Map<TechniqueId, Technique>(
  techniqueLibrary.map((technique) => [technique.id, technique])
);

export function getTechniqueById(id: TechniqueId) {
  return techniqueById.get(id) ?? null;
}

export function getSuggestedTechniques(options: {
  primaryPatternId: string | null;
  contrastPatternId: string | null;
  problemPrompt: string;
}) {
  const scores = new Map<TechniqueId, number>();
  const normalized = options.problemPrompt.toLowerCase();

  function bump(id: TechniqueId, points: number) {
    scores.set(id, (scores.get(id) ?? 0) + points);
  }

  const primary = mapPatternToTechniqueId(options.primaryPatternId);
  const contrast = mapPatternToTechniqueId(options.contrastPatternId);

  if (primary) bump(primary, 5);
  if (contrast && contrast !== primary) bump(contrast, 3);

  if (normalized.includes("tree") || normalized.includes("binary tree")) {
    bump("binary-tree-recursion", 4);
    bump("recursion-perspective", 2);
  }

  if (normalized.includes("graph")) {
    bump("framework-thinking", 2);
  }

  if (
    normalized.includes("substring") ||
    normalized.includes("subarray") ||
    normalized.includes("contiguous")
  ) {
    bump("sliding-window", 4);
  }

  if (normalized.includes("sorted") || normalized.includes("rotated")) {
    bump("binary-search", 3);
    bump("two-pointers", 2);
  }

  if (normalized.includes("top k") || normalized.includes("k most")) {
    bump("heap", 4);
  }

  if (
    normalized.includes("shortest path") ||
    normalized.includes("minimum steps") ||
    normalized.includes("level order")
  ) {
    bump("bfs", 4);
  }

  if (
    normalized.includes("permutation") ||
    normalized.includes("combination") ||
    normalized.includes("subset")
  ) {
    bump("dfs-backtracking", 4);
  }

  if (
    normalized.includes("ways") ||
    normalized.includes("minimum cost") ||
    normalized.includes("maximum profit") ||
    normalized.includes("coin")
  ) {
    bump("dynamic-programming", 3);
  }

  if (normalized.includes("query") && normalized.includes("sum")) {
    bump("prefix-sum", 4);
  }

  if (
    normalized.includes("range addition") ||
    normalized.includes("bookings") ||
    (normalized.includes("range") && normalized.includes("update"))
  ) {
    bump("difference-array", 4);
  }

  if (
    normalized.includes("next greater") ||
    normalized.includes("daily temperature") ||
    normalized.includes("histogram")
  ) {
    bump("monotonic-stack", 4);
  }

  if (
    normalized.includes("sliding window maximum") ||
    normalized.includes("sliding window minimum")
  ) {
    bump("monotonic-queue", 5);
    bump("sliding-window", 2);
  }

  if (
    normalized.includes("minimum") ||
    normalized.includes("maximum") ||
    normalized.includes("constraint") ||
    normalized.includes("10^5")
  ) {
    bump("complexity", 2);
  }

  for (const technique of techniqueLibrary) {
    const extraMatches = technique.signalMatchers.filter((signal) =>
      normalized.includes(signal)
    ).length;

    if (extraMatches > 0) {
      bump(technique.id, extraMatches);
    }
  }

  if (scores.size === 0) {
    bump("framework-thinking", 3);
    bump("complexity", 2);
  }

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([id]) => techniqueById.get(id))
    .filter((technique): technique is Technique => Boolean(technique));
}

export function buildTechniqueBriefs(techniques: readonly Technique[]): TechniqueBrief[] {
  return techniques.map((technique) => ({
    title: technique.title,
    whyItFits: technique.whenToThink,
    starterQuestion: technique.starterQuestion,
    commonTrap: technique.commonTrap,
    quickTips: technique.quickTips,
    coachMoves: technique.coachMoves
  }));
}

function mapPatternToTechniqueId(patternId: string | null): TechniqueId | null {
  if (!patternId) return null;

  switch (patternId) {
    case "sliding-window":
      return "sliding-window";
    case "two-pointers":
      return "two-pointers";
    case "bfs":
      return "bfs";
    case "dfs":
      return "dfs-backtracking";
    case "dynamic-programming":
      return "dynamic-programming";
    case "heap":
      return "heap";
    default:
      return null;
  }
}
