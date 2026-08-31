import type { ExternalProblem, LearnResource } from "@/lib/study-plan";

// Pilot Foundation / Carl Fidelity Pass: a hand-authored, static
// definition of the real 35-day 代码随想录 (Carl) pilot schedule
// (8/31-10/4).
//
// FIDELITY STATUS (as of the Batch 1 pass):
//
// Days 1-12 (Arrays, Linked List, Hash Table, String, Stack & Queue) are
// FIDELITY-CORRECTED: every problem is Carl's own real, canonical
// assignment (verified against programmercarl.com/qita/12.list.html, his
// curated training-camp list - not just the topic landing pages, which
// were found to be an incomplete proxy for it). No PatternLift substitute
// problems remain in these days. Where a problem cannot be executed
// natively yet, it is an explicit ExternalProblem (opens on LeetCode/
// Kamacoder, completed via Mark Complete), never a stand-in problem
// masquerading as Carl's assignment.
//
// Days 13-35 (Binary Tree, Backtracking, Greedy, and all Review days) are
// UNCHANGED from the Pilot Polish pass - still using PatternLift-catalog
// substitute problems where Carl's own exact problem isn't native, and
// still using placeholder (non-resolving) resource URLs. This is
// deliberate, not an oversight: the Fidelity Audit found Carl's own
// Binary Tree count is itself ambiguous (25-39 depending on source/
// counting method, against a handwritten "1-29" that doesn't cleanly
// match any of those), so expanding it now risks fabricating a false
// "Carl official 29" the same way the pre-audit substitutes did. Batch 2
// picks this up once that ambiguity is resolved (or explicitly accepted
// as a pacing choice) rather than guessed past.
//
// PROBLEM MAPPING POLICY for Days 1-12 (do not weaken without re-reading
// this): every native problemId below has a verified lib/problem-code.ts
// entry - a correct reference solution was run against every example and
// passed, a deliberately wrong solution was run and failed at least one,
// via runJavaScriptCode directly, before this file was written. See the
// Batch 1 fidelity report for the full transcript. An ExternalProblem
// below is either (a) a problem PatternLift's current single-function-call
// test harness cannot faithfully grade (a stateful multi-method "Design X"
// class, or a cyclic return value that breaks JSON-based comparison), or
// (b) a genuinely non-LeetCode Kamacoder problem.
//
// SOURCE-OF-TRUTH POLICY (Batch 1.1): when Carl's own curated 题单
// (qita/12.list.html) disagrees with the CURRENT LIVE
// programmercarl.com/algo/{topic}/ learning route, the live route wins -
// a learner clicking "Watch lesson" must land on the lesson that actually
// matches today's task. This resolved a real conflict on two String days
// (题单 said 剑指Offer 05/58-II; the live route has two different
// Kamacoder problems in those slots) and dropped one Linked List item
// (LC24, present in the 题单 but absent from the live route entirely).
//
// PATTERN-ATTRIBUTION POLICY (Batch 1.1): a problem is only natively
// scheduled here if it has an HONEST patternOptions fit - never a
// "closest available" pattern chosen merely to satisfy
// AppProblem.targetPatternId being a required field. PracticeWorkspace
// resolves a problem's pattern via a non-null assertion
// (patternOptions.find(...)!) - an ill-fitting or absent pattern doesn't
// just produce mislabeled mastery evidence, it's the same field that
// would need to exist for the session to load at all, so there is no
// "attribute it loosely but flag it" middle ground. LC59 (Spiral Matrix
// II) was dropped from Day 2 for exactly this reason - see the Batch 1.1
// report.
function carlResource(title: string, path: string): LearnResource {
  return { title, url: `https://programmercarl.com/${path}`, provider: "代码随想录 (Carl)" };
}
// Confirmed live against programmercarl.com's own per-topic learning-path
// pages during the audit - this is the real URL pattern the site uses.
function carlLesson(title: string, topicSlug: string, path: string): LearnResource {
  return { title, url: `https://programmercarl.com/algo/${topicSlug}/${path}`, provider: "代码随想录 (Carl)" };
}
function leetcode(title: string, slug: string): ExternalProblem {
  return { title, url: `https://leetcode.com/problems/${slug}/`, source: "leetcode" };
}
// Kamacoder problems don't have a verified direct judge-page URL here -
// this points at Carl's own lesson page for the problem (verified live),
// which states the problem and links out to Kamacoder itself, rather
// than a guessed kamacoder.com URL.
function kamacoderViaCarlLesson(title: string, topicSlug: string, path: string): ExternalProblem {
  return { title, url: `https://programmercarl.com/algo/${topicSlug}/${path}`, source: "kamacoder" };
}

