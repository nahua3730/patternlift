export type AttemptOutcome = "solid" | "partial" | "confused";

export type CoachRequest = {
  studyMode: "learn" | "recognize" | "practice";
  coachStyle: "beginner" | "guided" | "optional" | "off";
  problemTitle: string;
  problemPrompt: string;
  userResponse: string;
  conversationHistory: {
    speaker: "coach" | "user";
    text: string;
  }[];
  selectedPatternLabel: string;
  correctPatternLabel: string;
  contrastPatternLabel: string;
  suggestedTechniques: {
    title: string;
    whyItFits: string;
    starterQuestion: string;
    commonTrap: string;
    quickTips: string[];
    coachMoves: string[];
  }[];
  selectedClues: string[];
  selectedFirstStep: string | null;
  learnerNote: string;
  currentCode: string;
  localOutcome: AttemptOutcome;
  localScore: number;
  reviewQuestion: string;
};

export type CoachResponse = {
  headline: string;
  diagnosis: string;
  techniqueFocus: string;
  techniqueReason: string;
  clueFeedback: string;
  firstStepFeedback: string;
  codeReview: string;
  bruteForceIdea: string;
  optimalIdea: string;
  timeComplexity: string;
  spaceComplexity: string;
  nextHint: string;
  nextQuestion: string;
  reviewQuestion: string;
  encouragement: string;
};

export const coachResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "diagnosis",
    "techniqueFocus",
    "techniqueReason",
    "clueFeedback",
    "firstStepFeedback",
    "codeReview",
    "bruteForceIdea",
    "optimalIdea",
    "timeComplexity",
    "spaceComplexity",
    "nextHint",
    "nextQuestion",
    "reviewQuestion",
    "encouragement"
  ],
  properties: {
    headline: {
      type: "string",
      description: "Short coaching headline for the learner."
    },
    diagnosis: {
      type: "string",
      description:
        "A concise explanation of whether the chosen pattern fits and what distinction matters most."
    },
    techniqueFocus: {
      type: "string",
      description:
        "The single most relevant technique or framework to emphasize right now."
    },
    techniqueReason: {
      type: "string",
      description:
        "Why that technique is the best lens for this learner on this problem."
    },
    clueFeedback: {
      type: "string",
      description: "Feedback on the selected clues from the prompt."
    },
    firstStepFeedback: {
      type: "string",
      description: "Feedback on the proposed first concrete move."
    },
    codeReview: {
      type: "string",
      description:
        "Feedback on the current code or data structure direction, especially useful in guided learning mode."
    },
    bruteForceIdea: {
      type: "string",
      description:
        "A concise brute-force or naive solution direction so the learner sees the ladder from simple to better."
    },
    optimalIdea: {
      type: "string",
      description:
        "The cleaner or optimal solution direction, focusing on why it improves on the brute-force path."
    },
    timeComplexity: {
      type: "string",
      description: "Time complexity of the strongest recommended solution."
    },
    spaceComplexity: {
      type: "string",
      description: "Space complexity of the strongest recommended solution."
    },
    nextHint: {
      type: "string",
      description:
        "One next hint that nudges the learner without dumping the entire solution."
    },
    nextQuestion: {
      type: "string",
      description:
        "The next question the coach should ask to continue the conversational learning flow."
    },
    reviewQuestion: {
      type: "string",
      description: "A short review question to help the learner remember the distinction later."
    },
    encouragement: {
      type: "string",
      description: "A brief supportive line that still feels specific."
    }
  }
} as const;
