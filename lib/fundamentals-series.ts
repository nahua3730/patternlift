// A curated, sequential walkthrough that mirrors the "基础算法精讲" playlist
// (灵茶山艾府, Bilibili). We never reproduce or summarize the video content
// itself - each step just points at the matching problem already in the
// catalog (when one exists) plus a link back to the playlist so the learner
// can watch the explainer on their own before or after solving it here.
//
// technicalBrief is our own paraphrase of the presenter's own published
// written solution for that step's problem (linked from the video's own
// description) - not the video transcript, and not copied verbatim. It
// grounds the episode coach chat in the actual technique taught, instead of
// a generic description of the topic name.
export type FundamentalsEpisode = {
  episode: number;
  titleCn: string;
  titleEn: string;
  problemIds: string[];
  note?: string;
  bvid?: string;
  technicalBrief?: string;
  // Same technique family as the video, but not the exact problem it teaches -
  // kept separate from problemIds so the UI can be honest about the difference.
  relatedProblemIds?: string[];
};

export const fundamentalsSeriesUrl = "https://space.bilibili.com/206214/lists/842776?type=season";

export const fundamentalsSeries: FundamentalsEpisode[] = [
  {
    episode: 1,
    titleCn: "两数之和 三数之和",
    titleEn: "Two Sum II, 3Sum",
    problemIds: ["official-two-sum-ii-input-array-is-sorted", "three-sum"],
    bvid: "BV1bP411c7oJ",
    technicalBrief:
      "Opposite-direction two pointers on a sorted array: start one pointer at each end. If the pair sum is too big, move the right pointer left; if too small, move the left pointer right. Sortedness guarantees no valid pair is skipped. O(n) time, O(1) space."
  },
  {
    episode: 2,
    titleCn: "盛最多水的容器 接雨水",
    titleEn: "Container With Most Water, Trapping Rain Water",
    problemIds: ["container-most-water", "official-trapping-rain-water"],
    bvid: "BV1Qg411q7ia",
    technicalBrief:
      "Opposite-direction two pointers again: always move the pointer at the SHORTER wall inward, because that shorter wall caps the area of any pairing with it, so nothing to its other side can beat the current area with it as the limiting wall. O(n) time, O(1) space."
  },
  {
    episode: 3,
    titleCn: "滑动窗口",
    titleEn: "Sliding Window",
    problemIds: ["longest-substring-no-repeat"],
    bvid: "BV1hd4y1r7Gq",
    technicalBrief:
      "Variable-length sliding window with a hash map/set tracking characters currently inside the window. Expand the right edge each step; while there's a duplicate, shrink from the left until valid again, tracking the max window length seen. O(n) time since each pointer only moves forward."
  },
  {
    episode: 4,
    titleCn: "二分查找 红蓝染色法",
    titleEn: "Binary Search",
    problemIds: ["binary-search"],
    note: "The video's main worked example is Find First and Last Position of Element in Sorted Array (LC 34), not in the catalog yet - this step links the same red-blue-coloring technique's basic case instead.",
    bvid: "BV1AP41137w7",
    technicalBrief:
      "Frames binary search as coloring each index red or blue by a predicate, then searching for the boundary between the two colors. The habit is to always implement one lowerBound helper and reduce every variant (first occurrence, last occurrence, etc.) to a call on it, using an open search interval to avoid off-by-one bugs. O(log n) time, O(1) space."
  },
  {
    episode: 5,
    titleCn: "数组峰值 搜索旋转排序数组",
    titleEn: "Search in Rotated Sorted Array",
    problemIds: ["official-search-in-rotated-sorted-array", "official-find-minimum-in-rotated-sorted-array"],
    note: "Find Peak Element (LC 162) isn't in the catalog yet.",
    bvid: "BV1QK411d76w",
    technicalBrief:
      "Two binary searches chained together: first find the rotation pivot (the index of the minimum, by comparing each midpoint to the array's last element), then binary search for the target within whichever of the two monotonic halves it must fall into given that pivot. O(log n) time."
  },
  {
    episode: 6,
    titleCn: "反转链表",
    titleEn: "Reverse Linked List",
    problemIds: ["reverse-linked-list", "official-reverse-nodes-in-k-group"],
    bvid: "BV1sd4y1x7KN",
    technicalBrief:
      "Two approaches: recursive (reverse everything after head first, then splice head onto the tail of that reversed sublist and null out head's old next pointer), and iterative head-insertion (repeatedly detach the front node and insert it at the front of a new list). Both O(n) time; recursion uses O(n) stack space, iteration O(1) extra space."
  },
  {
    episode: 7,
    titleCn: "环形链表 II",
    titleEn: "Linked List Cycle",
    problemIds: ["linked-list-cycle", "official-reorder-list"],
    note: "The video's main focus (LC 142, finding the cycle's entry node) isn't in the catalog yet - the catalog has the yes/no cycle-detection version (LC 141) instead.",
    bvid: "BV1KG4y1G7cu",
    technicalBrief:
      "Fast/slow pointer (tortoise and hare): both start at head, slow moves one step per iteration, fast moves two. If a cycle exists they must eventually meet, because relative to the slow pointer the fast pointer closes the gap by exactly one step each round. O(n) time, O(1) space."
  },
  {
    episode: 8,
    titleCn: "删除链表重复节点",
    titleEn: "Remove Nth Node From End of List",
    problemIds: ["remove-nth-from-end"],
    note: "The video's main focus (deleting duplicates, LC 82/83) isn't in the catalog yet - the catalog has one of its other worked examples (LC 19) instead.",
    bvid: "BV1VP4y1Q71e",
    technicalBrief:
      "Two pointers offset by n+1 steps, using a dummy sentinel node before the head so removing the real head needs no special case. Advance the front pointer n+1 steps first, then move both together until the front falls off the end - the back pointer now sits just before the node to remove. O(n) time, one pass, O(1) space."
  },
  {
    episode: 9,
    titleCn: "看到递归就晕？带你理解递归的本质",
    titleEn: "Understanding Recursion",
    problemIds: ["max-depth-tree"],
    bvid: "BV1UD4y1Y769",
    technicalBrief:
      "Frames recursion as trusting that a call on a strictly smaller subproblem already returns the correct answer, the same leap of faith as mathematical induction. For tree depth specifically: bottom-up combines the max of both children's depths plus one; top-down threads the current depth downward as a parameter and updates a running max at each node visited."
  },
  {
    episode: 10,
    titleCn: "如何灵活运用递归？",
    titleEn: "Applying Recursion",
    problemIds: ["same-tree", "official-balanced-binary-tree", "official-binary-tree-right-side-view"],
    bvid: "BV18M411z7bb",
    technicalBrief:
      "Extends the same DFS-recursion template: at each node, compute or compare information from both subtrees and combine it before returning. Same-tree checks value equality plus recursively checking both children; the same shape (handle the base case, recurse on children, combine their results) covers most single-tree and two-tree structural checks."
  },
  {
    episode: 11,
    titleCn: "验证二叉搜索树",
    titleEn: "Validate Binary Search Tree",
    problemIds: ["official-validate-binary-search-tree"],
    bvid: "BV14G411P7C1",
    technicalBrief:
      "Two approaches: (1) pass a valid (low, high) open range down recursively, narrowing it for each child, and check the current node's value falls strictly inside it; (2) inorder traversal of a valid BST must be strictly increasing, so track the previously visited value and compare against it as you go."
  },
  {
    episode: 12,
    titleCn: "二叉树的最近公共祖先",
    titleEn: "Lowest Common Ancestor of a Binary Tree",
    problemIds: ["official-lowest-common-ancestor-of-a-binary-search-tree"],
    note: "The video's main focus (LC 236, general binary tree) isn't in the catalog yet - the catalog has its binary-search-tree variant (LC 235) instead.",
    bvid: "BV1W44y1Z7AR",
    technicalBrief:
      "Exploits BST ordering directly: if both targets' values are less than the current node's, recurse left; if both greater, recurse right; otherwise the current node is the LCA (values split across it, or it equals one of them). No null-node checks are needed since the search only ever descends into a subtree guaranteed to contain both targets."
  },
  {
    episode: 13,
    titleCn: "二叉树的层序遍历",
    titleEn: "Binary Tree Level Order Traversal",
    problemIds: ["binary-tree-level-order"],
    bvid: "BV1hG4y1277i",
    technicalBrief:
      "Breadth-first search via a queue: each outer loop iteration processes exactly one full level, by looping only over the number of nodes currently in the queue (captured before enqueueing that level's children) so each level naturally becomes its own output row. O(n) time and space."
  },
  {
    episode: 14,
    titleCn: "回溯算法套路①子集型回溯",
    titleEn: "Backtracking I: Subsets",
    problemIds: ["subsets", "official-letter-combinations-of-a-phone-number", "official-palindrome-partitioning"],
    bvid: "BV1mG4y1A7Gu",
    technicalBrief:
      "\"Select or skip\" framing: for each element in turn, branch into two recursive calls (leave it out, or append it to the path). After the include branch returns, pop it back off the path (\"restore the scene\") before trying the next element, so branches never leak state into each other. 2^n leaves, O(n * 2^n) time."
  },
  {
    episode: 15,
    titleCn: "回溯算法套路②组合型回溯+剪枝",
    titleEn: "Backtracking II: Combinations + Pruning",
    problemIds: ["official-generate-parentheses", "combination-sum"],
    note: "The video's main worked examples are Combinations (LC 77) and Combination Sum III (LC 216), not in the catalog yet - Combination Sum (LC 39) is the exact follow-up exercise it assigns as homework.",
    bvid: "BV1xG4y1F7nC",
    technicalBrief:
      "Reframes combination problems as filling a sequence of positions left to right, one decision per position, from the \"select or skip\" backtracking template. Pruning cuts a branch early once too few candidates remain to possibly complete a valid combination, avoiding recursion into guaranteed dead ends."
  },
  {
    episode: 16,
    titleCn: "回溯算法套路③排列型回溯+N皇后",
    titleEn: "Backtracking III: Permutations + N-Queens",
    problemIds: ["official-permutations", "official-n-queens"],
    bvid: "BV1mY411D7f6",
    technicalBrief:
      "\"Choose which unused element fills this position\" framing: a boolean on_path array tracks which elements are already used, and at each position the code tries every not-yet-used element, recursing, then unmarks it (backtracks) before trying the next candidate. N-Queens extends this directly - each row picks a column that isn't already used or attacked."
  },
  {
    episode: 17,
    titleCn: "动态规划入门：从记忆化搜索到递推",
    titleEn: "DP Fundamentals: Memoization to Tabulation",
    problemIds: ["house-robber", "official-climbing-stairs", "official-house-robber-ii"],
    bvid: "BV1Xj411K7oF",
    technicalBrief:
      "The full DP pipeline taught step by step: start from plain recursion (dfs(i) = max of skipping house i, or robbing it plus dfs(i-2)); add memoization/caching to avoid recomputing the same state; mechanically translate the memoized recursion into a bottom-up array (shifting indices to dodge negative ones); finally compress the array into two rolling variables for O(1) space."
  },
  {
    episode: 18,
    titleCn: "0-1 背包 完全背包",
    titleEn: "0/1 Knapsack, Unbounded Knapsack",
    problemIds: ["official-target-sum", "coin-change", "partition-equal-subset-sum"],
    bvid: "BV16Y411v7Y6",
    technicalBrief:
      "Reduces Target Sum to a 0/1 knapsack: split elements into a positive-assigned group and a negative-assigned group, derive the required sum p algebraically from the total sum and target, then count subsets that sum to p via the standard 0/1 knapsack recursion (dfs(i, capacity) = ways skipping i, plus ways using i). Coin Change is the unbounded-knapsack sibling, where each item can be reused."
  },
  {
    episode: 19,
    titleCn: "最长公共子序列 编辑距离",
    titleEn: "Longest Common Subsequence, Edit Distance",
    problemIds: ["longest-common-subsequence", "official-edit-distance"],
    bvid: "BV1TM4y1o7ug",
    technicalBrief:
      "Two-string DP comparing the last characters of each prefix: if they match, recurse on both strings shortened by one and add one to the result; otherwise take the best of dropping the last character from either string alone. Translating this recursion into a 2D table (then a rolling 1D array) gives the standard O(nm) time, and Edit Distance follows the identical shape with an extra replace transition."
  },
  {
    episode: 20,
    titleCn: "最长递增子序列",
    titleEn: "Longest Increasing Subsequence",
    problemIds: ["official-longest-increasing-subsequence"],
    bvid: "BV1ub411Q7sB",
    technicalBrief:
      "\"Which element to pick next\" framing, distinct from 0/1 knapsack's \"pick or skip\": dfs(i) is the LIS length ending exactly at index i, taking the best predecessor j < i with a smaller value and adding one. This DP is O(n^2); the video also shows how to push it to O(n log n) with binary search over a tails array."
  },
  {
    episode: 21,
    titleCn: "买卖股票的最佳时机",
    titleEn: "Best Time to Buy and Sell Stock",
    problemIds: ["official-best-time-to-buy-and-sell-stock-with-cooldown", "best-time-stock"],
    note: "The video's main worked examples are variants II, IV (LC 122, 188), not in the catalog yet - the catalog has the cooldown variant (LC 309, also course-taught) and the basic version (LC 121, the video's assigned homework).",
    bvid: "BV1ho4y1W7QK",
    technicalBrief:
      "State-machine DP with two states tracked per day: holding a share, or not. The cooldown variant changes exactly one transition - buying on day i must draw from the \"not holding\" state from two days back (day i-2, not i-1), which encodes the mandatory one-day cooldown after a sale."
  },
  {
    episode: 22,
    titleCn: "区间 DP：最长回文子序列",
    titleEn: "Interval DP: Longest Palindromic Subsequence",
    problemIds: [],
    note: "Longest Palindromic Subsequence (the video's actual problem) isn't in the catalog yet - Longest Palindromic Substring below is a different problem in the same palindrome-DP family, for related practice.",
    relatedProblemIds: ["official-longest-palindromic-substring"],
    bvid: "BV1Gs4y1E7EU",
    technicalBrief:
      "dfs(i, j) is the longest palindromic subsequence length within substring [i, j]. If s[i] == s[j], both ends are usable and the result is dfs(i+1, j-1) + 2; otherwise take the best of dropping either end. O(n^2) time and space; when translated to a table, i must be iterated downward and j upward to respect the dependency order."
  },
  {
    episode: 23,
    titleCn: "树形 DP：树的直径",
    titleEn: "Tree DP: Diameter of a Binary Tree",
    problemIds: ["official-diameter-of-binary-tree", "official-binary-tree-maximum-path-sum"],
    bvid: "BV17o4y187h1",
    technicalBrief:
      "Each node's DFS returns its longest downward chain length (a single path from the node to a leaf below it, not counting a turn). At every node visited, the diameter candidate is its two children's chain lengths added together, updating a running global max - the diameter can \"turn\" at any node, not necessarily the root, so the answer is tracked separately from the DFS return value."
  },
  {
    episode: 24,
    titleCn: "树形 DP：打家劫舍 III",
    titleEn: "Tree DP: House Robber III",
    problemIds: [],
    note: "House Robber III (the video's actual problem, tree DP) isn't in the catalog yet - House Robber below is the same include/exclude recurrence on an array instead of a tree, for related practice.",
    relatedProblemIds: ["house-robber"],
    bvid: "BV1vu4y1f7dn",
    technicalBrief:
      "Each node's DFS returns a pair: the best total if this node IS robbed, and the best total if it is NOT. Robbing a node forces both children into their \"not robbed\" state; not robbing a node lets each child independently take whichever of its two states scores higher. The final answer is the max of both states at the root."
  },
  {
    episode: 25,
    titleCn: "树形 DP：监控二叉树",
    titleEn: "Tree DP: Binary Tree Cameras",
    problemIds: [],
    note: "Binary Tree Cameras (the video's actual problem) isn't in the catalog yet - Diameter of a Binary Tree below uses the same tree-DP shape (each node returns state to its parent), for related practice.",
    relatedProblemIds: ["official-diameter-of-binary-tree"],
    bvid: "BV1oF411U7qL",
    technicalBrief:
      "A minimum dominating-set style tree DP: each node's DFS returns a triple of minimum costs - this node has its own camera; this node is covered because a neighbor above will install one; this node is covered by one of its own children's cameras. Combining children's triples per case yields the minimum camera count; the root only chooses between \"has a camera\" or \"covered by a child\" since it has no parent above it."
  },
  {
    episode: 26,
    titleCn: "单调栈",
    titleEn: "Monotonic Stack",
    problemIds: ["daily-temperatures"],
    bvid: "BV1VN411J7S7",
    technicalBrief:
      "Maintains a stack of indices whose \"next greater element\" answer isn't known yet. Scanning right to left (or left to right, in the alternate write-up), pop any stack entries whose value is beaten by the current element - they've now found their answer - record the distance, then push the current index. Each index is pushed and popped at most once, giving O(n) time."
  },
  {
    episode: 27,
    titleCn: "单调队列 滑动窗口最大值",
    titleEn: "Monotonic Queue: Sliding Window Maximum",
    problemIds: ["official-sliding-window-maximum"],
    bvid: "BV1bM411X72E",
    technicalBrief:
      "Maintains a deque of indices with strictly decreasing values. Each step: pop from the back any indices whose value is beaten by the new element (they can never be the window's max again while it's present), push the new index, then pop from the front any index that has fallen outside the window's left edge. The front of the deque is always the current window's max, giving O(n) total time."
  }
];
