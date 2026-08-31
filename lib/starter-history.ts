// Safe demo history used only to seed the unauthenticated/local client state.
// Kept outside lib/product.ts so importing it cannot pull the answer-bearing
// problem catalog into the root client layout bundle.
export const starterHistory = [
  {
    id: "attempt-1",
    problemId: "longest-substring-no-repeat",
    problemTitle: "Longest Substring Without Repeating Characters",
    selectedPatternLabel: "Sliding Window",
    outcome: "solid",
    insight: "Strong pattern match after noticing contiguous substring plus validity constraint."
  },
  {
    id: "attempt-2",
    problemId: "binary-tree-level-order",
    problemTitle: "Binary Tree Level Order Traversal",
    selectedPatternLabel: "Depth-First Search",
    outcome: "confused",
    insight: "Confused DFS with BFS because traversal was recognized but level-order detail was missed."
  }
] as const;