export type CarlDayDef = {
  dayNumber: number;
  topicLabel: string;
  isReviewDay?: boolean;
  learnResource?: LearnResource;
  // A problem the Learn resource itself walks through, if any - becomes
  // the Learn task's anchor guided_problem. Left undefined when a lesson
  // is a broad overview with no single matching problem (its Learn task
  // then produces no mastery-pattern evidence at all - see the adapter).
  learnAnchorProblemId?: string;
  // Every OTHER native problem for the day. Each one's patternId is
  // derived independently from the catalog by the adapter - never
  // inherited from topicLabel, and not required to share a single pattern
  // even within one day.
  practiceProblemIds?: string[];
  // Carl Fidelity Pass: curriculum-required problems PatternLift cannot
  // execute natively - see the module comment above for exactly why each
  // one here qualifies (never used merely because a problem hasn't been
  // added yet if it COULD be).
  externalProblems?: ExternalProblem[];
};

export const carlPilotDays: CarlDayDef[] = [
  // ===== Arrays (8/31-9/1, Carl 数组: 704/27/977/209/59) =====
  {
    dayNumber: 1,
    topicLabel: "Arrays",
    learnResource: carlLesson("数组理论基础 - Array Fundamentals", "array", "array-basics.html"),
    learnAnchorProblemId: "binary-search",
    practiceProblemIds: ["official-remove-element", "official-squares-of-a-sorted-array"]
  },
  {
    dayNumber: 2,
    topicLabel: "Arrays",
    learnResource: carlLesson("长度最小的子数组 - Minimum Size Subarray Sum", "array", "0209-minimum-size-subarray-sum.html"),
    // 59 Spiral Matrix II is deliberately NOT scheduled here. It IS a real,
    // tested native problem (lib/product.ts "official-spiral-matrix-ii" -
    // kept, unused, for a future pass), but PracticeWorkspace requires
    // AppProblem.targetPatternId to resolve to a real patternOptions entry
    // (a non-null assertion crashes otherwise) - Spiral Matrix II has no
    // honest pattern fit (see the Batch 1.1 fidelity report), and
    // "two-pointers" was a forced closest-fit, not a real one. Fewer
    // honest curriculum items beats one with fabricated mastery evidence.
    practiceProblemIds: ["shortest-subarray-target"]
  },

  // ===== Linked List (9/2-9/3, Carl 链表: 203/707/206/19/面试题02.07/142) =====
  {
    dayNumber: 3,
    topicLabel: "Linked List",
    learnResource: carlLesson("链表理论基础 - Linked List Fundamentals", "linked-list", "linked-list-basics.html"),
    learnAnchorProblemId: "official-remove-linked-list-elements",
    practiceProblemIds: ["reverse-linked-list"],
    // 707 Design LinkedList: a stateful multi-method class (addAtHead,
    // addAtTail, get, deleteAtIndex...) - PatternLift's runtime only
    // grades a single function call per example, so this cannot be
    // faithfully graded yet. Genuinely EXTERNAL_REQUIRED, not a coverage
    // gap.
    externalProblems: [leetcode("Design Linked List", "design-linked-list")]
  },
  {
    dayNumber: 4,
    topicLabel: "Linked List",
    learnResource: carlLesson("链表相交 - Intersection of Two Linked Lists", "linked-list", "interview-02-07-linked-list-intersection.html"),
    learnAnchorProblemId: "remove-nth-from-end",
    // 24 Swap Nodes in Pairs is deliberately NOT scheduled here. It IS a
    // real, tested native problem (lib/product.ts
    // "official-swap-nodes-in-pairs" - kept, unused, for a future pass),
    // but the Batch 1.1 source-of-truth check found it is NOT part of the
    // CURRENT live programmercarl.com/algo/linked-list/ learning route
    // (only in an older curated list) - per the "current live route wins"
    // policy, it does not belong in this day.
    practiceProblemIds: ["official-intersection-of-two-linked-lists"],
    // 142 Linked List Cycle II: the correct return value is a node inside
    // a CYCLIC list. The runtime's comparison is JSON.stringify-based,
    // which throws on circular structures - not gradable without a
    // materially different comparison mechanism. EXTERNAL_REQUIRED.
    externalProblems: [leetcode("Linked List Cycle II", "linked-list-cycle-ii")]
  },

  // ===== Review (9/4) =====
  { dayNumber: 5, topicLabel: "Review", isReviewDay: true },

  // ===== Hash Table (9/5-9/6, Carl 哈希表: 242/349/202/1/454/383/15/18) =====
  {
    dayNumber: 6,
    topicLabel: "Hash Table",
    learnResource: carlLesson("哈希表理论基础 - Hash Table Fundamentals", "hash-table", "hash-table-basics.html"),
    learnAnchorProblemId: "valid-anagram",
    practiceProblemIds: ["official-intersection-of-two-arrays", "official-happy-number", "two-sum"]
  },
  {
    dayNumber: 7,
    topicLabel: "Hash Table",
    learnResource: carlLesson("四数相加II - 4Sum II", "hash-table", "0454-4sum-ii.html"),
    practiceProblemIds: ["official-4sum-ii", "official-ransom-note", "three-sum", "official-4sum"]
  },

  // ===== String (9/7-9/8, Carl 字符串) =====
  // Batch 1.1 source-of-truth resolution: the original 题单 (curated list)
  // said 剑指Offer 05/58-II here; the CURRENT LIVE
  // programmercarl.com/algo/string/ route instead has two Kamacoder
  // problems ("替换数字"/"右旋字符串") in those exact slots. Per the
  // "current live route wins" policy, these two are now External
  // (Kamacoder, via Carl's own verified lesson page) rather than the
  // native 剑指Offer substitutes - lib/product.ts's
  // "official-replace-space"/"official-left-rotate-string" entries are
  // kept, unused, real LCOF problems for a possible future pass, not
  // deleted.
  {
    dayNumber: 8,
    topicLabel: "String",
    learnResource: carlLesson("反转字符串 - Reverse String", "string", "0344-reverse-string.html"),
    learnAnchorProblemId: "official-reverse-string",
    practiceProblemIds: ["official-reverse-string-ii"],
    externalProblems: [kamacoderViaCarlLesson("替换数字 - Replace Digits", "string", "kamacoder-0054-replace-digits.html")]
  },
  {
    dayNumber: 9,
    topicLabel: "String",
    learnResource: carlLesson("翻转字符串里的单词 - Reverse Words in a String", "string", "0151-reverse-words-in-a-string.html"),
    practiceProblemIds: [
      "official-reverse-words-in-a-string",
      "official-str-str",
      "official-repeated-substring-pattern"
    ],
    externalProblems: [kamacoderViaCarlLesson("右旋字符串 - Right Rotate String", "string", "kamacoder-0055-right-rotate-string.html")]
  },

  // ===== Review (9/9) =====
  { dayNumber: 10, topicLabel: "Review", isReviewDay: true },

  // ===== Stack & Queue (9/10-9/11, Carl 栈与队列: 232/225/20/1047/150/239/347) =====
  {
    dayNumber: 11,
    topicLabel: "Stack & Queue",
    learnResource: carlLesson("栈与队列理论基础 - Stack & Queue Fundamentals", "stack-queue", "stack-and-queue-basics.html"),
    learnAnchorProblemId: "valid-parentheses",
    practiceProblemIds: ["official-remove-all-adjacent-duplicates-in-string"],
    // 232/225 (Implement Queue using Stacks / Implement Stack using
    // Queues): same structural limitation as 707 - stateful multi-method
    // class design, not gradable by a single-function-call harness.
    // EXTERNAL_REQUIRED.
    externalProblems: [
      leetcode("Implement Queue using Stacks", "implement-queue-using-stacks"),
      leetcode("Implement Stack using Queues", "implement-stack-using-queues")
    ]
  },
  {
    dayNumber: 12,
    topicLabel: "Stack & Queue",
    learnResource: carlLesson("逆波兰表达式求值 - Evaluate Reverse Polish Notation", "stack-queue", "0150-evaluate-reverse-polish-notation.html"),
    practiceProblemIds: [
      "official-evaluate-reverse-polish-notation",
      "official-sliding-window-maximum",
      "top-k-frequent-elements"
    ]
  },

  // ===================================================================
  // Days 13-35: UNCHANGED from the Pilot Polish pass. Binary Tree,
  // Backtracking, and Greedy still use PatternLift-catalog substitutes
  // where Carl's exact problem isn't native, and resource URLs below are
  // still non-resolving placeholders. See the module comment above -
  // this is Batch 2, deliberately deferred.
  // ===================================================================

  // ===== Binary Tree (9/12-9/20, Carl "二叉树 1-29" + review) =====
  {
    dayNumber: 13,
    topicLabel: "Binary Tree",
    learnResource: carlResource("二叉树理论基础 - Binary Tree Fundamentals", "0505kSecTM"),
    learnAnchorProblemId: "max-depth-tree",
    practiceProblemIds: ["same-tree"]
  },
  {
    dayNumber: 14,
    topicLabel: "Binary Tree",
    learnResource: carlResource("二叉树的遍历 - Tree Traversal", "0505kSecTM"),
    practiceProblemIds: ["official-invert-binary-tree", "binary-tree-level-order"]
  },
  {
    dayNumber: 15,
    topicLabel: "Binary Tree",
    learnResource: carlResource("二叉树的属性 - Tree Properties I", "0505kSecTM"),
    practiceProblemIds: ["official-diameter-of-binary-tree", "official-balanced-binary-tree"]
  },
  {
    dayNumber: 16,
    topicLabel: "Binary Tree",
    learnResource: carlResource("二叉树的属性 - Tree Properties II", "0505kSecTM"),
    practiceProblemIds: ["official-subtree-of-another-tree", "official-binary-tree-right-side-view"]
  },
  {
    dayNumber: 17,
    topicLabel: "Binary Tree",
    learnResource: carlResource("二叉搜索树 - Binary Search Trees", "0505kSecTM"),
    practiceProblemIds: ["official-count-good-nodes-in-binary-tree", "official-validate-binary-search-tree"]
  },
  {
    dayNumber: 18,
    topicLabel: "Binary Tree",
    learnResource: carlResource("二叉搜索树的属性 - BST Properties", "0505kSecTM"),
    practiceProblemIds: ["official-kth-smallest-element-in-a-bst", "official-lowest-common-ancestor-of-a-binary-search-tree"]
  },
  {
    dayNumber: 19,
    topicLabel: "Binary Tree",
    learnResource: carlResource("构造二叉树 - Constructing Trees", "0505kSecTM"),
    practiceProblemIds: ["official-construct-binary-tree-from-preorder-and-inorder-traversal"]
  },
  {
    dayNumber: 20,
    topicLabel: "Binary Tree",
    learnResource: carlResource("二叉树的序列化 - Serialization", "0505kSecTM"),
    practiceProblemIds: ["official-serialize-and-deserialize-binary-tree", "official-binary-tree-maximum-path-sum"]
  },
  { dayNumber: 21, topicLabel: "Review", isReviewDay: true },

  // ===== Backtracking (9/21-9/25, Carl "回溯算法 1-16") =====
  {
    dayNumber: 22,
    topicLabel: "Backtracking",
    learnResource: carlResource("回溯算法理论基础 - Backtracking Fundamentals", "0506kSecTM"),
    learnAnchorProblemId: "subsets",
    practiceProblemIds: ["official-subsets-ii"]
  },
  {
    dayNumber: 23,
    topicLabel: "Backtracking",
    learnResource: carlResource("组合总和 - Combination Sum", "0506kSecTM"),
    practiceProblemIds: ["combination-sum", "official-combination-sum-ii"]
  },
  {
    dayNumber: 24,
    topicLabel: "Backtracking",
    learnResource: carlResource("排列问题 - Permutations", "0506kSecTM"),
    practiceProblemIds: ["official-permutations", "official-n-queens"]
  },
  {
    dayNumber: 25,
    topicLabel: "Backtracking",
    learnResource: carlResource("棋盘问题 - Board Problems", "0506kSecTM"),
    practiceProblemIds: ["word-search", "official-palindrome-partitioning"]
  },
  {
    dayNumber: 26,
    topicLabel: "Backtracking",
    learnResource: carlResource("回溯算法收尾 - Backtracking Wrap-up", "0506kSecTM"),
    practiceProblemIds: ["official-generate-parentheses", "official-letter-combinations-of-a-phone-number"]
  },
  { dayNumber: 27, topicLabel: "Review", isReviewDay: true },

  // ===== Greedy (9/27-9/30, Carl "贪心算法 ~15") =====
  {
    dayNumber: 28,
    topicLabel: "Greedy",
    learnResource: carlResource("贪心算法理论基础 - Greedy Fundamentals", "0507kSecTM"),
    learnAnchorProblemId: "best-time-stock",
    practiceProblemIds: ["jump-game"]
  },
  {
    dayNumber: 29,
    topicLabel: "Greedy",
    learnResource: carlResource("贪心算法经典题 I - Greedy Classics I", "0507kSecTM"),
    practiceProblemIds: ["official-jump-game-ii", "official-gas-station"]
  },
  {
    dayNumber: 30,
    topicLabel: "Greedy",
    learnResource: carlResource("贪心算法经典题 II - Greedy Classics II", "0507kSecTM"),
    practiceProblemIds: ["merge-triplets", "official-partition-labels"]
  },
  {
    dayNumber: 31,
    topicLabel: "Greedy",
    learnResource: carlResource("贪心算法收尾 - Greedy Wrap-up", "0507kSecTM"),
    practiceProblemIds: ["official-hand-of-straights", "official-maximum-subarray", "official-valid-parenthesis-string"]
  },

  // ===== Review all / interview checkpoint (10/1-10/4) =====
  { dayNumber: 32, topicLabel: "Review", isReviewDay: true },
  { dayNumber: 33, topicLabel: "Review", isReviewDay: true },
  { dayNumber: 34, topicLabel: "Review", isReviewDay: true },
  { dayNumber: 35, topicLabel: "Review", isReviewDay: true }

  // DP follows afterward - deliberately not included in this cut.
];
