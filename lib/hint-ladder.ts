import type { TechniqueId } from "@/lib/techniques";
import { getTechniqueById } from "@/lib/techniques";

// Five levels of increasing specificity. The UI reveals one at a time so a
// learner has to ask for more before getting more - level 1 never gives
// away what level 4 would.
export type HintLevel = 1 | 2 | 3 | 4 | 5;

export type HintLadderEntry = {
  level: HintLevel;
  label: string;
  text: string;
};

const LEVEL_LABELS: Record<HintLevel, string> = {
  1: "Observation",
  2: "Direction",
  3: "Core rule",
  4: "Pseudocode",
  5: "Code-level help"
};

// Hand-authored, technique-specific ladders for the highest-frequency
// interview patterns (the ones mapPatternToTechniqueId actually routes to
// today). Every other technique falls back to a ladder generated from its
// existing library fields below - real content, just less specific at the
// deepest levels.
const LADDERS: Partial<Record<TechniqueId, string[]>> = {
  "sliding-window": [
    "Notice that the question concerns a contiguous range or run inside the array or string.",
    "Think about whether you can maintain a moving range instead of restarting the scan from every position.",
    "Expand the window by moving right; shrink it from the left only while the window is already valid - each element still gets added and removed exactly once.",
    "for right in range(len(nums)):\n    add nums[right]\n    while window is valid:\n        update answer\n        remove nums[left]\n        left += 1",
    "The shrink condition is usually `while current_sum >= target:` (or similar) - and inside that loop you update the answer BEFORE removing the left element, not after."
  ],
  "two-pointers": [
    "Notice the input is sorted, or the question is really about pairs/triples that relate to each other from opposite ends.",
    "Think about whether moving one index closer while moving the other stays useful, instead of checking every pair.",
    "Move whichever pointer is on the side that can't possibly still be correct as-is - usually the smaller sum needs the left pointer to move up, or vice versa.",
    "left, right = 0, len(nums) - 1\nwhile left < right:\n    if condition too small: left += 1\n    elif condition too big: right -= 1\n    else: found it",
    "Make sure you're comparing the CURRENT sum/condition to the target inside the loop, and that both pointers can never cross (`left < right`, not `<=`)."
  ],
  "hash-map": [
    "Notice the question is really about looking something up fast - \"have I seen this before?\" or \"where was this?\"",
    "Think about what single piece of information you'd need to remember about each element to answer that question in O(1) instead of rescanning.",
    "Store the value (or count, or index) the moment you see it, then check the map BEFORE you insert the current element, not after.",
    "seen = {}\nfor i, value in enumerate(nums):\n    if complement in seen:\n        return [seen[complement], i]\n    seen[value] = i",
    "The most common bug is checking `seen` after inserting the current value - that lets an element match itself. Check first, then insert."
  ],
  "binary-search": [
    "Notice the input is sorted, or the answer itself is monotonic (true/false flips exactly once as some value increases).",
    "Think about which half you can safely throw away after one comparison, instead of scanning linearly.",
    "Keep the invariant that the answer is always still inside [left, right] - narrow one side every iteration based on the comparison, never both.",
    "left, right = 0, len(nums) - 1\nwhile left <= right:\n    mid = (left + right) // 2\n    if nums[mid] == target: return mid\n    elif nums[mid] < target: left = mid + 1\n    else: right = mid - 1",
    "The two easiest bugs: using `<` instead of `<=` in the loop condition, and forgetting `mid + 1` / `mid - 1` (using `mid` again causes an infinite loop)."
  ],
  stack: [
    "Notice the question involves matching, undoing, or comparing something to the most recently seen unfinished item.",
    "Think about what you'd need to \"remember\" in the order you'd need to undo it - last one in has to come out first.",
    "Push while things are still open/unresolved; pop exactly when the current element resolves the most recent one on top.",
    "stack = []\nfor item in items:\n    if item closes something: pop and check it matches\n    else: push item",
    "Don't forget to check the stack isn't empty before popping, and check it's fully empty at the very end - leftover items usually mean \"invalid\"."
  ],
  bfs: [
    "Notice the question asks for the shortest path, minimum steps, or level-by-level structure.",
    "Think about exploring everything at the current distance before going any further out, instead of diving deep first.",
    "After processing a node, everything you must remain true is: every node you enqueue is marked visited at the moment you enqueue it, not when you dequeue it.",
    "queue = deque([start])\nvisited = {start}\nwhile queue:\n    node = queue.popleft()\n    for neighbor in neighbors(node):\n        if neighbor not in visited:\n            visited.add(neighbor)\n            queue.append(neighbor)",
    "The classic bug: marking a node visited when you POP it instead of when you PUSH it - that lets the same node get queued multiple times."
  ],
  "dfs-backtracking": [
    "Notice the question wants you to explore all possibilities, paths, or combinations, not just one answer.",
    "Think about going as deep as possible down one choice before backing up and trying the next one.",
    "Whatever you changed on the way down (a visited mark, a partial path, a running sum) must be undone on the way back up before trying the next branch.",
    "def dfs(state):\n    if base case: record/return\n    for choice in choices:\n        make the choice\n        dfs(next state)\n        undo the choice",
    "The most common bug is forgetting the \"undo\" step (like `path.pop()` or unmarking visited) - without it, branches contaminate each other."
  ],
  intervals: [
    "Notice the question involves ranges that might overlap, merge, or need to be inserted among others.",
    "Think about what changes if you first sort the intervals by their start (or end) - does the problem get easier to scan left to right?",
    "Two intervals overlap exactly when the next one's start is less than or equal to the current one's end - that's the one condition nearly everything else builds on.",
    "intervals.sort(key=lambda x: x[0])\nresult = [intervals[0]]\nfor start, end in intervals[1:]:\n    if start <= result[-1][1]:\n        merge into result[-1]\n    else:\n        result.append([start, end])",
    "Watch the boundary: use `<=` for \"touching\" intervals to count as overlapping unless the problem says otherwise (e.g. [1,2] and [2,3])."
  ],
  heap: [
    "Notice the question keeps asking for the current smallest/largest/best item as things come and go.",
    "Think about whether you actually need everything sorted, or just fast access to the one extreme value at a time.",
    "A heap only guarantees the top is correct - keep it at exactly the size you need, popping the worst item whenever it grows past that.",
    "heap = []\nfor item in items:\n    heappush(heap, item)\n    if len(heap) > k:\n        heappop(heap)",
    "Python's heapq is a MIN-heap - for a max-heap behavior, push negated values (or negate on the way out)."
  ],
  "dynamic-programming": [
    "Notice the question asks for an optimum (min/max/count of ways) and smaller versions of the same problem show up inside the bigger one.",
    "Think about what the smallest version of this problem looks like, and how a bigger answer is built from smaller already-solved ones.",
    "Define exactly what dp[i] (or dp[i][j]) means in one sentence before writing any code - if you can't say it, the recurrence won't make sense either.",
    "dp = [base_case] * n\nfor i in range(1, n):\n    dp[i] = combine(dp[i-1], ...)\nreturn dp[-1]",
    "Trace the base case(s) by hand first (dp[0], dp[1]) - most DP bugs are actually a wrong base case, not a wrong recurrence."
  ],
  greedy: [
    "Notice the question asks you to make a sequence of local choices toward one global optimum.",
    "Think about what the \"obviously best\" choice is at each step, and whether committing to it early ever backfires.",
    "A greedy choice only works if it never has to be undone later - the earlier decision has to stay optimal no matter what comes after.",
    "sort by the relevant key\nfor item in sorted_items:\n    if item fits the current state: take it\n    else: skip it",
    "If you're not sure a greedy choice is actually always safe, try to find a small counterexample by hand before trusting the approach."
  ]
};

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

