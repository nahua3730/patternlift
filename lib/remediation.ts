import type { TechniqueId } from "@/lib/techniques";
import type { FailureCategory } from "@/lib/diagnosis";

export type RemediationInteractionType =
  | "binary_choice"
  | "multiple_choice"
  | "order_steps"
  | "fill_blank"
  | "trace_state"
  | "predict_next_step"
  | "explain_briefly"
  | "code_fragment"
  | "micro_implementation";

// Interaction types above are the pedagogical label (what kind of thinking
// this asks for); payload "shape" is the much smaller set of UI patterns
// that actually render them - several interaction types share a shape
// (trace_state and predict_next_step are both "pick the right option", just
// framed differently).
type ChoicePayload = {
  shape: "choice";
  context?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  correctExplain: string;
  incorrectExplain: string;
};

type OrderPayload = {
  shape: "order";
  prompt: string;
  steps: string[];
  correctOrder: number[];
  explain: string;
};

type BlankPayload = {
  shape: "blank";
  prompt: string;
  template?: string;
  acceptableAnswers: string[];
  explain: string;
};

type FreePayload = {
  shape: "free";
  prompt: string;
  sampleGoodAnswer: string;
};

export type RemediationPayload = ChoicePayload | OrderPayload | BlankPayload | FreePayload;

// What should happen once this drill is answered - maps to Part 12's retry
// strategy. "fresh_problem" needs the caller to supply a different problem
// id (session-runner does this from the day's problem list); the other two
// reuse whatever problem the learner was just on.
export type RemediationNextAction = "retry_same" | "fresh_recognition_prompt" | "fresh_problem";

export type RemediationActivity = {
  id: string;
  techniqueId: TechniqueId | "generic";
  failureType: FailureCategory;
  title: string;
  instruction: string;
  estimatedMinutes: number;
  interactionType: RemediationInteractionType;
  difficulty: "intro" | "core";
  payload: RemediationPayload;
  successCriteria: string;
  nextAction: RemediationNextAction;
};

function choice(over: Omit<ChoicePayload, "shape">): ChoicePayload {
  return { shape: "choice", ...over };
}
function order(over: Omit<OrderPayload, "shape">): OrderPayload {
  return { shape: "order", ...over };
}
function blank(over: Omit<BlankPayload, "shape">): BlankPayload {
  return { shape: "blank", ...over };
}
function free(over: Omit<FreePayload, "shape">): FreePayload {
  return { shape: "free", ...over };
}

