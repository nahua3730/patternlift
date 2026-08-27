export type ApproachTier = {
  name: string;
  idea: string;
  timeComplexity: string;
  spaceComplexity: string;
};

export type ProblemApproaches = {
  approaches: ApproachTier[];
};

export const approachesSchema = {
  type: "object",
  additionalProperties: false,
  required: ["approaches"],
  properties: {
    approaches: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "idea", "timeComplexity", "spaceComplexity"],
        properties: {
          name: { type: "string" },
          idea: { type: "string" },
          timeComplexity: { type: "string" },
          spaceComplexity: { type: "string" }
        }
      }
    }
  }
} as const;

const BIG_O_PATTERN = /^O\([^)]+\)$/;

export function validateProblemApproaches(value: unknown): ProblemApproaches | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { approaches?: unknown };
  if (!Array.isArray(candidate.approaches) || candidate.approaches.length < 2) return null;

  const approaches = candidate.approaches
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const tier = entry as Partial<ApproachTier>;
      const name = String(tier.name || "").trim();
      const idea = String(tier.idea || "").trim();
      const timeComplexity = String(tier.timeComplexity || "").trim();
      const spaceComplexity = String(tier.spaceComplexity || "").trim();
      if (!name || !idea) return null;
      if (!BIG_O_PATTERN.test(timeComplexity) || !BIG_O_PATTERN.test(spaceComplexity)) return null;
      return { name, idea, timeComplexity, spaceComplexity };
    })
    .filter((tier): tier is ApproachTier => Boolean(tier))
    .slice(0, 3);

  if (approaches.length < 2) return null;
  return { approaches };
}