// Every technique in the library (40+) gets at least a usable ladder,
// generated from fields every TechniqueSeed already has - just less
// specific at the deepest levels than the hand-authored ones above.
function genericLadder(techniqueId: TechniqueId): string[] {
  const technique = getTechniqueById(techniqueId);
  if (!technique) {
    return [
      "Notice which part of the prompt is actually driving the difficulty here.",
      "Think about what structure in the data the problem is hinting at.",
      "Name the core idea out loud before writing any code.",
      "Sketch the approach in plain steps first, then translate one step at a time.",
      "Ask the coach directly - this technique doesn't have a canned pseudocode ladder yet."
    ];
  }
  return [
    truncate(technique.whenToThink, 200),
    truncate(technique.coreIdea, 200),
    truncate(technique.starterQuestion, 200),
    "There's no canned pseudocode for this technique yet - try sketching your approach in plain steps first, one line per step.",
    `Watch out for the common trap here: ${truncate(technique.commonTrap, 180)}`
  ];
}

export function getHintLadder(techniqueId: TechniqueId | null): HintLadderEntry[] {
  const texts = (techniqueId && LADDERS[techniqueId]) || (techniqueId ? genericLadder(techniqueId) : genericLadder("hash-map" as TechniqueId));
  return texts.map((text, index) => ({
    level: (index + 1) as HintLevel,
    label: LEVEL_LABELS[(index + 1) as HintLevel],
    text
  }));
}

export function getHint(techniqueId: TechniqueId | null, level: HintLevel): HintLadderEntry {
  const ladder = getHintLadder(techniqueId);
  return ladder[level - 1] ?? ladder[ladder.length - 1];
}

// Interpretation used by the skill vector: solving with no hints is strong
// independence evidence, Level 1 is still mostly independent, Level 3 is
// moderate dependence, Level 5 is weak independence evidence. Expressed as
// a 0-100 score so it composes with other independence signals.
export function independenceScoreForHintDepth(highestHintLevelUsed: number | null | undefined): number {
  if (highestHintLevelUsed == null) return 100;
  const byLevel: Record<number, number> = { 0: 100, 1: 85, 2: 65, 3: 45, 4: 25, 5: 10 };
  return byLevel[Math.max(0, Math.min(5, Math.round(highestHintLevelUsed)))] ?? 45;
}
