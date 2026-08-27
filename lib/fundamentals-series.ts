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
    problemIds: ["container-most-water", "official-trapping-rain-water"]
  },
  {
    episode: 3,
    titleCn: "滑动窗口",
    titleEn: "Sliding Window",
    problemIds: ["longest-substring-no-repeat"]
  },
  {
    episode: 4,
    titleCn: "二分查找 红蓝染色法",
    titleEn: "Binary Search",
    problemIds: ["binary-search"]
  },
  {
    episode: 5,
    titleCn: "数组峰值 搜索旋转排序数组",
    titleEn: "Search in Rotated Sorted Array",
    problemIds: ["official-search-in-rotated-sorted-array"],
    note: "Find Peak Element isn't in the catalog yet - this step only covers Search in Rotated Sorted Array."
  },
  {
    episode: 6,
    titleCn: "反转链表",
    titleEn: "Reverse Linked List",
    problemIds: ["reverse-linked-list"]
  },
  {
    episode: 7,
    titleCn: "环形链表 II",
    titleEn: "Linked List Cycle",
    problemIds: ["linked-list-cycle"],
    note: "The catalog has the yes/no cycle-detection version; the video covers finding the cycle's entry node - same core idea."
  },
  {
    episode: 8,
    titleCn: "删除链表重复节点",
    titleEn: "Remove Duplicates from Sorted List",
    problemIds: [],
    note: "Not in the catalog yet - watch the explainer and solve it directly on LeetCode."
  },
  {
    episode: 9,
    titleCn: "看到递归就晕？带你理解递归的本质",
    titleEn: "Understanding Recursion",
    problemIds: [],
    note: "A concept lesson with no single matching problem - it pays off on the recursion-heavy episodes ahead."
  },
  {
    episode: 10,
    titleCn: "如何灵活运用递归？",
    titleEn: "Applying Recursion",
    problemIds: [],
    note: "Concept lesson, same as episode 9 - no single matching problem."
  },
  {
    episode: 11,
    titleCn: "验证二叉搜索树",
    titleEn: "Validate Binary Search Tree",
    problemIds: ["official-validate-binary-search-tree"]
  },
  {
    episode: 12,
    titleCn: "二叉树的最近公共祖先",
    titleEn: "Lowest Common Ancestor of a Binary Tree",
    problemIds: ["official-lowest-common-ancestor-of-a-binary-search-tree"],
    note: "The catalog has the binary-search-tree version; the general binary-tree version isn't in yet, but the technique carries over."
  },
  {
    episode: 13,
    titleCn: "二叉树的层序遍历",
    titleEn: "Binary Tree Level Order Traversal",
    problemIds: ["binary-tree-level-order"]
  },
  {
    episode: 14,
    titleCn: "回溯算法套路①子集型回溯",
    titleEn: "Backtracking I: Subsets",
    problemIds: ["subsets"]
  },
  {
    episode: 15,
    titleCn: "回溯算法套路②组合型回溯+剪枝",
    titleEn: "Backtracking II: Combinations + Pruning",
    problemIds: ["combination-sum"]
  },
  {
    episode: 16,
    titleCn: "回溯算法套路③排列型回溯+N皇后",
    titleEn: "Backtracking III: Permutations + N-Queens",
    problemIds: ["official-permutations", "official-n-queens"]
  },
  {
    episode: 17,
    titleCn: "动态规划入门：从记忆化搜索到递推",
    titleEn: "DP Fundamentals: Memoization to Tabulation",
    problemIds: ["official-climbing-stairs"]
  },
  {
    episode: 18,
    titleCn: "0-1 背包 完全背包",
    titleEn: "0/1 Knapsack, Unbounded Knapsack",
    problemIds: ["partition-equal-subset-sum", "coin-change"]
  },
  {
    episode: 19,
    titleCn: "最长公共子序列 编辑距离",
    titleEn: "Longest Common Subsequence, Edit Distance",
    problemIds: ["longest-common-subsequence", "official-edit-distance"]
  },
  {
    episode: 20,
    titleCn: "最长递增子序列",
    titleEn: "Longest Increasing Subsequence",
    problemIds: ["official-longest-increasing-subsequence"]
  },
  {
    episode: 21,
    titleCn: "买卖股票的最佳时机",
    titleEn: "Best Time to Buy and Sell Stock",
    problemIds: ["best-time-stock"]
  },
  {
    episode: 22,
    titleCn: "区间 DP：最长回文子序列",
    titleEn: "Interval DP: Longest Palindromic Subsequence",
    problemIds: [],
    note: "Longest Palindromic Subsequence isn't in the catalog - the catalog's Longest Palindromic Substring is a different problem, so this step just links the video."
  },
  {
    episode: 23,
    titleCn: "树形 DP：树的直径",
    titleEn: "Tree DP: Diameter of a Binary Tree",
    problemIds: ["official-diameter-of-binary-tree"]
  },
  {
    episode: 24,
    titleCn: "树形 DP：打家劫舍 III",
    titleEn: "Tree DP: House Robber III",
    problemIds: [],
    note: "Not in the catalog yet - watch the explainer and solve it directly on LeetCode."
  },
  {
    episode: 25,
    titleCn: "树形 DP：监控二叉树",
    titleEn: "Tree DP: Binary Tree Cameras",
    problemIds: [],
    note: "Not in the catalog yet - watch the explainer and solve it directly on LeetCode."
  },
  {
    episode: 26,
    titleCn: "单调栈",
    titleEn: "Monotonic Stack",
    problemIds: ["daily-temperatures"]
  },
  {
    episode: 27,
    titleCn: "单调队列 滑动窗口最大值",
    titleEn: "Monotonic Queue: Sliding Window Maximum",
    problemIds: ["official-sliding-window-maximum"]
  }
];
