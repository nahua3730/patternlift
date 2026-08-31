// Client-safe pattern taxonomy. This module deliberately contains only
// generic pattern choices and teaching cues. It must never import the
// problem catalog or expose a problem -> correct-pattern association.
export const patternOptions = [
  {
    id: "hashing",
    label: "Hash Map / Set",
    firstSteps: [
      "Choose whether you need a set for membership or a map for counts and indices",
      "Store each value only once the lookup story is clear",
      "Use constant-time lookup to avoid rescanning old work"
    ],
    clues: ["need instant lookup", "count frequencies or duplicates", "pair or complement relationship"],
    coachPrompt: "Ask whether constant-time lookup, counting, or complement matching removes repeated scanning."
  },
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
    coachPrompt: "Ask whether the prompt gives you a monotonic condition that lets you eliminate half the search space."
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
    coachPrompt: "Ask whether the condition can be preserved by moving the left edge instead of restarting."
  },
  {
    id: "two-pointers",
    label: "Two Pointers",
    firstSteps: [
      "Place one pointer at each end or at neighboring positions",
      "Move pointers based on direct comparisons or a target value",
      "Use ordering to decide which pointer should move next"
    ],
    clues: ["sorted input", "pair or triplet relationship", "move two indices toward a target"],
    coachPrompt: "Ask whether two indices can move based on an ordering or direct comparison."
  },
  {
    id: "bfs",
    label: "Breadth-First Search",
    firstSteps: [
      "Initialize a queue with the starting node or state",
      "Expand neighbors level by level",
      "Track visited nodes so the same state is not reprocessed"
    ],
    clues: ["level order exploration", "shortest unweighted path", "expand all neighbors before going deeper"],
    coachPrompt: "Ask whether the problem naturally unfolds level by level rather than down one branch at a time."
  },
  {
    id: "dfs",
    label: "Depth-First Search",
    firstSteps: [
      "Go down one branch recursively or with a stack",
      "Track path state while exploring alternatives",
      "Backtrack after finishing the current branch"
    ],
    clues: ["explore one branch fully", "backtracking or subtree reasoning", "path state matters during recursion"],
    coachPrompt: "Ask whether the solution depends on exploring a branch deeply before trying alternatives."
  },
  {
    id: "stack",
    label: "Stack",
    firstSteps: [
      "Decide what should stay on the stack and what causes a pop",
      "Write the stack invariant before coding the loop",
      "Use the stack to remember unfinished work in the right order"
    ],
    clues: [
      "matching pairs or reversible order",
      "next greater or smaller signal",
      "need to undo or resolve the latest unfinished item"
    ],
    coachPrompt: "Ask whether the newest unfinished item should be resolved before older ones."
  },
  {
    id: "heap",
    label: "Heap / Priority Queue",
    firstSteps: [
      "Push candidate values into a min-heap or max-heap",
      "Pop the current best item when you need the next answer",
      "Keep heap size bounded if you only care about top k"
    ],
    clues: ["top k items", "repeatedly need current smallest or largest", "streaming updates with ranking"],
    coachPrompt: "Ask whether you need quick access to the current best candidate again and again."
  },
  {
    id: "intervals",
    label: "Intervals",
    firstSteps: [
      "Sort intervals if order helps make overlap decisions local",
      "Track the current merged range or the last safe ending boundary",
      "Update boundaries when overlap happens and commit when it does not"
    ],
    clues: ["overlapping ranges", "start and end boundaries matter", "merge, insert, erase, or schedule intervals"],
    coachPrompt: "Ask whether sorting ranges turns a global comparison into a local boundary decision."
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
    coachPrompt: "Ask whether a state and recurrence can capture repeated work or an optimal substructure."
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
    coachPrompt: "Ask whether a local choice can be proven safe without exploring every future branch."
  }
] as const;

export type PatternId = (typeof patternOptions)[number]["id"];

export function patternLabelForId(patternId: string | null | undefined) {
  return patternOptions.find((pattern) => pattern.id === patternId)?.label ?? patternId ?? "This pattern";
}
