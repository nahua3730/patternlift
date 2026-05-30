export type AttemptOutcome = "solid" | "partial" | "confused";

export type CoachRequest = {
  problemTitle: string;
  problemPrompt: string;
  selectedPatternLabel: string;
  correctPatternLabel: string;
  contrastPatternLabel: string;
  suggestedTechniqueTitles: string[];
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
  clueFeedback: string;
  firstStepFeedback: string;
  nextHint: string;
  reviewQuestion: string;
  encouragement: string;
};

export const coachResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "diagnosis",
    "clueFeedback",
    "firstStepFeedback",
    "nextHint",
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
