export type ApproachTier = {
  name: string;
  idea: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  verified: boolean;
};

export type ProblemApproaches = {
  approaches: ApproachTier[];
};

export function buildApproachesSchema(functionName: string) {
  return {
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
          required: ["name", "idea", "timeComplexity", "spaceComplexity", "code"],
          properties: {
            name: { type: "string" },
            idea: { type: "string" },
            timeComplexity: { type: "string" },
            spaceComplexity: { type: "string" },
            code: {
              type: "string",
              description: `Complete, runnable JavaScript defining a function named exactly "${functionName}".`
            }
          }
        }
      }
    }
  } as const;
}

const BIG_O_PATTERN = /^O\([^)]+\)$/;

export function validateProblemApproaches(value: unknown, functionName: string): ApproachTier[] | null {
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
      const code = String(tier.code || "").trim();
      if (!name || !idea || !code) return null;
      if (!code.includes(functionName)) return null;
      if (!BIG_O_PATTERN.test(timeComplexity) || !BIG_O_PATTERN.test(spaceComplexity)) return null;
      return { name, idea, timeComplexity, spaceComplexity, code, verified: false };
    })
    .filter((tier): tier is ApproachTier => Boolean(tier))
    .slice(0, 3);

  if (approaches.length < 2) return null;
  return approaches;
}
