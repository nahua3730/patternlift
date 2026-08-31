import type { LearnResource } from "@/lib/study-plan";

// Pilot Foundation: a hand-authored, static definition of the real 35-day
// 代码随想录 (Carl) pilot schedule (8/31-10/4), covering: Arrays, Linked
// List, Hash Table, "String" (see note below), Stack & Queue, Binary Tree,
// Backtracking, Greedy, plus every Review/checkpoint day Carl's own plan
// calls for. DP is deliberately NOT included in this cut - it comes after
// the checkpoint and was not concretely defined at the time this was
// written.
//
// PROBLEM MAPPING POLICY (do not weaken without re-reading this):
// every problemId below is a REAL, currently-existing entry in
// lib/product.ts's catalog, verified by loading allProblems directly and
// reading back its id/category/targetPatternId - never guessed or
// fuzzy-matched against Carl's own specific LeetCode numbers, which this
// codebase has no authoritative source for. Where PatternLift's catalog
// has no real problem for a Carl topic, that slot is left unmapped
// (Learn-resource-only, no practiceProblemIds) rather than inventing one.
// See the mapping audit delivered alongside this file for the exact
// per-topic coverage and every gap.
//
// TOPIC vs PATTERN, by design: a problem's patternId here is its
// authoritative PatternLift catalog pattern, which can legitimately differ
// from the day's own Carl topic label (e.g. a "Linked List" day's anchor
// problem is tagged "two-pointers"; a "Greedy" day includes
// official-maximum-subarray, tagged "dynamic-programming"). That is
// correct, not a bug - see lib/guided-curriculum.ts and
// components/session-runner.tsx's LearnStep for how topic vs pattern are
// kept visually distinct.
//
// Resource URLs are illustrative placeholders pointing at Carl's site
// (programmercarl.com) by topic slug - replace with the exact lesson URLs
// before real pilot use.
function carlResource(title: string, path: string): LearnResource {
  return { title, url: `https://programmercarl.com/${path}`, provider: "代码随想录 (Carl)" };
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
  // Every OTHER problem for the day. Each one's patternId is derived
  // independently from the catalog by the adapter - never inherited from
  // topicLabel, and not required to share a single pattern even within
  // one day.
  practiceProblemIds?: string[];
};

export const carlPilotDays: CarlDayDef[] = [
  // ===== Arrays (8/31-9/1, Carl "数组 1-5") =====
  // Carl's actual 27/977 (Remove Element, Squares of a Sorted Array) have
  // no catalog match - substituted with real two-pointers/binary-search
  // array problems instead. See mapping audit.
  {
    dayNumber: 1,
    topicLabel: "Arrays",
    learnResource: carlResource("数组理论基础 - Array Fundamentals", "0501kSecTM"),
    learnAnchorProblemId: "binary-search",
    practiceProblemIds: ["three-sum"]
  },
  {
    dayNumber: 2,
    topicLabel: "Arrays",
    learnResource: carlResource("双指针法 - Two-Pointer Technique", "0501kSecTM"),
    practiceProblemIds: ["container-most-water", "valid-palindrome", "official-two-sum-ii-input-array-is-sorted"]
  },

  // ===== Linked List (9/2-9/3, Carl "链表 1-6") =====
  {
    dayNumber: 3,
    topicLabel: "Linked List",
    learnResource: carlResource("链表理论基础 - Linked List Fundamentals", "0502kSecTM"),
    learnAnchorProblemId: "reverse-linked-list",
    practiceProblemIds: ["linked-list-cycle", "merge-two-sorted-lists"]
  },
  {
    dayNumber: 4,
    topicLabel: "Linked List",
    learnResource: carlResource("链表经典题 - Linked List Classics", "0502kSecTM"),
    practiceProblemIds: ["remove-nth-from-end", "add-two-numbers", "official-reorder-list"]
  },

  // ===== Review (9/4) =====
  { dayNumber: 5, topicLabel: "Review", isReviewDay: true },

  // ===== Hash Table (9/5-9/6, Carl "哈希表 1-6") =====
  {
    dayNumber: 6,
    topicLabel: "Hash Table",
    learnResource: carlResource("哈希表理论基础 - Hash Table Fundamentals", "0503kSecTM"),
    learnAnchorProblemId: "two-sum",
    practiceProblemIds: ["contains-duplicate", "valid-anagram"]
  },
  {
    dayNumber: 7,
    topicLabel: "Hash Table",
    learnResource: carlResource("哈希表经典题 - Hash Table Classics", "0503kSecTM"),
    practiceProblemIds: ["longest-consecutive", "official-group-anagrams", "official-encode-and-decode-strings"]
  },

  // ===== "String" (9/7-9/8, Carl "字符串 1-6") =====
  // No dedicated String category/pattern exists in this catalog at all
  // (confirmed - see mapping audit). Substituted with real
  // string-manipulation problems from the Sliding Window category, which
  // is the closest genuine catalog match - still real problems, real
  // patterns, just fewer than Carl's 6 and pattern-tagged
  // "sliding-window" rather than any string-specific pattern.
  {
    dayNumber: 8,
    topicLabel: "String",
    learnResource: carlResource("字符串基础 - String Fundamentals", "0503kSecTM"),
    learnAnchorProblemId: "longest-substring-no-repeat",
    practiceProblemIds: ["official-permutation-in-string"]
  },
  {
    dayNumber: 9,
    topicLabel: "String",
    learnResource: carlResource("字符串经典题 - String Classics", "0503kSecTM"),
    practiceProblemIds: ["minimum-window-substring", "official-longest-repeating-character-replacement"]
  },

  // ===== Review (9/9) =====
  { dayNumber: 10, topicLabel: "Review", isReviewDay: true },

  // ===== Stack & Queue (9/10-9/11, Carl "栈与队列 1-7") =====
  // No dedicated Queue category/pattern exists either (queue is not a
  // PatternLift patternId at all) - all 6 real catalog Stack problems are
  // used; there is no 7th. See mapping audit.
  {
    dayNumber: 11,
    topicLabel: "Stack & Queue",
    learnResource: carlResource("栈与队列理论基础 - Stack & Queue Fundamentals", "0504kSecTM"),
    learnAnchorProblemId: "valid-parentheses",
    practiceProblemIds: ["official-min-stack", "daily-temperatures"]
  },
  {
    dayNumber: 12,
    topicLabel: "Stack & Queue",
    learnResource: carlResource("栈与队列经典题 - Stack & Queue Classics", "0504kSecTM"),
    practiceProblemIds: ["car-fleet", "official-evaluate-reverse-polish-notation", "official-largest-rectangle-in-histogram"]
  },

  // ===== Binary Tree (9/12-9/20, Carl "二叉树 1-29" + review) =====
  // 15 of ~29 Carl binary-tree problems have a real catalog match (every
  // Trees-category problem this catalog has, all 15 used). The remaining
  // ~14 are not represented. See mapping audit.
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
  // 10 of ~16 Carl backtracking problems have a real catalog match (every
  // Backtracking-category problem this catalog has, all 10 used). See
  // mapping audit.
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
  // 9 of ~15 Carl greedy problems have a real catalog match (every
  // Greedy-category problem this catalog has, all 9 used - two of these,
  // official-maximum-subarray and official-valid-parenthesis-string, are
  // catalog-tagged "dynamic-programming"/"stack" rather than "greedy",
  // exactly the topic-vs-pattern case this pilot polish pass exists to
  // handle correctly). See mapping audit.
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