// Hand-authored, full seven-gap coverage for Sliding Window - the worked
// example the product spec itself uses throughout. Every other priority
// technique gets at least recognition/concept/reasoning/implementation;
// the generic entries below cover the rest and every non-priority technique.
const CATALOG: RemediationActivity[] = [
  // ---------- sliding-window ----------
  {
    id: "sw-recognition",
    techniqueId: "sliding-window",
    failureType: "recognition_gap",
    title: "Sliding Window or Two Pointers?",
    instruction: "Pick the technique, then say one short reason - no code yet.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Find the shortest contiguous subarray whose sum is at least target.\"",
      prompt: "Which technique fits this prompt?",
      options: ["Sliding Window", "Two Pointers (opposite ends)"],
      correctIndex: 0,
      correctExplain: "Right - the range has to stay contiguous and you're growing/shrinking one moving window, not converging two ends of a sorted structure.",
      incorrectExplain: "Two Pointers usually converges from opposite ends of something already ordered. Here you need a contiguous run that grows and shrinks - that's the window signal."
    }),
    successCriteria: "Selects Sliding Window",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "sw-concept",
    techniqueId: "sliding-window",
    failureType: "concept_gap",
    title: "What actually changes when the window moves?",
    instruction: "Answer in one sentence - this checks whether the core idea is solid, not the code.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "For a sliding window, what changes when the right pointer moves forward one step?",
      sampleGoodAnswer: "The window grows to include one more element, so whatever running total or count you're tracking (sum, distinct characters, etc.) needs to be updated to include that new element."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "sw-reasoning",
    techniqueId: "sliding-window",
    failureType: "reasoning_gap",
    title: "Should the window shrink?",
    instruction: "Trace this exact state and decide.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "core",
    payload: choice({
      context: "Current window: [2, 3, 1, 2], sum = 8, target = 7 (looking for shortest subarray with sum >= target)",
      prompt: "Should the left pointer move?",
      options: ["Yes - the window is already valid, try to shrink it", "No - the window doesn't satisfy the target yet"],
      correctIndex: 0,
      correctExplain: "Right - sum (8) already meets target (7), so this window is valid. Shrinking from the left might still keep it valid while giving a shorter answer, and you only know that by trying.",
      incorrectExplain: "Check again: sum is 8 and target is 7, so 8 >= 7 - the window IS already valid. Once it's valid, the shrink loop should run, not stop."
    }),
    successCriteria: "Selects 'Yes, shrink'",
    nextAction: "retry_same"
  },
  {
    id: "sw-transition",
    techniqueId: "sliding-window",
    failureType: "transition_gap",
    title: "What happens next?",
    instruction: "Given this state, pick the correct next move.",
    estimatedMinutes: 2,
    interactionType: "predict_next_step",
    difficulty: "core",
    payload: choice({
      context: "left = 1, right = 4, sum = 11, target = 8",
      prompt: "What should happen next?",
      options: ["Move right (expand)", "Move left (shrink) and update the answer", "Reset both pointers", "Return the answer immediately"],
      correctIndex: 1,
      correctExplain: "sum (11) already meets target (8), so the window is valid - update the answer with the current window size, then shrink from the left to look for something even shorter.",
      incorrectExplain: "sum (11) is already >= target (8) - the window is valid right now. When it's valid, you update the answer and shrink from the left, not expand further or reset."
    }),
    successCriteria: "Selects 'Move left and update the answer'",
    nextAction: "retry_same"
  },
  {
    id: "sw-implementation",
    techniqueId: "sliding-window",
    failureType: "implementation_gap",
    title: "Fill in the missing update",
    instruction: "The overall shape of this code is right - only the shrink step is missing.",
    estimatedMinutes: 3,
    interactionType: "fill_blank",
    difficulty: "core",
    payload: blank({
      template: "while current_sum >= target:\n    best = min(best, right - left + 1)\n    current_sum -= ______\n    left += 1",
      prompt: "What goes in the blank?",
      acceptableAnswers: ["nums[left]", "nums[ left ]", "arr[left]"],
      explain: "You're removing the element that's about to leave the window - that's whatever is at the current `left` index, before you advance it."
    }),
    successCriteria: "Fills in nums[left]",
    nextAction: "retry_same"
  },
  {
    id: "sw-edge-case",
    techniqueId: "sliding-window",
    failureType: "edge_case_gap",
    title: "Two edge cases worth checking",
    instruction: "Quick check on boundaries before your next attempt.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "intro",
    payload: choice({
      prompt: "What should the initial value of `best` (the answer you're tracking) be, before the loop starts?",
      options: ["0", "Infinity (or a value larger than any possible window)", "-1", "The length of the array"],
      correctIndex: 1,
      correctExplain: "Right - you're taking a minimum, so start higher than any real answer could be. If no valid window ever appears, you can then detect that and return 0 (or whatever the problem asks for \"not found\").",
      incorrectExplain: "You're computing a MINIMUM window size. Starting at 0 would make every real answer look worse than the starting value - start with something guaranteed to be beaten, like infinity."
    }),
    successCriteria: "Selects 'Infinity'",
    nextAction: "retry_same"
  },
  {
    id: "sw-recall",
    techniqueId: "sliding-window",
    failureType: "recall_gap",
    title: "Cold reconstruction: Sliding Window",
    instruction: "Without looking anything up, reconstruct the essentials.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "core",
    payload: free({
      prompt: "In one or two sentences: what's the first move, and what's the core rule that decides when to shrink the window?",
      sampleGoodAnswer: "Start with both pointers at the beginning and grow the window by moving right. The core rule: whenever the window already satisfies the condition, try shrinking from the left before moving right again."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "fresh_problem"
  },

  // ---------- two-pointers ----------
  {
    id: "tp-recognition",
    techniqueId: "two-pointers",
    failureType: "recognition_gap",
    title: "Two Pointers or Sliding Window?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Given a sorted array, find two numbers that add up to a target.\"",
      prompt: "Which technique fits this prompt?",
      options: ["Two Pointers (opposite ends)", "Sliding Window"],
      correctIndex: 0,
      correctExplain: "Right - the array is already sorted and you're looking for a PAIR, not a contiguous run - converging from both ends is the natural fit.",
      incorrectExplain: "Sliding Window is for contiguous ranges that grow and shrink. Here you have a sorted array and want a pair - that's the converging-pointers signal."
    }),
    successCriteria: "Selects Two Pointers",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "tp-concept",
    techniqueId: "two-pointers",
    failureType: "concept_gap",
    title: "Why does moving one pointer stay safe?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "In a sorted array, why is it safe to move the left pointer forward once you know the current pair's sum is too small?",
      sampleGoodAnswer: "Because the array is sorted, every pair using the old left value and anything to its left would be even smaller - moving left forward is the only way to increase the sum."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "tp-reasoning",
    techniqueId: "two-pointers",
    failureType: "reasoning_gap",
    title: "Which pointer moves?",
    instruction: "Trace this exact state.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "core",
    payload: choice({
      context: "nums = [2, 7, 11, 15], target = 9, left points to 2, right points to 15",
      prompt: "Current sum is 17, which is too big. What should move?",
      options: ["right, moving inward", "left, moving inward"],
      correctIndex: 0,
      correctExplain: "Right - the sum is too big, so you need a smaller value. Moving right inward can only decrease the sum (sorted array); moving left can only increase it.",
      incorrectExplain: "The sum (17) is too big - you need it smaller. Since the array is sorted, only moving right inward (toward smaller values) can reduce the sum."
    }),
    successCriteria: "Selects 'right, moving inward'",
    nextAction: "retry_same"
  },
  {
    id: "tp-implementation",
    techniqueId: "two-pointers",
    failureType: "implementation_gap",
    title: "Fill in the missing comparison",
    instruction: "Only one condition is missing.",
    estimatedMinutes: 3,
    interactionType: "fill_blank",
    difficulty: "core",
    payload: blank({
      template: "while left < right:\n    total = nums[left] + nums[right]\n    if total == target: return [left, right]\n    elif ______: left += 1\n    else: right -= 1",
      prompt: "What condition goes in the blank?",
      acceptableAnswers: ["total < target"],
      explain: "If the total is too small, you need a bigger value - moving `left` forward (toward larger values in a sorted array) is the only move that can increase the sum."
    }),
    successCriteria: "Fills in total < target",
    nextAction: "retry_same"
  },

  // ---------- hash-map ----------
  {
    id: "hm-recognition",
    techniqueId: "hash-map",
    failureType: "recognition_gap",
    title: "Hash Map or Two Pointers?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Given an unsorted array, find two numbers that add up to a target.\"",
      prompt: "Which technique fits this prompt?",
      options: ["Hash Map / Set", "Two Pointers (opposite ends)"],
      correctIndex: 0,
      correctExplain: "Right - the array is unsorted, so converging pointers don't have a valid order to lean on. A hash map lets you check \"have I seen the complement?\" in O(1) regardless of order.",
      incorrectExplain: "Two Pointers relies on the array being sorted (or on a structure with a clear order). This one is unsorted - that's the hash map signal, not two pointers."
    }),
    successCriteria: "Selects Hash Map / Set",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "hm-concept",
    techniqueId: "hash-map",
    failureType: "concept_gap",
    title: "What should the map actually store?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "For Two Sum, what should the hash map store as its keys and values?",
      sampleGoodAnswer: "Keys are the values already seen in the array, and the value stored for each key is that element's index, so once you find the complement you can return both indices."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "hm-reasoning",
    techniqueId: "hash-map",
    failureType: "reasoning_gap",
    title: "Check before or after?",
    instruction: "This decides whether the answer is correct at all.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "core",
    payload: choice({
      prompt: "Should you check the map for the complement BEFORE or AFTER inserting the current value?",
      options: ["Before inserting", "After inserting"],
      correctIndex: 0,
      correctExplain: "Right - checking first means the current element can never match itself. Checking after would let, e.g., nums[i] + nums[i] falsely match against itself.",
      incorrectExplain: "If you insert first and check second, an element could match against itself in the map. Check for the complement BEFORE you insert the current value."
    }),
    successCriteria: "Selects 'Before inserting'",
    nextAction: "retry_same"
  },
  {
    id: "hm-implementation",
    techniqueId: "hash-map",
    failureType: "implementation_gap",
    title: "Fill in the missing lookup",
    instruction: "Only the complement check is missing.",
    estimatedMinutes: 3,
    interactionType: "fill_blank",
    difficulty: "core",
    payload: blank({
      template: "seen = {}\nfor i, value in enumerate(nums):\n    complement = target - value\n    if ______:\n        return [seen[complement], i]\n    seen[value] = i",
      prompt: "What goes in the blank?",
      acceptableAnswers: ["complement in seen"],
      explain: "You're checking whether the value that would complete the pair has already been seen and stored in the map."
    }),
    successCriteria: "Fills in complement in seen",
    nextAction: "retry_same"
  },

  // ---------- binary-search ----------
  {
    id: "bs-recognition",
    techniqueId: "binary-search",
    failureType: "recognition_gap",
    title: "Binary Search or linear scan?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Find the target in a sorted array in better than O(n).\"",
      prompt: "Which approach fits?",
      options: ["Binary Search", "Linear scan"],
      correctIndex: 0,
      correctExplain: "Right - sorted input plus a better-than-O(n) requirement is exactly the binary search signal: you can eliminate half the remaining space each comparison.",
      incorrectExplain: "The array is sorted and the problem wants better than O(n) - that combination is the binary search signal, since each comparison can eliminate half the space."
    }),
    successCriteria: "Selects Binary Search",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "bs-concept",
    techniqueId: "binary-search",
    failureType: "concept_gap",
    title: "What stays true throughout the search?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "What must remain true about [left, right] throughout binary search, if the target exists?",
      sampleGoodAnswer: "The target, if it exists, is always still somewhere inside the current [left, right] range - every step narrows that range without ever excluding the target."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "bs-reasoning",
    techniqueId: "binary-search",
    failureType: "reasoning_gap",
    title: "Which half is eliminated?",
    instruction: "Trace this exact state.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "core",
    payload: choice({
      context: "Sorted array, target = 15, nums[mid] = 9",
      prompt: "Since nums[mid] (9) is less than target (15), what should happen?",
      options: ["left = mid + 1 (search the right half)", "right = mid - 1 (search the left half)"],
      correctIndex: 0,
      correctExplain: "Right - if mid's value is too small, the target (if present) must be to the right of mid, so the left half including mid can be eliminated.",
      incorrectExplain: "nums[mid] (9) is smaller than the target (15) - since the array is sorted, the target must be further right. Eliminate the left half instead."
    }),
    successCriteria: "Selects 'left = mid + 1'",
    nextAction: "retry_same"
  },
  {
    id: "bs-implementation",
    techniqueId: "binary-search",
    failureType: "implementation_gap",
    title: "Fill in the missing bound update",
    instruction: "Only one line is missing.",
    estimatedMinutes: 3,
    interactionType: "fill_blank",
    difficulty: "core",
    payload: blank({
      template: "while left <= right:\n    mid = (left + right) // 2\n    if nums[mid] == target: return mid\n    elif nums[mid] < target: ______\n    else: right = mid - 1",
      prompt: "What goes in the blank?",
      acceptableAnswers: ["left = mid + 1"],
      explain: "If nums[mid] is too small, the target must be to the right - move the left bound past mid."
    }),
    successCriteria: "Fills in left = mid + 1",
    nextAction: "retry_same"
  },

  // ---------- stack ----------
  {
    id: "st-recognition",
    techniqueId: "stack",
    failureType: "recognition_gap",
    title: "Stack or nothing extra needed?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Check whether a string of brackets is validly matched.\"",
      prompt: "Which approach fits?",
      options: ["Stack", "Two Pointers"],
      correctIndex: 0,
      correctExplain: "Right - matching has to respect \"most recently opened, first closed\" order, which is exactly what a stack gives you.",
      incorrectExplain: "This needs to track unresolved opens in last-in-first-out order - that's a stack, not a pointer pattern."
    }),
    successCriteria: "Selects Stack",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "st-concept",
    techniqueId: "stack",
    failureType: "concept_gap",
    title: "What does popping actually mean here?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "For a bracket-matching problem, what does popping the stack represent?",
      sampleGoodAnswer: "Popping means the most recently opened bracket is now being closed - if the popped bracket doesn't match the current closing one, the string is invalid."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "st-reasoning",
    techniqueId: "stack",
    failureType: "reasoning_gap",
    title: "Push or pop?",
    instruction: "Trace this exact state.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "core",
    payload: choice({
      context: "Stack currently holds: ['(', '[']. Next character is ']'.",
      prompt: "What should happen?",
      options: ["Pop '[' and confirm it matches ']'", "Push ']' onto the stack"],
      correctIndex: 0,
      correctExplain: "Right - a closing bracket should pop and check against the top of the stack, since that's the most recently opened unresolved bracket.",
      incorrectExplain: "Only opening brackets get pushed. A closing bracket should pop the top of the stack and verify it's the matching opener."
    }),
    successCriteria: "Selects 'Pop and confirm'",
    nextAction: "retry_same"
  },
  {
    id: "st-implementation",
    techniqueId: "stack",
    failureType: "implementation_gap",
    title: "Fill in the missing check",
    instruction: "Only the match check is missing.",
    estimatedMinutes: 3,
    interactionType: "fill_blank",
    difficulty: "core",
    payload: blank({
      template: "for char in s:\n    if char in '([{':\n        stack.append(char)\n    else:\n        if not stack or ______:\n            return False\n        stack.pop()",
      prompt: "What goes in the blank?",
      acceptableAnswers: ["stack[-1] != pairs[char]", "stack[-1] != match[char]"],
      explain: "You need to check that the top of the stack is the opener that actually matches this closing character - not just that the stack is non-empty."
    }),
    successCriteria: "Fills in a top-of-stack match check",
    nextAction: "retry_same"
  },

  // ---------- bfs ----------
  {
    id: "bfs-recognition",
    techniqueId: "bfs",
    failureType: "recognition_gap",
    title: "BFS or DFS?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Find the shortest path from the start node to the target in an unweighted graph.\"",
      prompt: "Which approach fits?",
      options: ["BFS", "DFS"],
      correctIndex: 0,
      correctExplain: "Right - BFS explores level by level, so the first time it reaches the target is guaranteed to be via the shortest path (unweighted graph).",
      incorrectExplain: "DFS dives deep down one path first, so it can't guarantee the shortest path. \"Shortest path, unweighted\" is the BFS signal."
    }),
    successCriteria: "Selects BFS",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "bfs-concept",
    techniqueId: "bfs",
    failureType: "concept_gap",
    title: "Why level by level?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "Why does exploring level by level guarantee the shortest path in an unweighted graph?",
      sampleGoodAnswer: "Every node at distance k gets visited before any node at distance k+1, so the first time you reach the target, it must be by the fewest possible steps."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "bfs-reasoning",
    techniqueId: "bfs",
    failureType: "reasoning_gap",
    title: "What must remain true?",
    instruction: "This is the core invariant.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "core",
    payload: choice({
      prompt: "What must remain true after each BFS node is processed?",
      options: [
        "Every neighbor that gets added to the queue is marked visited at that moment",
        "Every neighbor gets added to the queue regardless of whether it was visited"
      ],
      correctIndex: 0,
      correctExplain: "Right - marking visited at enqueue time (not dequeue time) is what prevents the same node from being added to the queue multiple times.",
      incorrectExplain: "If you don't mark a node visited the moment you enqueue it, it can get added to the queue multiple times from different neighbors before it's ever processed."
    }),
    successCriteria: "Selects the 'marked visited at enqueue time' option",
    nextAction: "retry_same"
  },
  {
    id: "bfs-implementation",
    techniqueId: "bfs",
    failureType: "implementation_gap",
    title: "Write only the queue init and visited update",
    instruction: "Just these two pieces - not the whole function.",
    estimatedMinutes: 3,
    interactionType: "micro_implementation",
    difficulty: "core",
    payload: blank({
      template: "queue = ______\nvisited = ______",
      prompt: "Fill in both blanks (in order, comma-separated) to initialize the queue with the start node and the visited set.",
      acceptableAnswers: ["deque([start]), {start}", "deque([start]),{start}"],
      explain: "The queue starts holding just the start node, and visited should already include the start node too - otherwise it could be re-added later."
    }),
    successCriteria: "Initializes queue with start and visited with {start}",
    nextAction: "retry_same"
  },

  // ---------- dfs-backtracking ----------
  {
    id: "dfs-recognition",
    techniqueId: "dfs-backtracking",
    failureType: "recognition_gap",
    title: "DFS/Backtracking or BFS?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Generate all valid combinations of parentheses of length n.\"",
      prompt: "Which approach fits?",
      options: ["DFS / Backtracking", "BFS"],
      correctIndex: 0,
      correctExplain: "Right - you need to explore every possible combination by building one choice at a time and undoing it to try the next - that's backtracking.",
      incorrectExplain: "BFS is for shortest-path or level-order needs. Generating ALL combinations by trying and undoing choices is the backtracking signal."
    }),
    successCriteria: "Selects DFS / Backtracking",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "dfs-concept",
    techniqueId: "dfs-backtracking",
    failureType: "concept_gap",
    title: "Why undo the choice?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "Why is it necessary to undo a choice (like popping from the current path) after exploring it?",
      sampleGoodAnswer: "Without undoing it, the next branch you try would start from a path that still includes a choice it shouldn't have, contaminating every subsequent branch."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "dfs-reasoning",
    techniqueId: "dfs-backtracking",
    failureType: "reasoning_gap",
    title: "What order do the steps happen in?",
    instruction: "Put these in the correct order.",
    estimatedMinutes: 2,
    interactionType: "order_steps",
    difficulty: "core",
    payload: order({
      prompt: "Order the steps of one backtracking branch correctly:",
      steps: ["Make a choice", "Recurse into the next state", "Undo the choice", "Check the base case"],
      correctOrder: [3, 0, 1, 2],
      explain: "Check the base case first (are we done?), then make a choice, recurse deeper with it, and undo it once that branch is fully explored."
    }),
    successCriteria: "Orders as: base case check, make choice, recurse, undo",
    nextAction: "retry_same"
  },
  {
    id: "dfs-implementation",
    techniqueId: "dfs-backtracking",
    failureType: "implementation_gap",
    title: "Fill in the missing undo",
    instruction: "Only the undo step is missing.",
    estimatedMinutes: 3,
    interactionType: "fill_blank",
    difficulty: "core",
    payload: blank({
      template: "def dfs(path, remaining):\n    if not remaining:\n        results.append(path[:])\n        return\n    for choice in remaining:\n        path.append(choice)\n        dfs(path, remaining - {choice})\n        ______",
      prompt: "What goes in the blank?",
      acceptableAnswers: ["path.pop()"],
      explain: "After exploring with this choice included, remove it from the path before the loop tries the next choice."
    }),
    successCriteria: "Fills in path.pop()",
    nextAction: "retry_same"
  },

  // ---------- intervals ----------
  {
    id: "iv-recognition",
    techniqueId: "intervals",
    failureType: "recognition_gap",
    title: "Intervals or Sliding Window?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Given a list of meeting time ranges, merge all overlapping ones.\"",
      prompt: "Which approach fits?",
      options: ["Sort intervals and scan", "Sliding Window over an array of numbers"],
      correctIndex: 0,
      correctExplain: "Right - this is about ranges that overlap and merge, not a contiguous run inside a single array of values. Sort by start, then scan.",
      incorrectExplain: "Sliding Window works over a sequence of elements. This problem is about a SET of ranges that overlap each other - sort and scan the intervals instead."
    }),
    successCriteria: "Selects 'Sort intervals and scan'",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "iv-concept",
    techniqueId: "intervals",
    failureType: "concept_gap",
    title: "Why sort first?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "Why does sorting intervals by start time make the merge scan possible in one pass?",
      sampleGoodAnswer: "Once sorted, any interval that could overlap the current one must come right after it - you only ever need to compare against the most recent interval, not all previous ones."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "iv-reasoning",
    techniqueId: "intervals",
    failureType: "reasoning_gap",
    title: "Overlap or not?",
    instruction: "Trace this exact state.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "core",
    payload: choice({
      context: "Current merged interval: [1, 5]. Next interval: [4, 8].",
      prompt: "Do these overlap?",
      options: ["Yes, merge into [1, 8]", "No, keep them separate"],
      correctIndex: 0,
      correctExplain: "Right - the next interval's start (4) is <= the current interval's end (5), so they overlap and should merge into [1, 8].",
      incorrectExplain: "Check the rule: they overlap when the next interval's start is <= the current interval's end. 4 <= 5, so they overlap."
    }),
    successCriteria: "Selects 'Yes, merge'",
    nextAction: "retry_same"
  },

  // ---------- heap ----------
  {
    id: "hp-recognition",
    techniqueId: "heap",
    failureType: "recognition_gap",
    title: "Heap or full sort?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Find the k largest elements as new elements keep streaming in.\"",
      prompt: "Which approach fits best?",
      options: ["Heap of size k", "Sort the whole array every time"],
      correctIndex: 0,
      correctExplain: "Right - you only ever need the extreme few, and elements keep arriving. A heap keeps that in O(log k) per update instead of re-sorting everything.",
      incorrectExplain: "Re-sorting on every new element is wasteful when you only need the top k. A heap of size k is built exactly for this case."
    }),
    successCriteria: "Selects 'Heap of size k'",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "hp-concept",
    techniqueId: "heap",
    failureType: "concept_gap",
    title: "What does the heap actually guarantee?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "If you only need the top k items, why is it enough to keep a heap of size k instead of sorting everything?",
      sampleGoodAnswer: "The heap only guarantees the top is correct - by popping the worst item whenever the heap grows past size k, you keep exactly the best k items without ever fully sorting the rest."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "hp-implementation",
    techniqueId: "heap",
    failureType: "implementation_gap",
    title: "Fill in the missing pop condition",
    instruction: "Only the size check is missing.",
    estimatedMinutes: 3,
    interactionType: "fill_blank",
    difficulty: "core",
    payload: blank({
      template: "for item in items:\n    heappush(heap, item)\n    if ______:\n        heappop(heap)",
      prompt: "What goes in the blank?",
      acceptableAnswers: ["len(heap) > k"],
      explain: "Once the heap grows past the k you want to keep, pop the worst item to keep it at exactly size k."
    }),
    successCriteria: "Fills in len(heap) > k",
    nextAction: "retry_same"
  },

  // ---------- dynamic-programming ----------
  {
    id: "dp-recognition",
    techniqueId: "dynamic-programming",
    failureType: "recognition_gap",
    title: "DP or Greedy?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Find the minimum number of coins to make a given amount, coins can repeat.\"",
      prompt: "Which approach fits?",
      options: ["Dynamic Programming", "Greedy (always pick the largest coin that fits)"],
      correctIndex: 0,
      correctExplain: "Right - with arbitrary coin denominations, the greedy largest-first choice isn't always optimal, so you need to consider all sub-amounts. That's DP.",
      incorrectExplain: "Greedy only works here for specific coin systems (like US currency). In general, always taking the largest coin can be provably wrong - that's the DP signal."
    }),
    successCriteria: "Selects Dynamic Programming",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "dp-concept",
    techniqueId: "dynamic-programming",
    failureType: "concept_gap",
    title: "What does dp[i] mean?",
    instruction: "Say the definition in one sentence before anything else.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "For a min-coins-to-make-amount problem, what should dp[i] mean, in one sentence?",
      sampleGoodAnswer: "dp[i] is the minimum number of coins needed to make exactly the amount i, using the available denominations."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  },
  {
    id: "dp-reasoning",
    techniqueId: "dynamic-programming",
    failureType: "reasoning_gap",
    title: "What's the recurrence built from?",
    instruction: "Trace this exact state.",
    estimatedMinutes: 2,
    interactionType: "trace_state",
    difficulty: "core",
    payload: choice({
      context: "Coins = [1, 3, 4], trying to compute dp[6]",
      prompt: "How should dp[6] be computed?",
      options: [
        "min(dp[6-1], dp[6-3], dp[6-4]) + 1, over each coin that fits",
        "dp[6] = dp[5] + 1, always using the largest coin"
      ],
      correctIndex: 0,
      correctExplain: "Right - dp[6] should consider EVERY coin that could have been used last, and take the best (minimum) result among them, plus one for that coin.",
      incorrectExplain: "You can't assume which coin was used last - dp[6] has to check every coin denomination that fits and take the minimum result, not just one fixed choice."
    }),
    successCriteria: "Selects the min-over-all-coins option",
    nextAction: "retry_same"
  },

  // ---------- greedy ----------
  {
    id: "gr-recognition",
    techniqueId: "greedy",
    failureType: "recognition_gap",
    title: "Greedy or DP?",
    instruction: "Pick the technique, then say one short reason.",
    estimatedMinutes: 1,
    interactionType: "binary_choice",
    difficulty: "intro",
    payload: choice({
      context: "\"Given meeting intervals, select the maximum number of non-overlapping meetings.\"",
      prompt: "Which approach fits?",
      options: ["Greedy (sort by end time, always take the earliest-ending option that fits)", "Dynamic Programming over all subsets"],
      correctIndex: 0,
      correctExplain: "Right - always taking the meeting that ends earliest never eliminates a better future option, which is exactly what makes a greedy choice provably safe here.",
      incorrectExplain: "This specific problem has a provably-safe greedy rule (earliest end time first) - reaching for full DP here is more machinery than the problem needs."
    }),
    successCriteria: "Selects the greedy option",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "gr-concept",
    techniqueId: "greedy",
    failureType: "concept_gap",
    title: "Why is the greedy choice safe here?",
    instruction: "Answer in one sentence.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "Why does always picking the meeting that ends earliest never make the final answer worse?",
      sampleGoodAnswer: "Picking the earliest-ending option leaves the most room for future meetings - any other valid choice would end at least as late, so it can never open up more options than the earliest one does."
    }),
    successCriteria: "Learner self-reports their answer matched the sample",
    nextAction: "retry_same"
  }
];

