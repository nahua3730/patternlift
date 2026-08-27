export type OfficialRoadmapEntry = {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  leetcodeNumber: number;
  leetcodeUrl: string | null;
  tracks: Array<"blind75" | "neetcode150">;
  categories: { blind75?: string; neetcode150?: string };
  neetcodeUrls: { blind75?: string; neetcode150?: string };
};

export const officialRoadmapCatalog: OfficialRoadmapEntry[] = [
  {
    "title": "3Sum",
    "difficulty": "Medium",
    "leetcodeNumber": 15,
    "leetcodeUrl": "https://leetcode.com/problems/3sum/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Two Pointers",
      "neetcode150": "Two Pointers"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/three-integer-sum/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/three-integer-sum/question?list=neetcode150"
    }
  },
  {
    "title": "Add Two Numbers",
    "difficulty": "Medium",
    "leetcodeNumber": 2,
    "leetcodeUrl": "https://leetcode.com/problems/add-two-numbers/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/add-two-numbers/question?list=neetcode150"
    }
  },
  {
    "title": "Alien Dictionary",
    "difficulty": "Hard",
    "leetcodeNumber": 269,
    "leetcodeUrl": "https://leetcode.com/problems/alien-dictionary/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Advanced Graphs",
      "neetcode150": "Advanced Graphs"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/foreign-dictionary/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/foreign-dictionary/question?list=neetcode150"
    }
  },
  {
    "title": "Balanced Binary Tree",
    "difficulty": "Easy",
    "leetcodeNumber": 110,
    "leetcodeUrl": "https://leetcode.com/problems/balanced-binary-tree/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/balanced-binary-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Best Time to Buy And Sell Stock",
    "difficulty": "Easy",
    "leetcodeNumber": 121,
    "leetcodeUrl": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Sliding Window",
      "neetcode150": "Sliding Window"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/buy-and-sell-crypto/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/buy-and-sell-crypto/question?list=neetcode150"
    }
  },
  {
    "title": "Best Time to Buy And Sell Stock With Cooldown",
    "difficulty": "Medium",
    "leetcodeNumber": 309,
    "leetcodeUrl": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/buy-and-sell-crypto-with-cooldown/question?list=neetcode150"
    }
  },
  {
    "title": "Binary Search",
    "difficulty": "Easy",
    "leetcodeNumber": 704,
    "leetcodeUrl": "https://leetcode.com/problems/binary-search/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Binary Search"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/binary-search/question?list=neetcode150"
    }
  },
  {
    "title": "Binary Tree Level Order Traversal",
    "difficulty": "Medium",
    "leetcodeNumber": 102,
    "leetcodeUrl": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/level-order-traversal-of-binary-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/level-order-traversal-of-binary-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Binary Tree Maximum Path Sum",
    "difficulty": "Hard",
    "leetcodeNumber": 124,
    "leetcodeUrl": "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/binary-tree-maximum-path-sum/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/binary-tree-maximum-path-sum/question?list=neetcode150"
    }
  },
  {
    "title": "Binary Tree Right Side View",
    "difficulty": "Medium",
    "leetcodeNumber": 199,
    "leetcodeUrl": "https://leetcode.com/problems/binary-tree-right-side-view/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/binary-tree-right-side-view/question?list=neetcode150"
    }
  },
  {
    "title": "Burst Balloons",
    "difficulty": "Hard",
    "leetcodeNumber": 312,
    "leetcodeUrl": "https://leetcode.com/problems/burst-balloons/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/burst-balloons/question?list=neetcode150"
    }
  },
  {
    "title": "Car Fleet",
    "difficulty": "Medium",
    "leetcodeNumber": 853,
    "leetcodeUrl": "https://leetcode.com/problems/car-fleet/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Stack"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/car-fleet/question?list=neetcode150"
    }
  },
  {
    "title": "Cheapest Flights Within K Stops",
    "difficulty": "Medium",
    "leetcodeNumber": 787,
    "leetcodeUrl": "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Advanced Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/cheapest-flight-path/question?list=neetcode150"
    }
  },
  {
    "title": "Climbing Stairs",
    "difficulty": "Easy",
    "leetcodeNumber": 70,
    "leetcodeUrl": "https://leetcode.com/problems/climbing-stairs/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/climbing-stairs/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/climbing-stairs/question?list=neetcode150"
    }
  },
  {
    "title": "Clone Graph",
    "difficulty": "Medium",
    "leetcodeNumber": 133,
    "leetcodeUrl": "https://leetcode.com/problems/clone-graph/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Graphs",
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/clone-graph/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/clone-graph/question?list=neetcode150"
    }
  },
  {
    "title": "Coin Change",
    "difficulty": "Medium",
    "leetcodeNumber": 322,
    "leetcodeUrl": "https://leetcode.com/problems/coin-change/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/coin-change/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/coin-change/question?list=neetcode150"
    }
  },
  {
    "title": "Coin Change II",
    "difficulty": "Medium",
    "leetcodeNumber": 518,
    "leetcodeUrl": "https://leetcode.com/problems/coin-change-ii/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/coin-change-ii/question?list=neetcode150"
    }
  },
  {
    "title": "Combination Sum",
    "difficulty": "Medium",
    "leetcodeNumber": 39,
    "leetcodeUrl": "https://leetcode.com/problems/combination-sum/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Backtracking",
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/combination-target-sum/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/combination-target-sum/question?list=neetcode150"
    }
  },
  {
    "title": "Combination Sum II",
    "difficulty": "Medium",
    "leetcodeNumber": 40,
    "leetcodeUrl": "https://leetcode.com/problems/combination-sum-ii/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/combination-target-sum-ii/question?list=neetcode150"
    }
  },
  {
    "title": "Construct Binary Tree From Preorder And Inorder Traversal",
    "difficulty": "Medium",
    "leetcodeNumber": 105,
    "leetcodeUrl": "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/binary-tree-from-preorder-and-inorder-traversal/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/binary-tree-from-preorder-and-inorder-traversal/question?list=neetcode150"
    }
  },
  {
    "title": "Container With Most Water",
    "difficulty": "Medium",
    "leetcodeNumber": 11,
    "leetcodeUrl": "https://leetcode.com/problems/container-with-most-water/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Two Pointers",
      "neetcode150": "Two Pointers"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/max-water-container/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/max-water-container/question?list=neetcode150"
    }
  },
  {
    "title": "Contains Duplicate",
    "difficulty": "Easy",
    "leetcodeNumber": 217,
    "leetcodeUrl": "https://leetcode.com/problems/contains-duplicate/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Arrays & Hashing",
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/duplicate-integer/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/duplicate-integer/question?list=neetcode150"
    }
  },
  {
    "title": "Copy List With Random Pointer",
    "difficulty": "Medium",
    "leetcodeNumber": 138,
    "leetcodeUrl": "https://leetcode.com/problems/copy-list-with-random-pointer/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/copy-linked-list-with-random-pointer/question?list=neetcode150"
    }
  },
  {
    "title": "Count Good Nodes In Binary Tree",
    "difficulty": "Medium",
    "leetcodeNumber": 1448,
    "leetcodeUrl": "https://leetcode.com/problems/count-good-nodes-in-binary-tree/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/count-good-nodes-in-binary-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Counting Bits",
    "difficulty": "Easy",
    "leetcodeNumber": 338,
    "leetcodeUrl": "https://leetcode.com/problems/counting-bits/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Bit Manipulation",
      "neetcode150": "Bit Manipulation"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/counting-bits/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/counting-bits/question?list=neetcode150"
    }
  },
  {
    "title": "Course Schedule",
    "difficulty": "Medium",
    "leetcodeNumber": 207,
    "leetcodeUrl": "https://leetcode.com/problems/course-schedule/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Graphs",
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/course-schedule/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/course-schedule/question?list=neetcode150"
    }
  },
  {
    "title": "Course Schedule II",
    "difficulty": "Medium",
    "leetcodeNumber": 210,
    "leetcodeUrl": "https://leetcode.com/problems/course-schedule-ii/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/course-schedule-ii/question?list=neetcode150"
    }
  },
  {
    "title": "Daily Temperatures",
    "difficulty": "Medium",
    "leetcodeNumber": 739,
    "leetcodeUrl": "https://leetcode.com/problems/daily-temperatures/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Stack"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/daily-temperatures/question?list=neetcode150"
    }
  },
  {
    "title": "Decode Ways",
    "difficulty": "Medium",
    "leetcodeNumber": 91,
    "leetcodeUrl": "https://leetcode.com/problems/decode-ways/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/decode-ways/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/decode-ways/question?list=neetcode150"
    }
  },
  {
    "title": "Design Add And Search Words Data Structure",
    "difficulty": "Medium",
    "leetcodeNumber": 211,
    "leetcodeUrl": "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Tries",
      "neetcode150": "Tries"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/design-word-search-data-structure/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/design-word-search-data-structure/question?list=neetcode150"
    }
  },
  {
    "title": "Design Twitter",
    "difficulty": "Medium",
    "leetcodeNumber": 355,
    "leetcodeUrl": "https://leetcode.com/problems/design-twitter/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Heap / Priority Queue"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/design-twitter-feed/question?list=neetcode150"
    }
  },
  {
    "title": "Detect Squares",
    "difficulty": "Medium",
    "leetcodeNumber": 2013,
    "leetcodeUrl": "https://leetcode.com/problems/detect-squares/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Math & Geometry"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/count-squares/question?list=neetcode150"
    }
  },
  {
    "title": "Diameter of Binary Tree",
    "difficulty": "Easy",
    "leetcodeNumber": 543,
    "leetcodeUrl": "https://leetcode.com/problems/diameter-of-binary-tree/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/binary-tree-diameter/question?list=neetcode150"
    }
  },
  {
    "title": "Distinct Subsequences",
    "difficulty": "Hard",
    "leetcodeNumber": 115,
    "leetcodeUrl": "https://leetcode.com/problems/distinct-subsequences/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/count-subsequences/question?list=neetcode150"
    }
  },
  {
    "title": "Edit Distance",
    "difficulty": "Hard",
    "leetcodeNumber": 72,
    "leetcodeUrl": "https://leetcode.com/problems/edit-distance/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/edit-distance/question?list=neetcode150"
    }
  },
  {
    "title": "Encode and Decode Strings",
    "difficulty": "Medium",
    "leetcodeNumber": 271,
    "leetcodeUrl": "https://leetcode.com/problems/encode-and-decode-strings/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Arrays & Hashing",
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/string-encode-and-decode/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/string-encode-and-decode/question?list=neetcode150"
    }
  },
  {
    "title": "Evaluate Reverse Polish Notation",
    "difficulty": "Medium",
    "leetcodeNumber": 150,
    "leetcodeUrl": "https://leetcode.com/problems/evaluate-reverse-polish-notation/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Stack"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/evaluate-reverse-polish-notation/question?list=neetcode150"
    }
  },
  {
    "title": "Find Median From Data Stream",
    "difficulty": "Hard",
    "leetcodeNumber": 295,
    "leetcodeUrl": "https://leetcode.com/problems/find-median-from-data-stream/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Heap / Priority Queue",
      "neetcode150": "Heap / Priority Queue"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/find-median-in-a-data-stream/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/find-median-in-a-data-stream/question?list=neetcode150"
    }
  },
  {
    "title": "Find Minimum In Rotated Sorted Array",
    "difficulty": "Medium",
    "leetcodeNumber": 153,
    "leetcodeUrl": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Binary Search",
      "neetcode150": "Binary Search"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/find-minimum-in-rotated-sorted-array/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/find-minimum-in-rotated-sorted-array/question?list=neetcode150"
    }
  },
  {
    "title": "Find The Duplicate Number",
    "difficulty": "Medium",
    "leetcodeNumber": 287,
    "leetcodeUrl": "https://leetcode.com/problems/find-the-duplicate-number/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/find-duplicate-integer/question?list=neetcode150"
    }
  },
  {
    "title": "Gas Station",
    "difficulty": "Medium",
    "leetcodeNumber": 134,
    "leetcodeUrl": "https://leetcode.com/problems/gas-station/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Greedy"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/gas-station/question?list=neetcode150"
    }
  },
  {
    "title": "Generate Parentheses",
    "difficulty": "Medium",
    "leetcodeNumber": 22,
    "leetcodeUrl": "https://leetcode.com/problems/generate-parentheses/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/generate-parentheses/question?list=neetcode150"
    }
  },
  {
    "title": "Graph Valid Tree",
    "difficulty": "Medium",
    "leetcodeNumber": 261,
    "leetcodeUrl": "https://leetcode.com/problems/graph-valid-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Graphs",
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/valid-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/valid-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Group Anagrams",
    "difficulty": "Medium",
    "leetcodeNumber": 49,
    "leetcodeUrl": "https://leetcode.com/problems/group-anagrams/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Arrays & Hashing",
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/anagram-groups/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/anagram-groups/question?list=neetcode150"
    }
  },
  {
    "title": "Hand of Straights",
    "difficulty": "Medium",
    "leetcodeNumber": 846,
    "leetcodeUrl": "https://leetcode.com/problems/hand-of-straights/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Greedy"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/hand-of-straights/question?list=neetcode150"
    }
  },
  {
    "title": "Happy Number",
    "difficulty": "Easy",
    "leetcodeNumber": 202,
    "leetcodeUrl": "https://leetcode.com/problems/happy-number/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Math & Geometry"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/non-cyclical-number/question?list=neetcode150"
    }
  },
  {
    "title": "House Robber",
    "difficulty": "Medium",
    "leetcodeNumber": 198,
    "leetcodeUrl": "https://leetcode.com/problems/house-robber/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/house-robber/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/house-robber/question?list=neetcode150"
    }
  },
  {
    "title": "House Robber II",
    "difficulty": "Medium",
    "leetcodeNumber": 213,
    "leetcodeUrl": "https://leetcode.com/problems/house-robber-ii/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/house-robber-ii/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/house-robber-ii/question?list=neetcode150"
    }
  },
  {
    "title": "Implement Trie Prefix Tree",
    "difficulty": "Medium",
    "leetcodeNumber": 208,
    "leetcodeUrl": "https://leetcode.com/problems/implement-trie-prefix-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Tries",
      "neetcode150": "Tries"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/implement-prefix-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/implement-prefix-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Insert Interval",
    "difficulty": "Medium",
    "leetcodeNumber": 57,
    "leetcodeUrl": "https://leetcode.com/problems/insert-interval/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Intervals",
      "neetcode150": "Intervals"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/insert-new-interval/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/insert-new-interval/question?list=neetcode150"
    }
  },
  {
    "title": "Interleaving String",
    "difficulty": "Medium",
    "leetcodeNumber": 97,
    "leetcodeUrl": "https://leetcode.com/problems/interleaving-string/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/interleaving-string/question?list=neetcode150"
    }
  },
  {
    "title": "Invert Binary Tree",
    "difficulty": "Easy",
    "leetcodeNumber": 226,
    "leetcodeUrl": "https://leetcode.com/problems/invert-binary-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/invert-a-binary-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/invert-a-binary-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Jump Game",
    "difficulty": "Medium",
    "leetcodeNumber": 55,
    "leetcodeUrl": "https://leetcode.com/problems/jump-game/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Greedy",
      "neetcode150": "Greedy"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/jump-game/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/jump-game/question?list=neetcode150"
    }
  },
  {
    "title": "Jump Game II",
    "difficulty": "Medium",
    "leetcodeNumber": 45,
    "leetcodeUrl": "https://leetcode.com/problems/jump-game-ii/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Greedy"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/jump-game-ii/question?list=neetcode150"
    }
  },
  {
    "title": "K Closest Points to Origin",
    "difficulty": "Medium",
    "leetcodeNumber": 973,
    "leetcodeUrl": "https://leetcode.com/problems/k-closest-points-to-origin/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Heap / Priority Queue"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/k-closest-points-to-origin/question?list=neetcode150"
    }
  },
  {
    "title": "Koko Eating Bananas",
    "difficulty": "Medium",
    "leetcodeNumber": 875,
    "leetcodeUrl": "https://leetcode.com/problems/koko-eating-bananas/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Binary Search"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/eating-bananas/question?list=neetcode150"
    }
  },
  {
    "title": "Kth Largest Element In a Stream",
    "difficulty": "Easy",
    "leetcodeNumber": 703,
    "leetcodeUrl": "https://leetcode.com/problems/kth-largest-element-in-a-stream/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Heap / Priority Queue"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/kth-largest-integer-in-a-stream/question?list=neetcode150"
    }
  },
  {
    "title": "Kth Largest Element In An Array",
    "difficulty": "Medium",
    "leetcodeNumber": 215,
    "leetcodeUrl": "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Heap / Priority Queue"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/kth-largest-element-in-an-array/question?list=neetcode150"
    }
  },
  {
    "title": "Kth Smallest Element In a Bst",
    "difficulty": "Medium",
    "leetcodeNumber": 230,
    "leetcodeUrl": "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/kth-smallest-integer-in-bst/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/kth-smallest-integer-in-bst/question?list=neetcode150"
    }
  },
  {
    "title": "Largest Rectangle In Histogram",
    "difficulty": "Hard",
    "leetcodeNumber": 84,
    "leetcodeUrl": "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Stack"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/largest-rectangle-in-histogram/question?list=neetcode150"
    }
  },
  {
    "title": "Last Stone Weight",
    "difficulty": "Easy",
    "leetcodeNumber": 1046,
    "leetcodeUrl": "https://leetcode.com/problems/last-stone-weight/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Heap / Priority Queue"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/last-stone-weight/question?list=neetcode150"
    }
  },
  {
    "title": "Letter Combinations of a Phone Number",
    "difficulty": "Medium",
    "leetcodeNumber": 17,
    "leetcodeUrl": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/combinations-of-a-phone-number/question?list=neetcode150"
    }
  },
  {
    "title": "Linked List Cycle",
    "difficulty": "Easy",
    "leetcodeNumber": 141,
    "leetcodeUrl": "https://leetcode.com/problems/linked-list-cycle/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Linked List",
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/linked-list-cycle-detection/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/linked-list-cycle-detection/question?list=neetcode150"
    }
  },
  {
    "title": "Longest Common Subsequence",
    "difficulty": "Medium",
    "leetcodeNumber": 1143,
    "leetcodeUrl": "https://leetcode.com/problems/longest-common-subsequence/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "2-D Dynamic Programming",
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/longest-common-subsequence/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/longest-common-subsequence/question?list=neetcode150"
    }
  },
  {
    "title": "Longest Consecutive Sequence",
    "difficulty": "Medium",
    "leetcodeNumber": 128,
    "leetcodeUrl": "https://leetcode.com/problems/longest-consecutive-sequence/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Arrays & Hashing",
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/longest-consecutive-sequence/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/longest-consecutive-sequence/question?list=neetcode150"
    }
  },
  {
    "title": "Longest Increasing Path In a Matrix",
    "difficulty": "Hard",
    "leetcodeNumber": 329,
    "leetcodeUrl": "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/longest-increasing-path-in-matrix/question?list=neetcode150"
    }
  },
  {
    "title": "Longest Increasing Subsequence",
    "difficulty": "Medium",
    "leetcodeNumber": 300,
    "leetcodeUrl": "https://leetcode.com/problems/longest-increasing-subsequence/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/longest-increasing-subsequence/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/longest-increasing-subsequence/question?list=neetcode150"
    }
  },
  {
    "title": "Longest Palindromic Substring",
    "difficulty": "Medium",
    "leetcodeNumber": 5,
    "leetcodeUrl": "https://leetcode.com/problems/longest-palindromic-substring/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/longest-palindromic-substring/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/longest-palindromic-substring/question?list=neetcode150"
    }
  },
  {
    "title": "Longest Repeating Character Replacement",
    "difficulty": "Medium",
    "leetcodeNumber": 424,
    "leetcodeUrl": "https://leetcode.com/problems/longest-repeating-character-replacement/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Sliding Window",
      "neetcode150": "Sliding Window"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/longest-repeating-substring-with-replacement/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/longest-repeating-substring-with-replacement/question?list=neetcode150"
    }
  },
  {
    "title": "Longest Substring Without Repeating Characters",
    "difficulty": "Medium",
    "leetcodeNumber": 3,
    "leetcodeUrl": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Sliding Window",
      "neetcode150": "Sliding Window"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/longest-substring-without-duplicates/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/longest-substring-without-duplicates/question?list=neetcode150"
    }
  },
  {
    "title": "Lowest Common Ancestor of a Binary Search Tree",
    "difficulty": "Medium",
    "leetcodeNumber": 235,
    "leetcodeUrl": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/lowest-common-ancestor-in-binary-search-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/lowest-common-ancestor-in-binary-search-tree/question?list=neetcode150"
    }
  },
  {
    "title": "LRU Cache",
    "difficulty": "Medium",
    "leetcodeNumber": 146,
    "leetcodeUrl": "https://leetcode.com/problems/lru-cache/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/lru-cache/question?list=neetcode150"
    }
  },
  {
    "title": "Max Area of Island",
    "difficulty": "Medium",
    "leetcodeNumber": 695,
    "leetcodeUrl": "https://leetcode.com/problems/max-area-of-island/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/max-area-of-island/question?list=neetcode150"
    }
  },
  {
    "title": "Maximum Depth of Binary Tree",
    "difficulty": "Easy",
    "leetcodeNumber": 104,
    "leetcodeUrl": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/depth-of-binary-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/depth-of-binary-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Maximum Product Subarray",
    "difficulty": "Medium",
    "leetcodeNumber": 152,
    "leetcodeUrl": "https://leetcode.com/problems/maximum-product-subarray/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/maximum-product-subarray/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/maximum-product-subarray/question?list=neetcode150"
    }
  },
  {
    "title": "Maximum Subarray",
    "difficulty": "Medium",
    "leetcodeNumber": 53,
    "leetcodeUrl": "https://leetcode.com/problems/maximum-subarray/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Greedy",
      "neetcode150": "Greedy"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/maximum-subarray/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/maximum-subarray/question?list=neetcode150"
    }
  },
  {
    "title": "Median of Two Sorted Arrays",
    "difficulty": "Hard",
    "leetcodeNumber": 4,
    "leetcodeUrl": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Binary Search"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/median-of-two-sorted-arrays/question?list=neetcode150"
    }
  },
  {
    "title": "Meeting Rooms",
    "difficulty": "Easy",
    "leetcodeNumber": 252,
    "leetcodeUrl": "https://leetcode.com/problems/meeting-rooms/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Intervals",
      "neetcode150": "Intervals"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/meeting-schedule/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/meeting-schedule/question?list=neetcode150"
    }
  },
  {
    "title": "Meeting Rooms II",
    "difficulty": "Medium",
    "leetcodeNumber": 253,
    "leetcodeUrl": "https://leetcode.com/problems/meeting-rooms-ii/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Intervals",
      "neetcode150": "Intervals"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/meeting-schedule-ii/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/meeting-schedule-ii/question?list=neetcode150"
    }
  },
  {
    "title": "Merge Intervals",
    "difficulty": "Medium",
    "leetcodeNumber": 56,
    "leetcodeUrl": "https://leetcode.com/problems/merge-intervals/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Intervals",
      "neetcode150": "Intervals"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/merge-intervals/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/merge-intervals/question?list=neetcode150"
    }
  },
  {
    "title": "Merge K Sorted Lists",
    "difficulty": "Hard",
    "leetcodeNumber": 23,
    "leetcodeUrl": "https://leetcode.com/problems/merge-k-sorted-lists/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Linked List",
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/merge-k-sorted-linked-lists/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/merge-k-sorted-linked-lists/question?list=neetcode150"
    }
  },
  {
    "title": "Merge Triplets to Form Target Triplet",
    "difficulty": "Medium",
    "leetcodeNumber": 1899,
    "leetcodeUrl": "https://leetcode.com/problems/merge-triplets-to-form-target-triplet/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Greedy"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/merge-triplets-to-form-target/question?list=neetcode150"
    }
  },
  {
    "title": "Merge Two Sorted Lists",
    "difficulty": "Easy",
    "leetcodeNumber": 21,
    "leetcodeUrl": "https://leetcode.com/problems/merge-two-sorted-lists/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Linked List",
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/merge-two-sorted-linked-lists/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/merge-two-sorted-linked-lists/question?list=neetcode150"
    }
  },
  {
    "title": "Min Cost Climbing Stairs",
    "difficulty": "Easy",
    "leetcodeNumber": 746,
    "leetcodeUrl": "https://leetcode.com/problems/min-cost-climbing-stairs/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/min-cost-climbing-stairs/question?list=neetcode150"
    }
  },
  {
    "title": "Min Cost to Connect All Points",
    "difficulty": "Medium",
    "leetcodeNumber": 1584,
    "leetcodeUrl": "https://leetcode.com/problems/min-cost-to-connect-all-points/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Advanced Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/min-cost-to-connect-points/question?list=neetcode150"
    }
  },
  {
    "title": "Min Stack",
    "difficulty": "Medium",
    "leetcodeNumber": 155,
    "leetcodeUrl": "https://leetcode.com/problems/min-stack/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Stack"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/minimum-stack/question?list=neetcode150"
    }
  },
  {
    "title": "Minimum Interval to Include Each Query",
    "difficulty": "Hard",
    "leetcodeNumber": 1851,
    "leetcodeUrl": "https://leetcode.com/problems/minimum-interval-to-include-each-query/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Intervals"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/minimum-interval-including-query/question?list=neetcode150"
    }
  },
  {
    "title": "Minimum Window Substring",
    "difficulty": "Hard",
    "leetcodeNumber": 76,
    "leetcodeUrl": "https://leetcode.com/problems/minimum-window-substring/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Sliding Window",
      "neetcode150": "Sliding Window"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/minimum-window-with-characters/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/minimum-window-with-characters/question?list=neetcode150"
    }
  },
  {
    "title": "Missing Number",
    "difficulty": "Easy",
    "leetcodeNumber": 268,
    "leetcodeUrl": "https://leetcode.com/problems/missing-number/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Bit Manipulation",
      "neetcode150": "Bit Manipulation"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/missing-number/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/missing-number/question?list=neetcode150"
    }
  },
  {
    "title": "Multiply Strings",
    "difficulty": "Medium",
    "leetcodeNumber": 43,
    "leetcodeUrl": "https://leetcode.com/problems/multiply-strings/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Math & Geometry"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/multiply-strings/question?list=neetcode150"
    }
  },
  {
    "title": "N Queens",
    "difficulty": "Hard",
    "leetcodeNumber": 51,
    "leetcodeUrl": "https://leetcode.com/problems/n-queens/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/n-queens/question?list=neetcode150"
    }
  },
  {
    "title": "Network Delay Time",
    "difficulty": "Medium",
    "leetcodeNumber": 743,
    "leetcodeUrl": "https://leetcode.com/problems/network-delay-time/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Advanced Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/network-delay-time/question?list=neetcode150"
    }
  },
  {
    "title": "Non Overlapping Intervals",
    "difficulty": "Medium",
    "leetcodeNumber": 435,
    "leetcodeUrl": "https://leetcode.com/problems/non-overlapping-intervals/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Intervals",
      "neetcode150": "Intervals"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/non-overlapping-intervals/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/non-overlapping-intervals/question?list=neetcode150"
    }
  },
  {
    "title": "Number of 1 Bits",
    "difficulty": "Easy",
    "leetcodeNumber": 191,
    "leetcodeUrl": "https://leetcode.com/problems/number-of-1-bits/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Bit Manipulation",
      "neetcode150": "Bit Manipulation"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/number-of-one-bits/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/number-of-one-bits/question?list=neetcode150"
    }
  },
  {
    "title": "Number of Connected Components In An Undirected Graph",
    "difficulty": "Medium",
    "leetcodeNumber": 323,
    "leetcodeUrl": "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Graphs",
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/count-connected-components/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/count-connected-components/question?list=neetcode150"
    }
  },
  {
    "title": "Number of Islands",
    "difficulty": "Medium",
    "leetcodeNumber": 200,
    "leetcodeUrl": "https://leetcode.com/problems/number-of-islands/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Graphs",
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/count-number-of-islands/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/count-number-of-islands/question?list=neetcode150"
    }
  },
  {
    "title": "Pacific Atlantic Water Flow",
    "difficulty": "Medium",
    "leetcodeNumber": 417,
    "leetcodeUrl": "https://leetcode.com/problems/pacific-atlantic-water-flow/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Graphs",
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/pacific-atlantic-water-flow/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/pacific-atlantic-water-flow/question?list=neetcode150"
    }
  },
  {
    "title": "Palindrome Partitioning",
    "difficulty": "Medium",
    "leetcodeNumber": 131,
    "leetcodeUrl": "https://leetcode.com/problems/palindrome-partitioning/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/palindrome-partitioning/question?list=neetcode150"
    }
  },
  {
    "title": "Palindromic Substrings",
    "difficulty": "Medium",
    "leetcodeNumber": 647,
    "leetcodeUrl": "https://leetcode.com/problems/palindromic-substrings/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/palindromic-substrings/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/palindromic-substrings/question?list=neetcode150"
    }
  },
  {
    "title": "Partition Equal Subset Sum",
    "difficulty": "Medium",
    "leetcodeNumber": 416,
    "leetcodeUrl": "https://leetcode.com/problems/partition-equal-subset-sum/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/partition-equal-subset-sum/question?list=neetcode150"
    }
  },
  {
    "title": "Partition Labels",
    "difficulty": "Medium",
    "leetcodeNumber": 763,
    "leetcodeUrl": "https://leetcode.com/problems/partition-labels/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Greedy"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/partition-labels/question?list=neetcode150"
    }
  },
  {
    "title": "Permutation In String",
    "difficulty": "Medium",
    "leetcodeNumber": 567,
    "leetcodeUrl": "https://leetcode.com/problems/permutation-in-string/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Sliding Window"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/permutation-string/question?list=neetcode150"
    }
  },
  {
    "title": "Permutations",
    "difficulty": "Medium",
    "leetcodeNumber": 46,
    "leetcodeUrl": "https://leetcode.com/problems/permutations/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/permutations/question?list=neetcode150"
    }
  },
  {
    "title": "Plus One",
    "difficulty": "Easy",
    "leetcodeNumber": 66,
    "leetcodeUrl": "https://leetcode.com/problems/plus-one/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Math & Geometry"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/plus-one/question?list=neetcode150"
    }
  },
  {
    "title": "Pow(x, n)",
    "difficulty": "Medium",
    "leetcodeNumber": 50,
    "leetcodeUrl": "https://leetcode.com/problems/powx-n/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Math & Geometry"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/pow-x-n/question?list=neetcode150"
    }
  },
  {
    "title": "Product of Array Except Self",
    "difficulty": "Medium",
    "leetcodeNumber": 238,
    "leetcodeUrl": "https://leetcode.com/problems/product-of-array-except-self/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Arrays & Hashing",
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/products-of-array-discluding-self/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/products-of-array-discluding-self/question?list=neetcode150"
    }
  },
  {
    "title": "Reconstruct Itinerary",
    "difficulty": "Hard",
    "leetcodeNumber": 332,
    "leetcodeUrl": "https://leetcode.com/problems/reconstruct-itinerary/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Advanced Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/reconstruct-flight-path/question?list=neetcode150"
    }
  },
  {
    "title": "Redundant Connection",
    "difficulty": "Medium",
    "leetcodeNumber": 684,
    "leetcodeUrl": "https://leetcode.com/problems/redundant-connection/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/redundant-connection/question?list=neetcode150"
    }
  },
  {
    "title": "Regular Expression Matching",
    "difficulty": "Hard",
    "leetcodeNumber": 10,
    "leetcodeUrl": "https://leetcode.com/problems/regular-expression-matching/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/regular-expression-matching/question?list=neetcode150"
    }
  },
  {
    "title": "Remove Nth Node From End of List",
    "difficulty": "Medium",
    "leetcodeNumber": 19,
    "leetcodeUrl": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Linked List",
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/remove-node-from-end-of-linked-list/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/remove-node-from-end-of-linked-list/question?list=neetcode150"
    }
  },
  {
    "title": "Reorder List",
    "difficulty": "Medium",
    "leetcodeNumber": 143,
    "leetcodeUrl": "https://leetcode.com/problems/reorder-list/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Linked List",
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/reorder-linked-list/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/reorder-linked-list/question?list=neetcode150"
    }
  },
  {
    "title": "Reverse Bits",
    "difficulty": "Easy",
    "leetcodeNumber": 190,
    "leetcodeUrl": "https://leetcode.com/problems/reverse-bits/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Bit Manipulation",
      "neetcode150": "Bit Manipulation"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/reverse-bits/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/reverse-bits/question?list=neetcode150"
    }
  },
  {
    "title": "Reverse Integer",
    "difficulty": "Medium",
    "leetcodeNumber": 7,
    "leetcodeUrl": "https://leetcode.com/problems/reverse-integer/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Bit Manipulation"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/reverse-integer/question?list=neetcode150"
    }
  },
  {
    "title": "Reverse Linked List",
    "difficulty": "Easy",
    "leetcodeNumber": 206,
    "leetcodeUrl": "https://leetcode.com/problems/reverse-linked-list/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Linked List",
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/reverse-a-linked-list/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/reverse-a-linked-list/question?list=neetcode150"
    }
  },
  {
    "title": "Reverse Nodes In K Group",
    "difficulty": "Hard",
    "leetcodeNumber": 25,
    "leetcodeUrl": "https://leetcode.com/problems/reverse-nodes-in-k-group/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Linked List"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/reverse-nodes-in-k-group/question?list=neetcode150"
    }
  },
  {
    "title": "Rotate Image",
    "difficulty": "Medium",
    "leetcodeNumber": 48,
    "leetcodeUrl": "https://leetcode.com/problems/rotate-image/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Math & Geometry",
      "neetcode150": "Math & Geometry"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/rotate-matrix/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/rotate-matrix/question?list=neetcode150"
    }
  },
  {
    "title": "Rotting Oranges",
    "difficulty": "Medium",
    "leetcodeNumber": 994,
    "leetcodeUrl": "https://leetcode.com/problems/rotting-oranges/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/rotting-fruit/question?list=neetcode150"
    }
  },
  {
    "title": "Same Tree",
    "difficulty": "Easy",
    "leetcodeNumber": 100,
    "leetcodeUrl": "https://leetcode.com/problems/same-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/same-binary-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/same-binary-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Search a 2D Matrix",
    "difficulty": "Medium",
    "leetcodeNumber": 74,
    "leetcodeUrl": "https://leetcode.com/problems/search-a-2d-matrix/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Binary Search"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/search-2d-matrix/question?list=neetcode150"
    }
  },
  {
    "title": "Search In Rotated Sorted Array",
    "difficulty": "Medium",
    "leetcodeNumber": 33,
    "leetcodeUrl": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Binary Search",
      "neetcode150": "Binary Search"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/find-target-in-rotated-sorted-array/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/find-target-in-rotated-sorted-array/question?list=neetcode150"
    }
  },
  {
    "title": "Serialize And Deserialize Binary Tree",
    "difficulty": "Hard",
    "leetcodeNumber": 297,
    "leetcodeUrl": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/serialize-and-deserialize-binary-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/serialize-and-deserialize-binary-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Set Matrix Zeroes",
    "difficulty": "Medium",
    "leetcodeNumber": 73,
    "leetcodeUrl": "https://leetcode.com/problems/set-matrix-zeroes/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Math & Geometry",
      "neetcode150": "Math & Geometry"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/set-zeroes-in-matrix/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/set-zeroes-in-matrix/question?list=neetcode150"
    }
  },
  {
    "title": "Single Number",
    "difficulty": "Easy",
    "leetcodeNumber": 136,
    "leetcodeUrl": "https://leetcode.com/problems/single-number/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Bit Manipulation"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/single-number/question?list=neetcode150"
    }
  },
  {
    "title": "Sliding Window Maximum",
    "difficulty": "Hard",
    "leetcodeNumber": 239,
    "leetcodeUrl": "https://leetcode.com/problems/sliding-window-maximum/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Sliding Window"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/sliding-window-maximum/question?list=neetcode150"
    }
  },
  {
    "title": "Spiral Matrix",
    "difficulty": "Medium",
    "leetcodeNumber": 54,
    "leetcodeUrl": "https://leetcode.com/problems/spiral-matrix/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Math & Geometry",
      "neetcode150": "Math & Geometry"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/spiral-matrix/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/spiral-matrix/question?list=neetcode150"
    }
  },
  {
    "title": "Subsets",
    "difficulty": "Medium",
    "leetcodeNumber": 78,
    "leetcodeUrl": "https://leetcode.com/problems/subsets/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/subsets/question?list=neetcode150"
    }
  },
  {
    "title": "Subsets II",
    "difficulty": "Medium",
    "leetcodeNumber": 90,
    "leetcodeUrl": "https://leetcode.com/problems/subsets-ii/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/subsets-ii/question?list=neetcode150"
    }
  },
  {
    "title": "Subtree of Another Tree",
    "difficulty": "Easy",
    "leetcodeNumber": 572,
    "leetcodeUrl": "https://leetcode.com/problems/subtree-of-another-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/subtree-of-a-binary-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/subtree-of-a-binary-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Sum of Two Integers",
    "difficulty": "Medium",
    "leetcodeNumber": 371,
    "leetcodeUrl": "https://leetcode.com/problems/sum-of-two-integers/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Bit Manipulation",
      "neetcode150": "Bit Manipulation"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/sum-of-two-integers/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/sum-of-two-integers/question?list=neetcode150"
    }
  },
  {
    "title": "Surrounded Regions",
    "difficulty": "Medium",
    "leetcodeNumber": 130,
    "leetcodeUrl": "https://leetcode.com/problems/surrounded-regions/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/surrounded-regions/question?list=neetcode150"
    }
  },
  {
    "title": "Swim In Rising Water",
    "difficulty": "Hard",
    "leetcodeNumber": 778,
    "leetcodeUrl": "https://leetcode.com/problems/swim-in-rising-water/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Advanced Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/swim-in-rising-water/question?list=neetcode150"
    }
  },
  {
    "title": "Target Sum",
    "difficulty": "Medium",
    "leetcodeNumber": 494,
    "leetcodeUrl": "https://leetcode.com/problems/target-sum/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/target-sum/question?list=neetcode150"
    }
  },
  {
    "title": "Task Scheduler",
    "difficulty": "Medium",
    "leetcodeNumber": 621,
    "leetcodeUrl": "https://leetcode.com/problems/task-scheduler/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Heap / Priority Queue"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/task-scheduling/question?list=neetcode150"
    }
  },
  {
    "title": "Time Based Key Value Store",
    "difficulty": "Medium",
    "leetcodeNumber": 981,
    "leetcodeUrl": "https://leetcode.com/problems/time-based-key-value-store/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Binary Search"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/time-based-key-value-store/question?list=neetcode150"
    }
  },
  {
    "title": "Top K Frequent Elements",
    "difficulty": "Medium",
    "leetcodeNumber": 347,
    "leetcodeUrl": "https://leetcode.com/problems/top-k-frequent-elements/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Arrays & Hashing",
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/top-k-elements-in-list/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/top-k-elements-in-list/question?list=neetcode150"
    }
  },
  {
    "title": "Trapping Rain Water",
    "difficulty": "Hard",
    "leetcodeNumber": 42,
    "leetcodeUrl": "https://leetcode.com/problems/trapping-rain-water/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Two Pointers"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/trapping-rain-water/question?list=neetcode150"
    }
  },
  {
    "title": "Two Sum",
    "difficulty": "Easy",
    "leetcodeNumber": 1,
    "leetcodeUrl": "https://leetcode.com/problems/two-sum/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Arrays & Hashing",
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/two-integer-sum/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/two-integer-sum/question?list=neetcode150"
    }
  },
  {
    "title": "Two Sum II Input Array Is Sorted",
    "difficulty": "Medium",
    "leetcodeNumber": 167,
    "leetcodeUrl": "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Two Pointers"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/two-integer-sum-ii/question?list=neetcode150"
    }
  },
  {
    "title": "Unique Paths",
    "difficulty": "Medium",
    "leetcodeNumber": 62,
    "leetcodeUrl": "https://leetcode.com/problems/unique-paths/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "2-D Dynamic Programming",
      "neetcode150": "2-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/count-paths/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/count-paths/question?list=neetcode150"
    }
  },
  {
    "title": "Valid Anagram",
    "difficulty": "Easy",
    "leetcodeNumber": 242,
    "leetcodeUrl": "https://leetcode.com/problems/valid-anagram/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Arrays & Hashing",
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/is-anagram/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/is-anagram/question?list=neetcode150"
    }
  },
  {
    "title": "Valid Palindrome",
    "difficulty": "Easy",
    "leetcodeNumber": 125,
    "leetcodeUrl": "https://leetcode.com/problems/valid-palindrome/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Two Pointers",
      "neetcode150": "Two Pointers"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/is-palindrome/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/is-palindrome/question?list=neetcode150"
    }
  },
  {
    "title": "Valid Parentheses",
    "difficulty": "Easy",
    "leetcodeNumber": 20,
    "leetcodeUrl": "https://leetcode.com/problems/valid-parentheses/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Stack",
      "neetcode150": "Stack"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/validate-parentheses/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/validate-parentheses/question?list=neetcode150"
    }
  },
  {
    "title": "Valid Parenthesis String",
    "difficulty": "Medium",
    "leetcodeNumber": 678,
    "leetcodeUrl": "https://leetcode.com/problems/valid-parenthesis-string/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Greedy"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/valid-parenthesis-string/question?list=neetcode150"
    }
  },
  {
    "title": "Valid Sudoku",
    "difficulty": "Medium",
    "leetcodeNumber": 36,
    "leetcodeUrl": "https://leetcode.com/problems/valid-sudoku/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Arrays & Hashing"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/valid-sudoku/question?list=neetcode150"
    }
  },
  {
    "title": "Validate Binary Search Tree",
    "difficulty": "Medium",
    "leetcodeNumber": 98,
    "leetcodeUrl": "https://leetcode.com/problems/validate-binary-search-tree/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Trees",
      "neetcode150": "Trees"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/valid-binary-search-tree/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/valid-binary-search-tree/question?list=neetcode150"
    }
  },
  {
    "title": "Walls And Gates",
    "difficulty": "Medium",
    "leetcodeNumber": 286,
    "leetcodeUrl": "https://leetcode.com/problems/walls-and-gates/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/islands-and-treasure/question?list=neetcode150"
    }
  },
  {
    "title": "Word Break",
    "difficulty": "Medium",
    "leetcodeNumber": 139,
    "leetcodeUrl": "https://leetcode.com/problems/word-break/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "1-D Dynamic Programming",
      "neetcode150": "1-D Dynamic Programming"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/word-break/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/word-break/question?list=neetcode150"
    }
  },
  {
    "title": "Word Ladder",
    "difficulty": "Hard",
    "leetcodeNumber": 127,
    "leetcodeUrl": "https://leetcode.com/problems/word-ladder/",
    "tracks": [
      "neetcode150"
    ],
    "categories": {
      "neetcode150": "Graphs"
    },
    "neetcodeUrls": {
      "neetcode150": "https://neetcode.io/problems/word-ladder/question?list=neetcode150"
    }
  },
  {
    "title": "Word Search",
    "difficulty": "Medium",
    "leetcodeNumber": 79,
    "leetcodeUrl": "https://leetcode.com/problems/word-search/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Backtracking",
      "neetcode150": "Backtracking"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/search-for-word/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/search-for-word/question?list=neetcode150"
    }
  },
  {
    "title": "Word Search II",
    "difficulty": "Hard",
    "leetcodeNumber": 212,
    "leetcodeUrl": "https://leetcode.com/problems/word-search-ii/",
    "tracks": [
      "blind75",
      "neetcode150"
    ],
    "categories": {
      "blind75": "Tries",
      "neetcode150": "Tries"
    },
    "neetcodeUrls": {
      "blind75": "https://neetcode.io/problems/search-for-word-ii/question?list=blind75",
      "neetcode150": "https://neetcode.io/problems/search-for-word-ii/question?list=neetcode150"
    }
  }
] as OfficialRoadmapEntry[];
