type TechniqueSeed = {
  id: string;
  title: string;
  titleCn: string;
  sourceTrack: "essential-technique" | "data-structure";
  aliases: string[];
  whenToThink: string;
  whenToThinkCn: string;
  coreIdea: string;
  coreIdeaCn: string;
  starterQuestion: string;
  starterQuestionCn: string;
  commonTrap: string;
  commonTrapCn: string;
  quickTips: string[];
  quickTipsCn: string[];
  coachMoves: string[];
  signalMatchers: string[];
};

export const techniqueLibrary = [
  {
    id: "hash-map",
    title: "Hash Map and Set",
    titleCn: "哈希表与哈希集合",
    sourceTrack: "data-structure",
    aliases: ["hashing", "frequency map", "set lookup"],
    whenToThink:
      "Use this when fast membership, complement lookup, or frequency counting can replace repeated scans.",
    whenToThinkCn: "当你需要快速判断是否存在、查找配对值，或统计出现次数，而不想反复扫描数组时使用。",
    coreIdea:
      "Trade extra memory for constant-time lookup so each element can answer a question about what you have already seen.",
    coreIdeaCn: "用额外的空间换取 O(1) 查找速度，让每个元素都能立刻回答“之前是否见过”这个问题。",
    starterQuestion:
      "What should the map or set remember so the next lookup becomes immediate?",
    starterQuestionCn: "这个哈希表或集合应该记住什么信息，才能让下一次查找变成 O(1)？",
    commonTrap:
      "Using hashing without deciding whether the structure should store existence, counts, or indices.",
    commonTrapCn: "用了哈希表却没想清楚：到底要存“是否存在”，还是“出现次数”，还是“下标位置”。",
    quickTips: [
      "Sets answer have-I-seen-this questions.",
      "Maps answer how-many or where-did-I-see-it questions.",
      "Write the key and stored value in words before coding."
    ],
    quickTipsCn: [
      "Set 回答“我见过这个吗”。",
      "Map 回答“出现了几次”或“在哪见过”。",
      "写代码前，先用一句话说清楚 key 和 value 各是什么。"
    ],
    coachMoves: [
      "Ask whether the learner needs membership, counts, or indices.",
      "Use this when duplicate, anagram, complement, or lookup language appears.",
      "Contrast one-pass hashing with sorting or nested loops."
    ],
    signalMatchers: ["duplicate", "anagram", "complement", "lookup", "set", "frequency", "hash"]
  },
  {
    id: "stack",
    title: "Stack Invariant",
    titleCn: "栈的不变量",
    sourceTrack: "data-structure",
    aliases: ["stack", "parentheses", "latest unfinished item"],
    whenToThink:
      "Use this when the newest unresolved item should be matched, undone, or resolved before older ones.",
    whenToThinkCn: "当“最新出现、还没处理完”的元素需要被优先匹配、撤销或结算时使用。",
    coreIdea:
      "Let the stack store unfinished work in the exact order it must be resolved later.",
    coreIdeaCn: "让栈按照之后必须被处理的顺序，存放那些“还没做完的事”。",
    starterQuestion:
      "What belongs on the stack, and what event should pop it back off?",
    starterQuestionCn: "什么东西该进栈？什么事件发生时应该把它弹出来？",
    commonTrap:
      "Pushing values without stating the invariant that makes a pop meaningful.",
    commonTrapCn: "只顾着往栈里塞值，却没说清楚“弹出”这个动作到底意味着什么。",
    quickTips: [
      "Matching pairs often want a plain stack.",
      "Next greater and similar problems often want a monotonic stack.",
      "Write the push and pop triggers before the loop."
    ],
    quickTipsCn: [
      "配对匹配类问题通常用普通栈。",
      "“下一个更大元素”这类问题通常用单调栈。",
      "写循环之前，先想清楚入栈和出栈的触发条件。"
    ],
    coachMoves: [
      "Ask the learner to name the stack invariant.",
      "Use it for matching, undo, and next-greater style problems.",
      "Contrast generic stack usage with monotonic-stack specialization."
    ],
    signalMatchers: ["parentheses", "stack", "warmer", "next greater", "fleet", "undo", "latest"]
  },
  {
    id: "intervals",
    title: "Interval Boundary Thinking",
    titleCn: "区间边界思维",
    sourceTrack: "essential-technique",
    aliases: ["intervals", "merge intervals", "line sweep lite"],
    whenToThink:
      "Use this when ranges overlap, merge, insert, or compete based on their boundaries.",
    whenToThinkCn: "当多个区间会重叠、合并、插入，或者根据边界互相竞争时使用。",
    coreIdea:
      "Sort or scan by one boundary so each local overlap decision only depends on the current active range.",
    coreIdeaCn: "按某一个边界排序或扫描，让每一步的重叠判断只依赖“当前活跃区间”这一个状态。",
    starterQuestion:
      "Which boundary should control the order, and what state represents the current active interval?",
    starterQuestionCn: "该按哪个边界排序？“当前活跃区间”这个状态该怎么表示？",
    commonTrap:
      "Comparing every interval with every other interval instead of turning the problem into ordered local decisions.",
    commonTrapCn: "把问题写成了每个区间和所有区间两两比较，而不是排序后变成一串局部决策。",
    quickTips: [
      "Sort by start when merging or inserting.",
      "Earlier ending boundaries are often safer when intervals conflict.",
      "Think in phases: before overlap, during overlap, after overlap."
    ],
    quickTipsCn: [
      "合并或插入区间时，通常按起点排序。",
      "区间冲突时，结束更早的那个往往更“安全”。",
      "把过程拆成三个阶段来想：重叠前、重叠中、重叠后。"
    ],
    coachMoves: [
      "Ask what the active interval state should be.",
      "Use it when overlap, merge, insert, erase, or schedule language appears.",
      "Contrast merge-style interval handling with greedy removal logic."
    ],
    signalMatchers: ["interval", "overlap", "merge", "insert interval", "erase", "meeting", "range"]
  },
  {
    id: "framework-thinking",
    title: "Framework Thinking",
    titleCn: "框架思维",
    sourceTrack: "essential-technique",
    aliases: ["algorithm summary", "framework thinking"],
    whenToThink:
      "Use this before committing to a pattern when the problem still feels blurry.",
    whenToThinkCn: "当题目看起来还很模糊、你还不确定该用哪种套路时，先用这个理清思路。",
    coreIdea:
      "Reduce the prompt to what is being traversed, what state is being maintained, and what repeated work can be avoided.",
    coreIdeaCn: "把题目拆解成三个问题：在遍历什么？维护着什么状态？哪些重复计算可以避免？",
    starterQuestion:
      "Is this really a traversal problem, a range-maintenance problem, or a repeated-state problem?",
    starterQuestionCn: "这题本质上是遍历问题、区间维护问题，还是状态重复的问题？",
    commonTrap:
      "Jumping into syntax before naming the structure being explored and the information that must persist.",
    commonTrapCn: "还没想清楚在探索什么结构、需要保留什么信息，就直接开始写代码。",
    quickTips: [
      "Name the object you are traversing first: array, graph, tree, state space, or answer space.",
      "Ask what would be recomputed if you used pure brute force.",
      "If a problem feels messy, rewrite it as a smaller decision process."
    ],
    quickTipsCn: [
      "先说清楚在遍历什么：数组、图、树、状态空间，还是答案空间。",
      "问自己：如果用暴力法，哪些计算会被重复做？",
      "题目感觉很乱时，试着把它改写成一连串更小的决策。"
    ],
    coachMoves: [
      "Ask the learner to classify the problem family before discussing code.",
      "Use this when the user is guessing patterns with no clear evidence.",
      "Steer attention toward traversal, state, and repeated work."
    ],
    signalMatchers: ["prompt", "array", "graph", "tree", "search", "state"]
  },
  {
    id: "recursion-perspective",
    title: "Recursion Perspective",
    titleCn: "递归的视角",
    sourceTrack: "essential-technique",
    aliases: ["recursion", "recursive thinking"],
    whenToThink:
      "Use this when the solution naturally repeats the same reasoning on smaller structure.",
    whenToThinkCn: "当解法本质上是在更小的结构上重复同一套推理时使用。",
    coreIdea:
      "Pick one recursive promise and stay consistent about what each call returns or what context each call receives.",
    coreIdeaCn: "定好一个“递归承诺”：每次调用到底返回什么、接收什么上下文，并且从头到尾保持一致。",
    starterQuestion:
      "What exactly should one recursive call be responsible for?",
    starterQuestionCn: "一次递归调用，究竟应该只负责做哪件事？",
    commonTrap:
      "Mixing traversal-style side effects with divide-and-conquer return values without separating responsibilities.",
    commonTrapCn: "把“遍历型”的副作用和“分治型”的返回值混在一起，没有把职责分开。",
    quickTips: [
      "Choose between traversal thinking and decomposition thinking before writing code.",
      "Say the recursive contract in plain English.",
      "Base case first, then child calls, then combine or restore."
    ],
    quickTipsCn: [
      "写代码前先选：这是“遍历型”递归，还是“分解型”递归？",
      "用一句大白话说清楚这次调用的“契约”。",
      "顺序是：先写边界条件，再递归子问题，最后合并或恢复现场。"
    ],
    coachMoves: [
      "Use when the learner is hand-waving recursion.",
      "Compare traversal recursion with decomposition recursion.",
      "Force the learner to state what a call returns."
    ],
    signalMatchers: ["tree", "recursive", "subtree", "linked list", "dfs", "backtrack"]
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    titleCn: "双指针",
    sourceTrack: "essential-technique",
    aliases: ["fast slow pointers", "left right pointers"],
    whenToThink:
      "Use this when indices can move relative to each other based on ordering, symmetry, or pair/triplet conditions.",
    whenToThinkCn: "当下标可以根据排序、对称性，或者“配对/三元组”条件相对移动时使用。",
    coreIdea:
      "Keep two positions whose movement rule is driven by a direct comparison or target gap.",
    coreIdeaCn: "维护两个位置，它们的移动规则由一次直接比较或与目标值的差距来决定。",
    starterQuestion:
      "What condition tells me which pointer should move next?",
    starterQuestionCn: "什么条件能告诉我，下一步该移动哪个指针？",
    commonTrap:
      "Confusing a generic left-right scan with sliding window when no validity constraint is being maintained.",
    commonTrapCn: "把普通的左右扫描误认为滑动窗口，其实这里并没有在维护一个“合法性”约束。",
    quickTips: [
      "Sorted input is a strong signal.",
      "Write the pointer movement rule before coding.",
      "Check whether both pointers move in the same direction or from opposite ends."
    ],
    quickTipsCn: [
      "有序数组是很强的信号。",
      "写代码前先想清楚指针的移动规则。",
      "确认两个指针是同向移动，还是从两端相向而行。"
    ],
    coachMoves: [
      "Contrast it with sliding window.",
      "Ask the learner to justify how pointer movement changes information.",
      "Use it for arrays and linked lists when structure is linear."
    ],
    signalMatchers: [
      "sorted",
      "pair",
      "triplet",
      "palindrome",
      "linked list",
      "cycle",
      "remove duplicate"
    ]
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    titleCn: "滑动窗口",
    sourceTrack: "essential-technique",
    aliases: ["window", "expand and shrink"],
    whenToThink:
      "Use this for contiguous ranges where the window expands and sometimes shrinks while preserving a rule.",
    whenToThinkCn: "当处理连续区间，窗口需要一边扩大一边（在打破规则时）收缩时使用。",
    coreIdea:
      "Track a valid interval and adjust its boundaries without restarting from scratch.",
    coreIdeaCn: "维护一个“合法”的区间，只调整它的左右边界，而不是每次都从头重新计算。",
    starterQuestion:
      "What must stay true inside the current window?",
    starterQuestionCn: "当前窗口内必须始终满足什么条件？",
    commonTrap:
      "Treating every substring problem as sliding window even when there is no reusable validity condition.",
    commonTrapCn: "看到子串问题就套滑动窗口，却没有一个可以复用的“合法性”条件。",
    quickTips: [
      "Longest or shortest subarray language is a strong clue.",
      "Decide what state you need inside the window: count, sum, frequency, or set membership.",
      "Ask when the left edge should move."
    ],
    quickTipsCn: [
      "“最长/最短子数组”这类措辞是很强的信号。",
      "想清楚窗口内需要维护什么状态：计数、总和、频次，还是集合成员关系。",
      "问自己：左边界什么时候该移动？"
    ],
    coachMoves: [
      "Ask for the invariant inside the window.",
      "Use it when the prompt says contiguous and the work can be reused.",
      "Push the learner to name the shrink condition."
    ],
    signalMatchers: [
      "substring",
      "subarray",
      "contiguous",
      "longest",
      "shortest",
      "window",
      "at most",
      "at least"
    ]
  },
  {
    id: "binary-search",
    title: "Binary Search",
    titleCn: "二分查找",
    sourceTrack: "essential-technique",
    aliases: ["search interval", "binary search on answer"],
    whenToThink:
      "Use this when the input or answer space has a monotonic property that lets you discard half the candidates.",
    whenToThinkCn: "当输入或答案空间具有单调性，可以每次排除一半候选时使用。",
    coreIdea:
      "Maintain a search interval and move left or right based on a feasibility or ordering check.",
    coreIdeaCn: "维护一个搜索区间，根据一次可行性或大小判断，决定向左还是向右收缩。",
    starterQuestion:
      "What monotonic property lets me throw away half the space?",
    starterQuestionCn: "是什么单调性质，让我能每次丢掉一半的搜索空间？",
    commonTrap:
      "Only looking for sorted arrays and missing answer-space binary search.",
    commonTrapCn: "只想到“数组要有序”，却没意识到二分也能直接搜索“答案空间”。",
    quickTips: [
      "Separate the search space from the check function.",
      "Pick a loop invariant before choosing <= or <.",
      "For answer search, define what counts as feasible."
    ],
    quickTipsCn: [
      "把“搜索空间”和“判断函数”分开来想。",
      "选 <= 还是 < 之前，先定好循环不变量。",
      "如果是在答案空间上二分，先定义清楚“可行”是什么意思。"
    ],
    coachMoves: [
      "Ask whether bigger answers become easier or harder.",
      "Contrast direct search with search on answer.",
      "Use it when the user says sorted, threshold, capacity, minimum feasible, or maximum feasible."
    ],
    signalMatchers: [
      "sorted",
      "rotated",
      "minimum feasible",
      "maximum feasible",
      "capacity",
      "threshold",
      "search",
      "koko"
    ]
  },
  {
    id: "bfs",
    title: "Breadth-First Search",
    titleCn: "广度优先搜索",
    sourceTrack: "essential-technique",
    aliases: ["level order", "shortest path in unweighted graph"],
    whenToThink:
      "Use this when a problem unfolds level by level or asks for the shortest path in an unweighted graph.",
    whenToThinkCn: "当问题是一层一层展开的，或者要求无权图中的最短路径时使用。",
    coreIdea:
      "Expand all states at the current depth before moving deeper.",
    coreIdeaCn: "把当前这一层的所有状态都扩展完，再往下一层走。",
    starterQuestion:
      "Does this problem naturally care about levels or minimum steps?",
    starterQuestionCn: "这道题是不是天然关心“第几层”或者“最少几步”？",
    commonTrap:
      "Using DFS when the prompt is really about levels, distance, or earliest reachability.",
    commonTrapCn: "题目其实关心层数、距离或最早可达时间，却用了 DFS 来做。",
    quickTips: [
      "Queue plus visited set is the default skeleton.",
      "Level-order tree traversal is BFS even if recursion feels tempting.",
      "Track what each layer means before coding."
    ],
    quickTipsCn: [
      "队列 + 访问集合是最基本的骨架。",
      "树的层序遍历本质就是 BFS，即使写成递归也一样。",
      "写代码前先想清楚每一层代表什么含义。"
    ],
    coachMoves: [
      "Ask what one BFS layer represents.",
      "Use it when the prompt mentions level, minimum moves, or shortest path.",
      "Push the learner to define visited state clearly."
    ],
    signalMatchers: [
      "level order",
      "minimum steps",
      "shortest path",
      "unweighted",
      "open lock",
      "word ladder",
      "nearest"
    ]
  },
  {
    id: "dfs-backtracking",
    title: "DFS and Backtracking",
    titleCn: "DFS 与回溯",
    sourceTrack: "essential-technique",
    aliases: ["decision tree", "backtrack"],
    whenToThink:
      "Use this when you need to explore choices, paths, permutations, subsets, or constraint-based search.",
    whenToThinkCn: "当需要穷举选择、路径、排列、子集，或者带约束的搜索时使用。",
    coreIdea:
      "Make a choice, recurse, then undo the choice so you can explore the next branch cleanly.",
    coreIdeaCn: "做一个选择，递归下去，再撤销这个选择，这样才能干净地探索下一个分支。",
    starterQuestion:
      "What state changes when I go deeper, and what must be restored when I return?",
    starterQuestionCn: "往下递归时哪些状态会变化？返回时又必须恢复哪些状态？",
    commonTrap:
      "Writing recursion without naming the path, remaining choices, termination condition, and undo step.",
    commonTrapCn: "写递归时没有说清楚：路径是什么、剩余选择是什么、终止条件是什么、怎么撤销选择。",
    quickTips: [
      "A path container plus choose / recurse / unchoose is a strong default.",
      "Decide whether elements can be reused before coding.",
      "Prune early when a branch can no longer succeed."
    ],
    quickTipsCn: [
      "“路径容器 + 选择 / 递归 / 撤销选择”是最通用的骨架。",
      "写代码前先想清楚元素能不能重复使用。",
      "一旦某个分支注定不可能成功，就尽早剪枝。"
    ],
    coachMoves: [
      "Ask the learner to describe the decision tree.",
      "Use it for subset, permutation, combination, and constraint search problems.",
      "Contrast traversal thinking with DP when repeated states appear."
    ],
    signalMatchers: [
      "permutation",
      "combination",
      "subset",
      "n queens",
      "all possible",
      "restore",
      "path",
      "choices"
    ]
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    titleCn: "动态规划",
    sourceTrack: "essential-technique",
    aliases: ["memoization", "state transition"],
    whenToThink:
      "Use this when smaller subproblems overlap and the current answer depends on earlier or smaller states.",
    whenToThinkCn: "当更小的子问题会被重复用到，且当前答案依赖于更早或更小的状态时使用。",
    coreIdea:
      "Define state, transition, and base case so repeated work becomes reusable structure.",
    coreIdeaCn: "定义好状态、转移方程和边界条件，让重复的计算变成可以复用的结构。",
    starterQuestion:
      "What is the smallest state that fully captures the future decision?",
    starterQuestionCn: "能完整概括“未来决策所需信息”的最小状态是什么？",
    commonTrap:
      "Jumping into tables before clearly naming the state and transition.",
    commonTrapCn: "还没想清楚状态和转移方程，就直接开始写 DP 表。",
    quickTips: [
      "Write the state in plain English first.",
      "Try recursion plus memo before tabulation if the structure is fuzzy.",
      "Look for repeated subproblems and optimal substructure."
    ],
    quickTipsCn: [
      "先用一句话讲清楚状态的含义。",
      "如果思路还模糊，先写“递归 + 记忆化”，再翻译成递推。",
      "留意是否存在重复子问题和最优子结构。"
    ],
    coachMoves: [
      "Ask for state, choice, and base case explicitly.",
      "Use it when the learner senses repetition but cannot structure it.",
      "Contrast memoization with brute force and greedy."
    ],
    signalMatchers: [
      "minimum cost",
      "maximum profit",
      "ways",
      "dp",
      "memo",
      "overlapping",
      "coins",
      "rob"
    ]
  },
  {
    id: "greedy",
    title: "Greedy",
    titleCn: "贪心",
    sourceTrack: "essential-technique",
    aliases: ["locally optimal"],
    whenToThink:
      "Use this when a local decision can be justified as safely preserving a globally optimal path.",
    whenToThinkCn: "当一次局部决策可以被证明“不会破坏全局最优”时使用。",
    coreIdea:
      "Commit to the strongest local move that never harms the best final answer.",
    coreIdeaCn: "立刻做出当前看起来最强的局部选择，并且这个选择永远不会伤害最终的最优解。",
    starterQuestion:
      "Why is this local decision safe to make immediately?",
    starterQuestionCn: "为什么这个局部决策可以立刻做，而且是安全的？",
    commonTrap:
      "Calling an idea greedy just because it feels intuitive, without an exchange or safety argument.",
    commonTrapCn: "只因为某个想法“感觉很直觉”就叫它贪心，却没有交换论证或安全性证明。",
    quickTips: [
      "Look for interval scheduling, one-pass commitment, or sort-by-key structure.",
      "State the invariant the local choice preserves.",
      "If you cannot explain safety, test DP or backtracking instead."
    ],
    quickTipsCn: [
      "留意区间调度、一次遍历定案，或按某个 key 排序的结构。",
      "说清楚这次局部选择维护的是什么不变量。",
      "如果说不清楚为什么安全，就换成 DP 或回溯试试。"
    ],
    coachMoves: [
      "Ask the learner to justify safety, not just convenience.",
      "Use it when the best local move appears repeatedly.",
      "Contrast with DP when future consequences really matter."
    ],
    signalMatchers: [
      "interval",
      "jump",
      "minimum arrows",
      "can reach",
      "schedule",
      "erase overlap"
    ]
  },
  {
    id: "divide-conquer",
    title: "Divide and Conquer",
    titleCn: "分治",
    sourceTrack: "essential-technique",
    aliases: ["problem decomposition"],
    whenToThink:
      "Use this when the problem becomes simpler after splitting it into smaller independent subproblems and merging the results.",
    whenToThinkCn: "当把问题拆成更小的独立子问题、再合并结果后，问题会明显变简单时使用。",
    coreIdea:
      "Break the task apart, solve subproblems recursively, and combine their answers in a meaningful merge step.",
    coreIdeaCn: "把任务拆开，递归求解每个子问题，再用一个有意义的合并步骤把结果拼起来。",
    starterQuestion:
      "What natural split gives me smaller versions of the same problem?",
    starterQuestionCn: "什么样的拆分方式，能得到规模更小、但形式相同的子问题？",
    commonTrap:
      "Using recursion without a clear merge or decomposition benefit.",
    commonTrapCn: "用了递归，却说不清楚拆分或合并到底带来了什么好处。",
    quickTips: [
      "Merge sort and tree aggregation are classic anchors.",
      "Be explicit about the combine cost.",
      "Check whether the split creates repeated subproblems, which may push you toward DP."
    ],
    quickTipsCn: [
      "归并排序和树的聚合是最经典的参照例子。",
      "明确说出“合并”这一步的代价是多少。",
      "检查拆分后是否产生了重复子问题——如果有，可能更适合用 DP。"
    ],
    coachMoves: [
      "Ask what each subproblem returns.",
      "Use it when the answer is a merge of left and right halves or subtrees.",
      "Contrast it with traversal recursion."
    ],
    signalMatchers: [
      "merge",
      "subtree",
      "left half",
      "right half",
      "split",
      "combine"
    ]
  },
  {
    id: "binary-tree-recursion",
    title: "Binary Tree Recursion",
    titleCn: "二叉树递归",
    sourceTrack: "essential-technique",
    aliases: ["tree dp", "tree traversal"],
    whenToThink:
      "Use this when each node's answer depends on answers from its children or on context flowing from the root.",
    whenToThinkCn: "当每个节点的答案依赖于子节点的答案，或者依赖从根节点传下来的上下文时使用。",
    coreIdea:
      "Think in terms of what the subtree returns upward or what information the parent passes downward.",
    coreIdeaCn: "思考子树向上返回什么信息，或者父节点向下传递什么上下文。",
    starterQuestion:
      "Do I need information flowing upward, downward, or both?",
    starterQuestionCn: "我需要的信息是自底向上传递、自顶向下传递，还是两者都要？",
    commonTrap:
      "Mixing subtree return values with path-side effects without separating responsibilities.",
    commonTrapCn: "把子树的返回值和路径上的副作用混在一起，没有把职责分清楚。",
    quickTips: [
      "Postorder often fits subtree aggregation.",
      "Preorder often fits passing context downward.",
      "State what one recursive call promises to return."
    ],
    quickTipsCn: [
      "后序遍历通常适合“子树信息汇总”。",
      "前序遍历通常适合“向下传递上下文”。",
      "说清楚一次递归调用承诺返回什么。"
    ],
    coachMoves: [
      "Use it when the prompt is about tree structure rather than just graph search.",
      "Ask the learner to define the subtree contract.",
      "Connect it back to recursion perspective."
    ],
    signalMatchers: [
      "binary tree",
      "subtree",
      "lowest common ancestor",
      "path sum",
      "diameter",
      "balanced tree"
    ]
  },
  {
    id: "prefix-sum",
    title: "Prefix Sum",
    titleCn: "前缀和",
    sourceTrack: "data-structure",
    aliases: ["range sum", "preSum"],
    whenToThink:
      "Use this when the array stays fixed and you need many fast range-sum or cumulative queries.",
    whenToThinkCn: "当数组本身不会变化，但需要频繁做区间求和或累计查询时使用。",
    coreIdea:
      "Precompute cumulative totals so each range answer becomes a subtraction instead of a loop.",
    coreIdeaCn: "提前算好累计和，让每一次区间查询都变成一次减法，而不是一次循环。",
    starterQuestion:
      "Can I precompute something once so every interval query becomes O(1)?",
    starterQuestionCn: "能不能提前算好一次，让之后每次区间查询都变成 O(1)？",
    commonTrap:
      "Using prefix sum when the underlying array changes frequently or when the operation has no clean inverse.",
    commonTrapCn: "在数组会频繁变化，或者操作没有干净的逆运算时，还硬用前缀和。",
    quickTips: [
      "Immutable range query language is a strong clue.",
      "Think of prefix sum as paying once up front to answer many queries cheaply.",
      "It extends beyond sums if the operation has an inverse."
    ],
    quickTipsCn: [
      "“数组不变、多次区间查询”是很强的信号。",
      "把前缀和想成“提前付一次代价，之后查询就很便宜”。",
      "只要运算有逆运算，前缀和思路就不只局限于求和。"
    ],
    coachMoves: [
      "Use it for repeated interval queries.",
      "Contrast it with sliding window: one is offline precompute, the other is online maintenance.",
      "Warn when updates break the precomputation."
    ],
    signalMatchers: [
      "range sum",
      "many queries",
      "immutable",
      "submatrix sum",
      "interval sum",
      "prefix"
    ]
  },
  {
    id: "difference-array",
    title: "Difference Array",
    titleCn: "差分数组",
    sourceTrack: "data-structure",
    aliases: ["range update", "diff array"],
    whenToThink:
      "Use this when many operations add or subtract across index intervals and you only need the final array or totals later.",
    whenToThinkCn: "当有很多次区间加减操作，而你只需要最后的结果时使用。",
    coreIdea:
      "Record changes at the boundaries, then rebuild the final values with a prefix sweep.",
    coreIdeaCn: "只在区间的起点和终点记录变化量，最后用一次前缀扫描还原出真实数组。",
    starterQuestion:
      "Can I mark where each range update starts and ends instead of touching every element?",
    starterQuestionCn: "能不能只标记每次区间更新的起点和终点，而不用逐个元素去改？",
    commonTrap:
      "Applying updates element by element even though the work only matters after all operations are done.",
    commonTrapCn: "明明只关心所有操作结束后的最终结果，却还是逐个元素地去更新。",
    quickTips: [
      "Range addition and bookings problems are classic signals.",
      "Difference array pairs naturally with prefix reconstruction.",
      "It is about batch updates, not interactive queries."
    ],
    quickTipsCn: [
      "区间加法、预订类问题是经典信号。",
      "差分数组天然要配合前缀和来还原结果。",
      "它解决的是“批量更新”，不是“交互式查询”。"
    ],
    coachMoves: [
      "Use it when many interval updates appear.",
      "Contrast it with prefix sum: updates first, reconstruction later.",
      "Ask whether the learner needs intermediate states or only the final one."
    ],
    signalMatchers: [
      "range addition",
      "bookings",
      "car pooling",
      "increment",
      "decrement",
      "batch update"
    ]
  },
  {
    id: "monotonic-stack",
    title: "Monotonic Stack",
    titleCn: "单调栈",
    sourceTrack: "data-structure",
    aliases: ["next greater element", "previous smaller"],
    whenToThink:
      "Use this when each element wants the next or previous larger or smaller candidate while preserving order.",
    whenToThinkCn: "当每个元素都想找到“下一个/上一个更大或更小”的候选，同时要保持顺序时使用。",
    coreIdea:
      "Keep a stack in monotonic order so dominated candidates disappear as soon as a stronger one arrives.",
    coreIdeaCn: "维护一个单调有序的栈，一旦出现更强的候选，被它“压制”的旧候选就立刻出局。",
    starterQuestion:
      "What candidates can never matter again once this new value appears?",
    starterQuestionCn: "一旦这个新值出现，哪些旧的候选就再也不可能有用了？",
    commonTrap:
      "Treating these as nested-loop comparison problems instead of removing dominated candidates early.",
    commonTrapCn: "把这类问题写成了两层循环互相比较，而不是及时淘汰被压制的候选。",
    quickTips: [
      "Next greater, daily temperatures, and histogram-style problems are strong clues.",
      "Decide whether you need increasing or decreasing order before coding.",
      "Indices are often more useful than raw values."
    ],
    quickTipsCn: [
      "“下一个更大元素”“每日温度”“柱状图”这类题目是强信号。",
      "写代码前先确定要维护递增栈还是递减栈。",
      "栈里存下标，往往比直接存数值更好用。"
    ],
    coachMoves: [
      "Use it when the prompt asks for nearest greater or smaller relationships.",
      "Ask what the stack invariant is.",
      "Mention circular-array handling when the prompt wraps around."
    ],
    signalMatchers: [
      "next greater",
      "previous smaller",
      "daily temperatures",
      "histogram",
      "span",
      "circular array"
    ]
  },
  {
    id: "monotonic-queue",
    title: "Monotonic Queue",
    titleCn: "单调队列",
    sourceTrack: "data-structure",
    aliases: ["sliding window maximum", "deque optimization"],
    whenToThink:
      "Use this when a sliding window repeatedly asks for the max or min while elements enter and leave.",
    whenToThinkCn: "当滑动窗口需要反复查询最大值或最小值，同时元素不断进出窗口时使用。",
    coreIdea:
      "Maintain a deque of useful candidates so the current window's extreme stays available in constant time.",
    coreIdeaCn: "维护一个只存“有用候选”的双端队列，让窗口的极值随时都能 O(1) 取到。",
    starterQuestion:
      "How can I keep the window's best candidate without rescanning the whole window?",
    starterQuestionCn: "怎样才能不用每次重新扫描整个窗口，就能拿到当前最优候选？",
    commonTrap:
      "Knowing it is a sliding window problem but still recomputing the max or min from scratch each step.",
    commonTrapCn: "明明知道是滑动窗口问题，却还是每一步都重新计算一次最大/最小值。",
    quickTips: [
      "Sliding window maximum is the signature problem.",
      "Expired indices leave from the front, dominated ones leave from the back.",
      "This is a data structure upgrade on top of sliding window."
    ],
    quickTipsCn: [
      "“滑动窗口最大值”是这个技巧的代表题。",
      "过期的下标从队首移除，被压制的候选从队尾移除。",
      "可以把它理解成滑动窗口的“数据结构升级版”。"
    ],
    coachMoves: [
      "Use it when sliding window needs a fast extreme value.",
      "Contrast it with heaps when strict window expiration matters.",
      "Ask what gets popped from each side of the deque."
    ],
    signalMatchers: [
      "sliding window maximum",
      "sliding window minimum",
      "deque",
      "window max",
      "window min"
    ]
  },
  {
    id: "heap",
    title: "Heap / Priority Queue",
    titleCn: "堆 / 优先队列",
    sourceTrack: "data-structure",
    aliases: ["priority queue", "top k"],
    whenToThink:
      "Use this when you repeatedly need the current smallest or largest item, especially for top-k, streaming, or best-first extraction tasks.",
    whenToThinkCn: "当需要反复取出当前最小或最大的元素时使用，尤其是 top-k、流式数据，或“每次取最优”的场景。",
    coreIdea:
      "Maintain a structure where each push or pop keeps the highest-priority candidate easy to access.",
    coreIdeaCn: "维护一种结构，让每次插入或弹出后，优先级最高的候选始终容易取到。",
    starterQuestion:
      "Do I need the best item over and over, or just once at the end?",
    starterQuestionCn: "我是需要反复取“当前最优”，还是最后只取一次就够了？",
    commonTrap:
      "Sorting everything up front when the problem only needs the next best candidate repeatedly.",
    commonTrapCn: "题目只需要反复拿“下一个最优”，却一开始就把所有数据排好序。",
    quickTips: [
      "Top-k language is a strong clue.",
      "Decide whether a min-heap or max-heap makes the invariant easier.",
      "If only k items matter, cap the heap size."
    ],
    quickTipsCn: [
      "“top k”这类措辞是很强的信号。",
      "想清楚用小顶堆还是大顶堆，能让不变量更简单。",
      "如果只关心 k 个元素，就把堆的大小限制在 k。"
    ],
    coachMoves: [
      "Use it for repeated best-candidate access.",
      "Contrast it with monotonic queue when order expiration matters.",
      "Ask whether the full ordering is necessary."
    ],
    signalMatchers: [
      "top k",
      "kth largest",
      "priority",
      "stream",
      "merge k",
      "smallest pair"
    ]
  },
  {
    id: "complexity",
    title: "Complexity Checks",
    titleCn: "复杂度检查",
    sourceTrack: "essential-technique",
    aliases: ["time complexity", "space complexity"],
    whenToThink:
      "Use this before and after coding to catch solutions that are correct but too expensive.",
    whenToThinkCn: "在写代码前后都用一下，用来发现那些正确但太慢的解法。",
    coreIdea:
      "Estimate the dominant cost early so you do not over-invest in a doomed approach.",
    coreIdeaCn: "提前估算出主要开销，避免在注定不可行的思路上投入太多时间。",
    starterQuestion:
      "If the input doubles, which part of this approach grows the fastest?",
    starterQuestionCn: "如果输入规模翻倍，这个方案里哪一部分的开销增长最快？",
    commonTrap:
      "Only counting visible loops and missing sorting, recursion branching, or hidden data structure costs.",
    commonTrapCn: "只数了看得见的循环，却漏算了排序、递归分支，或数据结构本身隐藏的开销。",
    quickTips: [
      "Use the constraints to eliminate whole approach families.",
      "Name the expensive operation, not just the outer loop.",
      "Check auxiliary space separately from input storage."
    ],
    quickTipsCn: [
      "用数据范围直接排除整类不可行的思路。",
      "说清楚真正“贵”的操作是什么，不要只看外层循环。",
      "把额外空间和输入本身占用的空间分开计算。"
    ],
    coachMoves: [
      "Use it when the learner's idea is plausible but too slow.",
      "Connect constraints to acceptable complexity bands.",
      "Force comparison between brute force and optimized paths."
    ],
    signalMatchers: [
      "constraint",
      "10^5",
      "10^4",
      "time limit",
      "optimize",
      "efficient"
    ]
  },
  {
    id: "union-find",
    title: "Union-Find",
    titleCn: "并查集",
    sourceTrack: "data-structure",
    aliases: ["disjoint set", "connected components"],
    whenToThink:
      "Use this when you repeatedly need to know whether two elements belong to the same group, and groups only ever merge.",
    whenToThinkCn: "当需要反复判断两个元素是否属于同一组，而分组只会合并、不会拆分时使用。",
    coreIdea:
      "Each element points toward a representative; union merges two representatives, find follows pointers up to the root.",
    coreIdeaCn: "每个元素指向一个代表；合并操作把两个代表接到一起，查找操作沿着指针一路找到根。",
    starterQuestion:
      "Do I only ever need to merge groups and check membership, never split them?",
    starterQuestionCn: "我是不是只需要合并分组、检查归属，而完全不需要拆分？",
    commonTrap:
      "Forgetting path compression or union by rank, so find degrades toward O(n) on a long chain.",
    commonTrapCn: "忘记做路径压缩或按秩合并，导致链条变长后 find 退化成接近 O(n)。",
    quickTips: [
      "Connected components, redundant connections, and grouping problems are the classic fit.",
      "Path compression during find keeps future lookups fast.",
      "Union by rank or size avoids building tall chains."
    ],
    quickTipsCn: [
      "连通分量、多余的连接、分组类问题是经典应用场景。",
      "find 时做路径压缩，能让之后的查找一直很快。",
      "按秩或按大小合并，能避免链条变得很长。"
    ],
    coachMoves: [
      "Ask whether the problem ever needs to undo a merge - if so, union-find is the wrong tool.",
      "Use it when the prompt mentions connected components, islands of connectivity, or redundant edges.",
      "Contrast it with BFS/DFS connectivity checks when queries are interleaved with updates."
    ],
    signalMatchers: [
      "union find",
      "disjoint set",
      "connected component",
      "redundant connection",
      "group",
      "province"
    ]
  },
  {
    id: "trie",
    title: "Trie (Prefix Tree)",
    titleCn: "字典树（前缀树）",
    sourceTrack: "data-structure",
    aliases: ["prefix tree", "word dictionary"],
    whenToThink:
      "Use this when many words or strings share prefixes and you need fast prefix search, autocomplete, or existence checks.",
    whenToThinkCn: "当很多单词或字符串共享前缀，需要快速做前缀查找、自动补全或存在性判断时使用。",
    coreIdea:
      "Each path from the root spells out a prefix; shared prefixes share the same path, so lookup cost depends on word length, not dictionary size.",
    coreIdeaCn: "从根节点出发的每条路径拼出一个前缀；共享前缀的单词共用同一段路径，查找代价只取决于单词长度，与词典大小无关。",
    starterQuestion:
      "Do I need to search by prefix repeatedly, not just check whole-word membership?",
    starterQuestionCn: "我是否需要反复按前缀查找，而不只是判断整个单词是否存在？",
    commonTrap:
      "Reaching for a trie when a plain hash set already answers the question, because there is no real prefix structure to exploit.",
    commonTrapCn: "题目其实没有前缀结构可利用，一个普通哈希集合就够用，却还是上了字典树。",
    quickTips: [
      "Autocomplete, word search boards, and prefix-count problems are strong signals.",
      "Each node commonly stores child pointers plus an end-of-word flag.",
      "A trie trades memory for prefix-aware speed."
    ],
    quickTipsCn: [
      "自动补全、单词搜索网格、前缀计数类问题是强信号。",
      "每个节点通常存子节点指针，加一个“是否单词结尾”的标记。",
      "字典树用空间换取“感知前缀”的速度。"
    ],
    coachMoves: [
      "Ask whether prefixes specifically matter, not just whole-word lookup.",
      "Use it for autocomplete, spell-check, and word-search-board problems.",
      "Contrast it with a plain hash set when prefix structure isn't actually needed."
    ],
    signalMatchers: ["trie", "prefix", "autocomplete", "word search", "word dictionary"]
  },
  {
    id: "topological-sort",
    title: "Topological Sort",
    titleCn: "拓扑排序",
    sourceTrack: "essential-technique",
    aliases: ["course schedule", "dependency order", "kahn's algorithm"],
    whenToThink:
      "Use this when tasks have prerequisite dependencies and you need a valid order, or need to detect a cycle in those dependencies.",
    whenToThinkCn: "当任务之间存在先后依赖关系，需要求出一个合法顺序，或者要检测依赖中是否存在环时使用。",
    coreIdea:
      "Repeatedly remove nodes with no remaining incoming edges - the order they're removed in is a valid dependency order.",
    coreIdeaCn: "不断移除那些入度为 0 的节点，它们被移除的顺序就是一个合法的依赖顺序。",
    starterQuestion:
      "Can I model this as a directed graph where an edge means 'must come before'?",
    starterQuestionCn: "能不能把这个问题建模成一张有向图，边表示“必须先于”？",
    commonTrap:
      "Trying to detect a cycle with plain DFS visited-marking instead of tracking the current recursion path or using Kahn's in-degree count.",
    commonTrapCn: "用普通的 DFS 访问标记来判环，而不是追踪“当前递归路径”，或者用 Kahn 算法的入度计数。",
    quickTips: [
      "Course schedule and build-order problems are the signature use case.",
      "Kahn's algorithm (BFS with in-degree counting) is often easier to reason about than DFS-based ordering.",
      "If not all nodes get processed, there's a cycle - no valid order exists."
    ],
    quickTipsCn: [
      "课程表、构建顺序类问题是最典型的应用场景。",
      "Kahn 算法（基于入度计数的 BFS）通常比基于 DFS 的排序更容易想清楚。",
      "如果最后没能处理完所有节点，说明存在环，不存在合法顺序。"
    ],
    coachMoves: [
      "Ask the learner to state what an edge means before building the graph.",
      "Use it when the prompt mentions prerequisites, build order, or scheduling with dependencies.",
      "Push for cycle detection as a first-class part of the solution, not an afterthought."
    ],
    signalMatchers: [
      "course schedule",
      "prerequisite",
      "topological",
      "build order",
      "dependency",
      "in-degree"
    ]
  },
  {
    id: "graph-shortest-path",
    title: "Graph Shortest Path",
    titleCn: "图的最短路径",
    sourceTrack: "essential-technique",
    aliases: ["dijkstra", "weighted shortest path"],
    whenToThink:
      "Use this when edges have different costs or weights and you need the cheapest path, not just the fewest edges.",
    whenToThinkCn: "当边的权重不相等，需要求“代价最小”的路径，而不只是“边数最少”时使用。",
    coreIdea:
      "Always expand the closest not-yet-finalized node next, so once a node is finalized its shortest distance can never improve.",
    coreIdeaCn: "每次都扩展当前还没确定最短距离的节点中最近的那个，这样一个节点一旦被确定，它的最短距离就不会再变。",
    starterQuestion:
      "Are edge weights uniform (plain BFS works) or do they vary (I need Dijkstra)?",
    starterQuestionCn: "边的权重是不是都一样（那用 BFS 就够了），还是各不相同（需要用 Dijkstra）？",
    commonTrap:
      "Reaching for plain BFS on a weighted graph, which only guarantees fewest edges, not lowest total cost.",
    commonTrapCn: "在带权图上直接用普通 BFS，那只能保证边数最少，不能保证总代价最小。",
    quickTips: [
      "A min-heap keyed by current best distance is the standard Dijkstra skeleton.",
      "Dijkstra assumes non-negative weights - negative edges need Bellman-Ford instead.",
      "Network delay time and cheapest flights problems are classic signals."
    ],
    quickTipsCn: [
      "以“当前最优距离”为键的小顶堆，是 Dijkstra 最标准的骨架。",
      "Dijkstra 假设边权非负——如果有负权边，要换成 Bellman-Ford。",
      "网络延迟时间、最便宜航班这类问题是经典信号。"
    ],
    coachMoves: [
      "Ask whether weights are uniform before jumping to Dijkstra.",
      "Use it when the prompt mentions cost, weight, delay, or price on edges.",
      "Warn about negative weights requiring a different algorithm."
    ],
    signalMatchers: [
      "shortest path",
      "dijkstra",
      "network delay",
      "cheapest flights",
      "weighted graph",
      "minimum cost path"
    ]
  },
  {
    id: "bit-manipulation",
    title: "Bit Manipulation",
    titleCn: "位运算",
    sourceTrack: "essential-technique",
    aliases: ["xor tricks", "bitmask"],
    whenToThink:
      "Use this when a problem cares about individual bits, parity, or when a small fixed set of items can be represented as a bitmask.",
    whenToThinkCn: "当题目关心具体的二进制位、奇偶性，或者一小组元素可以用位掩码表示时使用。",
    coreIdea:
      "Treat numbers as bit patterns so operations like toggling, checking, or clearing a bit become O(1) instead of looping.",
    coreIdeaCn: "把数字当作位模式来处理，让“翻转某一位”“检查某一位”“清除某一位”这类操作变成 O(1)，而不用循环。",
    starterQuestion:
      "Can this problem be restated in terms of individual bits or a small set that fits in a bitmask?",
    starterQuestionCn: "这个问题能不能改写成关于“单个二进制位”，或者一个能放进位掩码的小集合？",
    commonTrap:
      "Reaching for bit tricks to look clever when a plain loop or hash set is clearer and just as fast.",
    commonTrapCn: "为了显得“巧妙”而硬用位运算技巧，其实普通循环或哈希集合更清晰、速度也一样。",
    quickTips: [
      "XOR cancels duplicates - useful for single-number and missing-number problems.",
      "n & (n - 1) clears the lowest set bit, useful for counting set bits.",
      "A bitmask can represent 'which of these k items are used' when k is small (roughly under 20)."
    ],
    quickTipsCn: [
      "异或能抵消重复项——常用于“找单独出现的数字”或“找缺失的数字”。",
      "n & (n - 1) 能清除最低位的 1，常用于统计二进制中 1 的个数。",
      "当元素个数 k 较小（大约 20 以内）时，位掩码可以表示“这 k 个元素中哪些被用了”。"
    ],
    coachMoves: [
      "Ask whether a plain data structure would be just as clear before reaching for bit tricks.",
      "Use it when the prompt mentions single number, subsets of a small set, or parity.",
      "Push the learner to explain what each bit represents before coding."
    ],
    signalMatchers: ["xor", "bitmask", "single number", "bit", "parity", "and (n - 1)"]
  },
  {
    id: "fast-slow-pointers",
    title: "Fast/Slow Pointers (Linked List)",
    titleCn: "快慢指针（链表）",
    sourceTrack: "data-structure",
    aliases: ["tortoise and hare", "cycle detection"],
    whenToThink:
      "Use this on linked lists when you need the middle node, cycle detection, or the cycle's entry point without extra memory.",
    whenToThinkCn: "在链表上需要找中间节点、检测环，或者找到环的入口，同时又不想用额外空间时使用。",
    coreIdea:
      "Move one pointer twice as fast as the other; their relative gap shrinking or looping tells you the structural answer.",
    coreIdeaCn: "让一个指针走得比另一个快一倍；它们之间相对距离的变化（缩短或成环）就能告诉你结构性的答案。",
    starterQuestion:
      "Can I answer this by comparing where a fast and a slow pointer end up, instead of storing every node I've visited?",
    starterQuestionCn: "能不能通过比较快慢指针最终停在哪里来回答问题，而不用额外存储访问过的每个节点？",
    commonTrap:
      "Using a hash set to track visited nodes when the fast/slow technique solves the same problem in O(1) space.",
    commonTrapCn: "用哈希集合记录访问过的节点，其实用快慢指针就能以 O(1) 空间解决同样的问题。",
    quickTips: [
      "When fast reaches the end, slow is at the middle.",
      "If fast and slow ever meet, there's a cycle.",
      "After they meet, resetting one pointer to head and moving both one step at a time finds the cycle's entry."
    ],
    quickTipsCn: [
      "当快指针走到末尾时，慢指针正好在中间。",
      "如果快慢指针相遇了，说明存在环。",
      "相遇后，把一个指针重置到头节点，两个指针每次都走一步，再次相遇的地方就是环的入口。"
    ],
    coachMoves: [
      "Ask why extra memory isn't needed before suggesting a hash set alternative.",
      "Use it for middle-of-list, cycle-detection, and cycle-entry problems.",
      "Have the learner explain the meeting-point math in their own words."
    ],
    signalMatchers: ["cycle", "middle node", "fast pointer", "slow pointer", "tortoise", "linked list cycle"]
  },
  {
    id: "design-data-structure",
    title: "Design a Data Structure",
    titleCn: "设计数据结构",
    sourceTrack: "data-structure",
    aliases: ["lru cache", "custom structure design"],
    whenToThink:
      "Use this when a problem asks you to build a structure supporting a specific set of operations, each within a target time complexity.",
    whenToThinkCn: "当题目要求你设计一个结构，支持一组特定操作，且每个操作都要满足给定的时间复杂度时使用。",
    coreIdea:
      "List every required operation and its target complexity first, then combine existing structures (hash map, doubly linked list, array) to satisfy all of them at once.",
    coreIdeaCn: "先列出所有需要支持的操作和各自的目标复杂度，再组合现有的数据结构（哈希表、双向链表、数组）来同时满足它们。",
    starterQuestion:
      "For each required operation, what complexity does the prompt demand, and which structure alone can't meet all of them?",
    starterQuestionCn: "每个操作要求的复杂度是多少？单独哪个数据结构满足不了全部要求？",
    commonTrap:
      "Picking one convenient structure and hoping it handles every operation, instead of checking each operation's complexity requirement individually.",
    commonTrapCn: "只选了一个用起来顺手的结构，指望它能应付所有操作，而没有逐个检查每个操作的复杂度要求。",
    quickTips: [
      "Hash map plus doubly linked list is the classic combo for LRU-style O(1) get/put with ordering.",
      "Write the public interface first, then decide the internal structure.",
      "Draw what happens to internal state on each operation before coding."
    ],
    quickTipsCn: [
      "哈希表 + 双向链表是实现 LRU 这类“O(1) 存取且带顺序”结构的经典组合。",
      "先写清楚对外的接口，再决定内部用什么结构。",
      "写代码前，先画出每个操作对内部状态做了什么改变。"
    ],
    coachMoves: [
      "Ask for the full list of required operations and their complexity targets before discussing structure.",
      "Use it for LRU/LFU cache, design-twitter, and similar multi-operation design prompts.",
      "Push the learner to justify why a single structure can't satisfy every requirement alone."
    ],
    signalMatchers: ["design", "lru", "lfu", "implement", "o(1) get", "cache"]
  },
  {
    id: "knapsack-dp",
    title: "0/1 and Unbounded Knapsack",
    titleCn: "0-1 背包与完全背包",
    sourceTrack: "essential-technique",
    aliases: ["subset sum", "coin change", "partition"],
    whenToThink:
      "Use this when you choose a subset of items under a capacity constraint, and each item is either used once (0/1) or an unlimited number of times (unbounded).",
    whenToThinkCn: "当需要在容量限制下选择一组物品，每个物品要么只能用一次（0-1 背包），要么可以用无限次（完全背包）时使用。",
    coreIdea:
      "State is (item index, remaining capacity); the transition decides whether including this item is worth the capacity it consumes.",
    coreIdeaCn: "状态是（物品下标, 剩余容量）；转移方程决定：选这个物品占用的容量是否“值得”。",
    starterQuestion:
      "Can each item be used at most once, or can it be reused - and what exactly is the 'capacity' being spent?",
    starterQuestionCn: "每个物品最多用一次，还是可以重复使用？这里的“容量”具体指的是什么？",
    commonTrap:
      "Mixing up the 0/1 and unbounded loop order - iterating capacity forward reuses an item within the same pass, iterating backward forbids it.",
    commonTrapCn: "0-1 背包和完全背包的容量遍历方向搞混——正向遍历会在同一轮里重复使用该物品，反向遍历则不会。",
    quickTips: [
      "Target Sum and Partition Equal Subset Sum are 0/1 knapsack in disguise: capacity is a derived target value.",
      "Coin Change (fewest coins, or number of ways) is the classic unbounded knapsack.",
      "Space-optimize to a 1D array once the 2D recurrence is correct - iteration direction is what encodes 0/1 vs unbounded."
    ],
    quickTipsCn: [
      "目标和、分割等和子集本质上都是 0-1 背包，只是“容量”是推导出来的目标值。",
      "零钱兑换（最少硬币数，或方案数）是经典的完全背包问题。",
      "先写对二维递推，再压缩成一维数组——遍历方向正是区分 0-1 背包和完全背包的关键。"
    ],
    coachMoves: [
      "Ask whether items can repeat before writing any code.",
      "Use it when the prompt involves selecting a subset under a sum, weight, or count constraint.",
      "Check the capacity-loop direction explicitly once code is written."
    ],
    signalMatchers: ["knapsack", "subset sum", "coin change", "partition equal", "target sum", "combination sum"]
  },
  {
    id: "state-machine-dp",
    title: "State Machine DP",
    titleCn: "状态机 DP",
    sourceTrack: "essential-technique",
    aliases: ["stock problems", "hold/not-hold dp"],
    whenToThink:
      "Use this when a process has a small number of named states (like holding a stock or not) and the answer depends on state at each step.",
    whenToThinkCn: "当一个过程存在少数几个明确命名的状态（比如“持有股票”或“不持有”），且答案取决于每一步所处的状态时使用。",
    coreIdea:
      "Track the best value for each possible state at each step, with transitions between states forming a small explicit graph.",
    coreIdeaCn: "在每一步都维护每个可能状态下的最优值，状态之间的转移构成一张明确的小型图。",
    starterQuestion:
      "What are all the distinct states this process can be in, and which transitions between them are actually allowed?",
    starterQuestionCn: "这个过程可能处于哪些不同状态？状态之间实际允许哪些转移？",
    commonTrap:
      "Writing one giant recurrence instead of naming the states explicitly, making it hard to add constraints like cooldown or transaction limits.",
    commonTrapCn: "写了一个笼统的大递推，而不是先把状态明确命名，导致后续很难加入冷冻期、交易次数限制这类约束。",
    quickTips: [
      "The Buy/Sell Stock series is the signature example - states are holding vs not holding on each day.",
      "Extra constraints (cooldown, transaction fee, at most k transactions) just add more states or dimensions.",
      "Draw the state diagram on paper before writing the recurrence."
    ],
    quickTipsCn: [
      "买卖股票系列是这类问题的代表——状态就是“当天持有/不持有”。",
      "额外的约束（冷冻期、手续费、最多 k 次交易）只是增加更多状态或维度。",
      "写递推之前，先在纸上画出状态转移图。"
    ],
    coachMoves: [
      "Ask the learner to name every state before writing a transition.",
      "Use it for stock-trading problems and any process with a small set of named modes.",
      "Check that each extra constraint maps to a specific state or dimension, not a patch on the recurrence."
    ],
    signalMatchers: ["buy and sell stock", "cooldown", "transaction fee", "hold", "state machine"]
  },
  {
    id: "interval-dp",
    title: "Interval DP",
    titleCn: "区间 DP",
    sourceTrack: "essential-technique",
    aliases: ["range dp", "matrix chain"],
    whenToThink:
      "Use this when the answer for a range [i, j] is built from answers on smaller sub-ranges inside it, often by picking a split point or matching endpoints.",
    whenToThinkCn: "当区间 [i, j] 的答案由它内部更小子区间的答案组合而来，通常需要枚举分割点或匹配两端时使用。",
    coreIdea:
      "State is a range (i, j); fill in answers for shorter ranges first, since longer ranges depend on shorter ones nested inside them.",
    coreIdeaCn: "状态是一个区间 (i, j)；先算出短区间的答案，因为长区间依赖于内部嵌套的短区间。",
    starterQuestion:
      "Does the answer for the whole range come from combining the answers of two smaller sub-ranges inside it?",
    starterQuestionCn: "整个区间的答案，是不是由它内部两个更小子区间的答案组合而成？",
    commonTrap:
      "Filling the DP table in the wrong order - iterating i forward and j forward can reference a sub-range that hasn't been computed yet.",
    commonTrapCn: "DP 表的填充顺序错了——如果 i 和 j 都正向遍历，可能会引用到还没算出来的子区间。",
    quickTips: [
      "Longest Palindromic Subsequence is the entry-level example: match the two ends or drop one.",
      "Matrix chain multiplication and burst balloons need an explicit split-point loop inside the range loop.",
      "Iterate the range length from short to long, or i from large to small and j from small to large."
    ],
    quickTipsCn: [
      "最长回文子序列是最基础的入门例题：匹配两端字符，或者去掉其中一端。",
      "矩阵链乘法、戳气球这类问题需要在区间循环内部再枚举一层分割点。",
      "遍历顺序：按区间长度从短到长，或者 i 从大到小、j 从小到大。"
    ],
    coachMoves: [
      "Ask whether the range's answer decomposes into two smaller ranges inside it.",
      "Use it for palindrome subsequence, matrix chain, and burst-balloon style problems.",
      "Check the fill order of the DP table explicitly - this is where interval DP bugs usually hide."
    ],
    signalMatchers: ["palindromic subsequence", "matrix chain", "burst balloon", "interval dp", "merge stones"]
  },
  {
    id: "tree-dp",
    title: "Tree DP",
    titleCn: "树形 DP",
    sourceTrack: "essential-technique",
    aliases: ["dp on trees", "subtree state"],
    whenToThink:
      "Use this when each node's best answer depends on combining its children's best answers under some constraint, like an include/exclude choice.",
    whenToThinkCn: "当每个节点的最优答案，需要在某种约束下（比如“选/不选”）结合子节点的最优答案时使用。",
    coreIdea:
      "Each node's DFS call returns a small tuple of values - one per possible local state - and the parent combines its children's tuples to build its own.",
    coreIdeaCn: "每个节点的 DFS 调用返回一个小元组——对应每种可能的局部状态各一个值——父节点再组合子节点的元组，算出自己的结果。",
    starterQuestion:
      "What are the few possible states a node can be in, and what does each state need from its children to be computed?",
    starterQuestionCn: "一个节点可能处于哪几种状态？每种状态需要从子节点那里得到什么信息？",
    commonTrap:
      "Returning only one value per node when the problem actually needs to track multiple mutually exclusive states, like 'this node is selected' vs 'this node is not.'",
    commonTrapCn: "每个节点只返回一个值，但题目其实需要区分几种互斥的状态，比如“这个节点被选中”和“没被选中”。",
    quickTips: [
      "House Robber III is the entry-level example: each node returns (best if robbed, best if not robbed).",
      "Diameter-of-tree problems return one value upward (longest chain) while updating a separate global answer.",
      "Binary Tree Cameras needs three states per node - this is where tree DP gets genuinely hard."
    ],
    quickTipsCn: [
      "打家劫舍 III 是最基础的入门例题：每个节点返回（选它的最优值, 不选它的最优值）。",
      "树的直径类问题向上只返回一个值（最长链），同时用另一个变量单独更新全局答案。",
      "监控二叉树需要每个节点维护三种状态——这是树形 DP 真正变难的地方。"
    ],
    coachMoves: [
      "Ask the learner to enumerate the possible states before writing the DFS.",
      "Use it for house robber on a tree, tree diameter, and camera/coverage problems.",
      "Distinguish tree DP from plain binary tree recursion by asking whether multiple mutually exclusive states are being tracked."
    ],
    signalMatchers: ["house robber iii", "tree dp", "binary tree cameras", "diameter", "subtree state"]
  },
  {
    id: "grid-traversal",
    title: "Grid / Matrix Traversal",
    titleCn: "网格图遍历",
    sourceTrack: "essential-technique",
    aliases: ["islands", "flood fill", "matrix dfs bfs"],
    whenToThink:
      "Use this when the input is a 2D grid and you need to explore connected regions, count islands, or find shortest paths across cells.",
    whenToThinkCn: "当输入是一个二维网格，需要探索连通区域、统计岛屿数量，或者在格子之间找最短路径时使用。",
    coreIdea:
      "Treat each cell as a graph node connected to its (usually 4) neighbors, then run standard DFS/BFS with a visited grid to avoid revisiting.",
    coreIdeaCn: "把每个格子当作图中的一个节点，与它的（通常 4 个）邻居相连，再用标准的 DFS/BFS，配合一个访问标记网格避免重复访问。",
    starterQuestion:
      "Am I counting/marking connected regions (DFS is fine), or do I need shortest distance across cells (BFS is required)?",
    starterQuestionCn: "我是要统计/标记连通区域（DFS 就够了），还是要求格子间的最短距离（必须用 BFS）？",
    commonTrap:
      "Using DFS for a shortest-path-in-a-grid problem, which only guarantees a path exists, not the shortest one.",
    commonTrapCn: "在“网格最短路径”问题里用了 DFS，这只能保证存在一条路径，不能保证是最短的那条。",
    quickTips: [
      "Number of Islands is the signature DFS/flood-fill example.",
      "Shortest Path in Binary Matrix and rotting-oranges style problems need BFS, not DFS.",
      "Mark visited cells in place (flip the value) or with a separate visited grid - just be consistent."
    ],
    quickTipsCn: [
      "岛屿数量是最典型的 DFS / 洪水填充例题。",
      "二进制矩阵中的最短路径、腐烂的橘子这类问题需要用 BFS，而不是 DFS。",
      "可以原地翻转格子值来标记访问过，也可以用单独的访问网格——保持前后一致就好。"
    ],
    coachMoves: [
      "Ask whether the problem needs shortest distance before defaulting to DFS.",
      "Use it for island-counting, flood-fill, and grid shortest-path problems.",
      "Push the learner to define the boundary/visited check before writing the recursion or queue loop."
    ],
    signalMatchers: ["grid", "island", "matrix", "flood fill", "rotting oranges", "connected region"]
  }
] as const satisfies readonly TechniqueSeed[];

