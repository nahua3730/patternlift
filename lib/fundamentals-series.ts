// A curated, sequential walkthrough that mirrors the "基础算法精讲" playlist
// (灵茶山艾府, Bilibili). We never reproduce or summarize the video content
// itself - each step just points at the matching problem already in the
// catalog (when one exists) plus a link back to the playlist so the learner
// can watch the explainer on their own before or after solving it here.
export type FundamentalsEpisode = {
  episode: number;
  titleCn: string;
  titleEn: string;
  problemIds: string[];
  note?: string;
  bvid?: string;
};

export const fundamentalsSeriesUrl = "https://space.bilibili.com/206214/lists/842776?type=season";

export const fundamentalsSeries: FundamentalsEpisode[] = [
  {
    episode: 1,
    titleCn: "两数之和 三数之和",
    titleEn: "Two Sum II, 3Sum",
    problemIds: ["official-two-sum-ii-input-array-is-sorted", "three-sum"],
    bvid: "BV1bP411c7oJ"
  },
  {
    episode: 2,
    titleCn: "盛最多水的容器 接雨水",
    titleEn: "Container With Most Water, Trapping Rain Water",
    problemIds: ["container-most-water", "official-trapping-rain-water"],
    bvid: "BV1Qg411q7ia"
  },
  {
    episode: 3,
    titleCn: "滑动窗口",
    titleEn: "Sliding Window",
    problemIds: ["longest-substring-no-repeat"],
    bvid: "BV1hd4y1r7Gq"
  },
  {
    episode: 4,
    titleCn: "二分查找 红蓝染色法",
    titleEn: "Binary Search",
    problemIds: ["binary-search"],
    note: "The video's main worked example is Find First and Last Position of Element in Sorted Array (LC 34), not in the catalog yet - this step links the same red-blue-coloring technique's basic case instead.",
    bvid: "BV1AP41137w7"
  },
  {
    episode: 5,
    titleCn: "数组峰值 搜索旋转排序数组",
    titleEn: "Search in Rotated Sorted Array",
    problemIds: ["official-search-in-rotated-sorted-array", "official-find-minimum-in-rotated-sorted-array"],
    note: "Find Peak Element (LC 162) isn't in the catalog yet.",
    bvid: "BV1QK411d76w"
  },
  {
    episode: 6,
    titleCn: "反转链表",
    titleEn: "Reverse Linked List",
    problemIds: ["reverse-linked-list", "official-reverse-nodes-in-k-group"],
    bvid: "BV1sd4y1x7KN"
  },
  {
    episode: 7,
    titleCn: "环形链表 II",
    titleEn: "Linked List Cycle",
    problemIds: ["linked-list-cycle", "official-reorder-list"],
    note: "The video's main focus (LC 142, finding the cycle's entry node) isn't in the catalog yet - the catalog has the yes/no cycle-detection version (LC 141) instead.",
    bvid: "BV1KG4y1G7cu"
  },
  {
    episode: 8,
    titleCn: "删除链表重复节点",
    titleEn: "Remove Nth Node From End of List",
    problemIds: ["remove-nth-from-end"],
    note: "The video's main focus (deleting duplicates, LC 82/83) isn't in the catalog yet - the catalog has one of its other worked examples (LC 19) instead.",
    bvid: "BV1VP4y1Q71e"
  },
  {
    episode: 9,
    titleCn: "看到递归就晕？带你理解递归的本质",
    titleEn: "Understanding Recursion",
    problemIds: ["max-depth-tree"],
    bvid: "BV1UD4y1Y769"
  },
  {
    episode: 10,
    titleCn: "如何灵活运用递归？",
    titleEn: "Applying Recursion",
    problemIds: ["same-tree", "official-balanced-binary-tree", "official-binary-tree-right-side-view"],
    bvid: "BV18M411z7bb"
  },
  {
    episode: 11,
    titleCn: "验证二叉搜索树",
    titleEn: "Validate Binary Search Tree",
    problemIds: ["official-validate-binary-search-tree"],
    bvid: "BV14G411P7C1"
  },
  {
    episode: 12,
    titleCn: "二叉树的最近公共祖先",
    titleEn: "Lowest Common Ancestor of a Binary Tree",
    problemIds: ["official-lowest-common-ancestor-of-a-binary-search-tree"],
    note: "The video's main focus (LC 236, general binary tree) isn't in the catalog yet - the catalog has its binary-search-tree variant (LC 235) instead.",
    bvid: "BV1W44y1Z7AR"
  },
  {
    episode: 13,
    titleCn: "二叉树的层序遍历",
    titleEn: "Binary Tree Level Order Traversal",
    problemIds: ["binary-tree-level-order"],
    bvid: "BV1hG4y1277i"
  },
  {
    episode: 14,
    titleCn: "回溯算法套路①子集型回溯",
    titleEn: "Backtracking I: Subsets",
    problemIds: ["subsets", "official-letter-combinations-of-a-phone-number", "official-palindrome-partitioning"],
    bvid: "BV1mG4y1A7Gu"
  },
  {
    episode: 15,
    titleCn: "回溯算法套路②组合型回溯+剪枝",
    titleEn: "Backtracking II: Combinations + Pruning",
    problemIds: ["official-generate-parentheses", "combination-sum"],
    note: "The video's main worked examples are Combinations (LC 77) and Combination Sum III (LC 216), not in the catalog yet - Combination Sum (LC 39) is the exact follow-up exercise it assigns as homework.",
    bvid: "BV1xG4y1F7nC"
  },
  {
    episode: 16,
    titleCn: "回溯算法套路③排列型回溯+N皇后",
    titleEn: "Backtracking III: Permutations + N-Queens",
    problemIds: ["official-permutations", "official-n-queens"],
    bvid: "BV1mY411D7f6"
  },
  {
    episode: 17,
    titleCn: "动态规划入门：从记忆化搜索到递推",
    titleEn: "DP Fundamentals: Memoization to Tabulation",
    problemIds: ["house-robber", "official-climbing-stairs", "official-house-robber-ii"],
    bvid: "BV1Xj411K7oF"
  },
  {
    episode: 18,
    titleCn: "0-1 背包 完全背包",
    titleEn: "0/1 Knapsack, Unbounded Knapsack",
    problemIds: ["official-target-sum", "coin-change", "partition-equal-subset-sum"],
    bvid: "BV16Y411v7Y6"
  },
  {
    episode: 19,
    titleCn: "最长公共子序列 编辑距离",
    titleEn: "Longest Common Subsequence, Edit Distance",
    problemIds: ["longest-common-subsequence", "official-edit-distance"],
    bvid: "BV1TM4y1o7ug"
  },
  {
    episode: 20,
    titleCn: "最长递增子序列",
    titleEn: "Longest Increasing Subsequence",
    problemIds: ["official-longest-increasing-subsequence"],
    bvid: "BV1ub411Q7sB"
  },
  {
    episode: 21,
    titleCn: "买卖股票的最佳时机",
    titleEn: "Best Time to Buy and Sell Stock",
    problemIds: ["official-best-time-to-buy-and-sell-stock-with-cooldown", "best-time-stock"],
    note: "The video's main worked examples are variants II, IV (LC 122, 188), not in the catalog yet - the catalog has the cooldown variant (LC 309, also course-taught) and the basic version (LC 121, the video's assigned homework).",
    bvid: "BV1ho4y1W7QK"
  },
  {
    episode: 22,
    titleCn: "区间 DP：最长回文子序列",
    titleEn: "Interval DP: Longest Palindromic Subsequence",
    problemIds: [],
    note: "Longest Palindromic Subsequence isn't in the catalog - the catalog's Longest Palindromic Substring is a different problem, so this step just links the video.",
    bvid: "BV1Gs4y1E7EU"
  },
  {
    episode: 23,
    titleCn: "树形 DP：树的直径",
    titleEn: "Tree DP: Diameter of a Binary Tree",
    problemIds: ["official-diameter-of-binary-tree", "official-binary-tree-maximum-path-sum"],
    bvid: "BV17o4y187h1"
  },
  {
    episode: 24,
    titleCn: "树形 DP：打家劫舍 III",
    titleEn: "Tree DP: House Robber III",
    problemIds: [],
    note: "Not in the catalog yet - watch the explainer and solve it directly on LeetCode.",
    bvid: "BV1vu4y1f7dn"
  },
  {
    episode: 25,
    titleCn: "树形 DP：监控二叉树",
    titleEn: "Tree DP: Binary Tree Cameras",
    problemIds: [],
    note: "Not in the catalog yet - watch the explainer and solve it directly on LeetCode.",
    bvid: "BV1oF411U7qL"
  },
  {
    episode: 26,
    titleCn: "单调栈",
    titleEn: "Monotonic Stack",
    problemIds: ["daily-temperatures"],
    bvid: "BV1VN411J7S7"
  },
  {
    episode: 27,
    titleCn: "单调队列 滑动窗口最大值",
    titleEn: "Monotonic Queue: Sliding Window Maximum",
    problemIds: ["official-sliding-window-maximum"],
    bvid: "BV1bM411X72E"
  }
];
