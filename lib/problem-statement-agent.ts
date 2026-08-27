export type ProblemExample = {
  input: string;
  output: string;
  explanation: string;
};

export type ProblemStatement = {
  summary: string;
  examples: ProblemExample[];
  constraints: string[];
};

export const problemStatementSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "examples", "constraints"],
  properties: {
    summary: {
      type: "string",
      description: "The complete problem description, as it would normally be phrased, in 1-4 paragraphs."
    },
    examples: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["input", "output", "explanation"],
        properties: {
          input: { type: "string" },
          output: { type: "string" },
          explanation: { type: "string" }
        }
      }
    },
    constraints: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    }
  }
} as const;

export function validateProblemStatement(value: unknown): ProblemStatement | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ProblemStatement>;
  const summary = String(candidate.summary || "").trim();
  if (!summary || summary.length < 20) return null;
  if (!Array.isArray(candidate.examples) || candidate.examples.length < 1) return null;

  const examples = candidate.examples
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const example = entry as Partial<ProblemExample>;
      const input = String(example.input || "").trim();
      const output = String(example.output || "").trim();
      const explanation = String(example.explanation || "").trim();
      if (!input || !output) return null;
      return { input, output, explanation };
    })
    .filter((example): example is ProblemExample => Boolean(example));
  if (examples.length === 0) return null;

  const constraints = Array.isArray(candidate.constraints)
    ? candidate.constraints.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];

  return { summary, examples, constraints };
}