export type Technique = (typeof techniqueLibrary)[number];
export type TechniqueId = Technique["id"];

export type TechniqueBrief = {
  title: string;
  whyItFits: string;
  starterQuestion: string;
  commonTrap: string;
  quickTips: string[];
  coachMoves: string[];
};

const techniqueById = new Map<TechniqueId, Technique>(
  techniqueLibrary.map((technique) => [technique.id, technique])
);

export function getTechniqueById(id: TechniqueId) {
  return techniqueById.get(id) ?? null;
}

function escapeRegExpForWordMatch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Whole-word/phrase match only - a plain substring check would let "oranges"
// match "range" or "arrangement" match "range", pulling in irrelevant
// technique suggestions.
function containsWord(haystack: string, needle: string) {
  const escaped = escapeRegExpForWordMatch(needle.trim());
  if (!escaped) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(haystack);
}

export function getSuggestedTechniques(options: {
  primaryPatternId: string | null;
  contrastPatternId: string | null;
  problemPrompt: string;
}) {
  const scores = new Map<TechniqueId, number>();
  const normalized = options.problemPrompt.toLowerCase();
  const has = (phrase: string) => containsWord(normalized, phrase);

  function bump(id: TechniqueId, points: number) {
    scores.set(id, (scores.get(id) ?? 0) + points);
  }

  const primary = mapPatternToTechniqueId(options.primaryPatternId);
  const contrast = mapPatternToTechniqueId(options.contrastPatternId);

  if (primary) bump(primary, 5);
  if (contrast && contrast !== primary) bump(contrast, 3);

  if (has("tree") || has("binary tree")) {
    bump("binary-tree-recursion", 4);
    bump("recursion-perspective", 2);
  }

  if (has("graph")) {
    bump("framework-thinking", 2);
  }

  if (has("substring") || has("subarray") || has("contiguous")) {
    bump("sliding-window", 4);
  }

  if (has("sorted") || has("rotated")) {
    bump("binary-search", 3);
    bump("two-pointers", 2);
  }

  if (has("top k") || has("k most")) {
    bump("heap", 4);
  }

  if (has("shortest path") || has("minimum steps") || has("level order")) {
    bump("bfs", 4);
  }

  if (has("permutation") || has("combination") || has("subset")) {
    bump("dfs-backtracking", 4);
  }

  if (
    has("ways") ||
    has("minimum cost") ||
    has("maximum profit") ||
    has("coin")
  ) {
    bump("dynamic-programming", 3);
  }

  if (has("query") && has("sum")) {
    bump("prefix-sum", 4);
  }

  if (
    has("range addition") ||
    has("bookings") ||
    (has("range") && has("update"))
  ) {
    bump("difference-array", 4);
  }

  if (has("next greater") || has("daily temperature") || has("histogram")) {
    bump("monotonic-stack", 4);
  }

  if (has("sliding window maximum") || has("sliding window minimum")) {
    bump("monotonic-queue", 5);
    bump("sliding-window", 2);
  }

  if (
    has("minimum") ||
    has("maximum") ||
    has("constraint") ||
    has("10^5")
  ) {
    bump("complexity", 2);
  }

  for (const technique of techniqueLibrary) {
    const extraMatches = technique.signalMatchers.filter((signal) => has(signal)).length;

    if (extraMatches > 0) {
      bump(technique.id, extraMatches);
    }
  }

  if (scores.size === 0) {
    bump("framework-thinking", 3);
    bump("complexity", 2);
  }

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([id]) => techniqueById.get(id))
    .filter((technique): technique is Technique => Boolean(technique));
}

export function buildTechniqueBriefs(techniques: readonly Technique[]): TechniqueBrief[] {
  return techniques.map((technique) => ({
    title: technique.title,
    whyItFits: technique.whenToThink,
    starterQuestion: technique.starterQuestion,
    commonTrap: technique.commonTrap,
    quickTips: technique.quickTips,
    coachMoves: technique.coachMoves
  }));
}

function mapPatternToTechniqueId(patternId: string | null): TechniqueId | null {
  if (!patternId) return null;

  switch (patternId) {
    case "sliding-window":
      return "sliding-window";
    case "two-pointers":
      return "two-pointers";
    case "hashing":
      return "hash-map";
    case "stack":
      return "stack";
    case "bfs":
      return "bfs";
    case "dfs":
      return "dfs-backtracking";
    case "intervals":
      return "intervals";
    case "dynamic-programming":
      return "dynamic-programming";
    case "heap":
      return "heap";
    case "greedy":
      return "greedy";
    default:
      return null;
  }
}
