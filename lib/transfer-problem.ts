import type { AppProblem } from "@/lib/product";

export type BlindProblemPreview = Pick<AppProblem, "id" | "title" | "difficulty" | "prompt">;

// Generated roadmap entries currently store curriculum provenance and the
// roadmap category in the same prompt string as the learner-facing copy.
// Strip only that exact generated prefix at the blind-transfer boundary;
// hand-written problem statements pass through byte-for-byte unchanged.
function blindSafePrompt(problem: AppProblem) {
  const generatedPrefix = `${problem.title} is part of the official `;
  const categorySuffix = ` roadmap in ${problem.category}.`;

  if (!problem.prompt.startsWith(generatedPrefix)) return problem.prompt;

  const suffixIndex = problem.prompt.indexOf(categorySuffix, generatedPrefix.length);
  if (suffixIndex === -1) return problem.prompt;

  return problem.prompt.slice(suffixIndex + categorySuffix.length).trim();
}

export function buildBlindProblemPreview(problem: AppProblem): BlindProblemPreview {
  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    prompt: blindSafePrompt(problem)
  };
}
