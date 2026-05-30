export type AttemptOutcome = "solid" | "partial" | "confused";

export type CoachRequest = {
  problemTitle: string;
  problemPrompt: string;
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