// Generic, technique-agnostic entries so every failure type has at least a
// usable fallback drill even for techniques without hand-authored content.
const GENERIC: RemediationActivity[] = [
  {
    id: "generic-recognition",
    techniqueId: "generic",
    failureType: "recognition_gap",
    title: "Name one clue",
    instruction: "Before trying again, be specific about the signal.",
    estimatedMinutes: 1,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "What's one specific word or phrase in the prompt that points to this technique - and what's one word that could have pointed somewhere else?",
      sampleGoodAnswer: "A good answer names a concrete phrase from the prompt for both sides, not just a general feeling of \"it seemed like this pattern.\""
    }),
    successCriteria: "Learner names a specific clue",
    nextAction: "fresh_recognition_prompt"
  },
  {
    id: "generic-concept",
    techniqueId: "generic",
    failureType: "concept_gap",
    title: "Explain the core idea",
    instruction: "One or two sentences, in your own words.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "In your own words, what is this technique actually doing, and why does it work?",
      sampleGoodAnswer: "A good answer describes the mechanism (what state is tracked, what invariant is kept) rather than just naming the technique."
    }),
    successCriteria: "Learner explains the mechanism, not just the name",
    nextAction: "retry_same"
  },
  {
    id: "generic-reasoning",
    techniqueId: "generic",
    failureType: "reasoning_gap",
    title: "Name the rule that decides your next move",
    instruction: "Focus on the decision rule, not the code.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "core",
    payload: free({
      prompt: "At the trickiest step of this approach, what single rule decides what to do next?",
      sampleGoodAnswer: "A good answer states a concrete condition (e.g. \"if X then do Y\") rather than a vague description of the overall approach."
    }),
    successCriteria: "Learner states a concrete decision rule",
    nextAction: "retry_same"
  },
  {
    id: "generic-transition",
    techniqueId: "generic",
    failureType: "transition_gap",
    title: "What updates, and when?",
    instruction: "Focus only on the state change, not the whole algorithm.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "core",
    payload: free({
      prompt: "At the step where your code went wrong, what piece of state should have updated, and in what order relative to everything else?",
      sampleGoodAnswer: "A good answer names the specific variable and says exactly when it updates relative to the check that triggers it."
    }),
    successCriteria: "Learner names the specific state update and its timing",
    nextAction: "retry_same"
  },
  {
    id: "generic-implementation",
    techniqueId: "generic",
    failureType: "implementation_gap",
    title: "Write just the one missing piece",
    instruction: "Not the whole function - just the part that's unclear.",
    estimatedMinutes: 3,
    interactionType: "explain_briefly",
    difficulty: "core",
    payload: free({
      prompt: "Which single line of your code were you least sure about? Write what you think it should be now.",
      sampleGoodAnswer: "A good answer identifies one specific line and proposes a concrete fix, not a general \"I'll be more careful.\""
    }),
    successCriteria: "Learner identifies and proposes a fix for one specific line",
    nextAction: "retry_same"
  },
  {
    id: "generic-edge-case",
    techniqueId: "generic",
    failureType: "edge_case_gap",
    title: "Check the boundaries",
    instruction: "Two quick questions about edge cases.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "What happens in your solution if the input is empty, or has only one element? Would your code still give the right answer?",
      sampleGoodAnswer: "A good answer walks through the empty/single-element case by hand and states whether the current code handles it."
    }),
    successCriteria: "Learner walks through at least one boundary case",
    nextAction: "retry_same"
  },
  {
    id: "generic-recall",
    techniqueId: "generic",
    failureType: "recall_gap",
    title: "Cold reconstruction",
    instruction: "Without looking anything up.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "core",
    payload: free({
      prompt: "Without checking notes: what's the first step, and what's the one rule that matters most for this technique?",
      sampleGoodAnswer: "A good answer names a concrete first step and a specific rule, reconstructed from memory rather than re-reading the lesson."
    }),
    successCriteria: "Learner reconstructs the first step and core rule from memory",
    nextAction: "fresh_problem"
  },
  {
    id: "generic-mixed",
    techniqueId: "generic",
    failureType: "mixed",
    title: "Start from what you're sure of",
    instruction: "Broad unfamiliarity - rebuild from the one thing you do know.",
    estimatedMinutes: 2,
    interactionType: "explain_briefly",
    difficulty: "intro",
    payload: free({
      prompt: "What's the one thing about this problem you ARE confident about, even if the rest is unclear?",
      sampleGoodAnswer: "A good answer names a specific, even small, point of confidence to build the retry from."
    }),
    successCriteria: "Learner names a specific point of confidence",
    nextAction: "retry_same"
  }
];

const ALL_ACTIVITIES = [...CATALOG, ...GENERIC];

export function getRemediationById(id: string): RemediationActivity | null {
  return ALL_ACTIVITIES.find((activity) => activity.id === id) ?? null;
}

export function pickRemediation(
  techniqueId: TechniqueId | null,
  failureType: FailureCategory
): RemediationActivity | null {
  // "insufficient_evidence" gets no remediation drill - there isn't enough
  // signal to target one, so the caller should fall back to a plain guided
  // retry instead of guessing at an exercise.
  if (failureType === "insufficient_evidence") return null;

  const exact = techniqueId ? ALL_ACTIVITIES.find((a) => a.techniqueId === techniqueId && a.failureType === failureType) : undefined;
  if (exact) return exact;

  return ALL_ACTIVITIES.find((a) => a.techniqueId === "generic" && a.failureType === failureType) ?? null;
}
