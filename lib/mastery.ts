import { allProblems, patternOptions } from "@/lib/product";

export type MasteryAttempt = {
  problemId: string;
  problemTitle: string;
  selectedPatternLabel: string;
  actualPatternLabel?: string;
  outcome: "solid" | "partial" | "confused";
  score?: number;
  hintsUsed?: number;
  codePassed?: boolean | null;
  confidence?: number;
  confusedWith?: string | null;
  createdAt?: string;
};

export type PatternMastery = {
  id: string;
  label: string;
  mastery: number;
  attempts: number;
  correctRecognitions: number;
  averageHints: number;
  status: "new" | "building" | "strong" | "mastered";
  diagnosis: string;
  recommendedProblemId: string | null;
  recommendedProblemTitle: string | null;
};

export type ConfusionPair = {
  predicted: string;
  actual: string;
  count: number;
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getAttemptScore(attempt: MasteryAttempt) {
  const recognized = attempt.selectedPatternLabel === attempt.actualPatternLabel;
  const recognitionScore = recognized ? 100 : 20;
  const outcomeScore = attempt.outcome === "solid" ? 100 : attempt.outcome === "partial" ? 62 : 24;
  const explanationScore = attempt.score ?? outcomeScore;
  const hintScore = clamp(100 - (attempt.hintsUsed ?? 0) * 18, 28, 100);
  const codeScore = attempt.codePassed == null ? 60 : attempt.codePassed ? 100 : 35;
  const confidence = attempt.confidence ?? 2;
  const calibrationPenalty = !recognized && confidence === 3 ? 12 : 0;

  return clamp(
    recognitionScore * 0.4 +
      explanationScore * 0.25 +
      outcomeScore * 0.15 +
      hintScore * 0.1 +
      codeScore * 0.1 -
      calibrationPenalty
  );
}

export function buildMasteryModel(attempts: MasteryAttempt[]) {
  const normalizedAttempts = attempts.map((attempt) => {
    if (attempt.actualPatternLabel) return attempt;
    const problem = allProblems.find((candidate) => candidate.id === attempt.problemId);
    const pattern = patternOptions.find((candidate) => candidate.id === problem?.targetPatternId);
    return { ...attempt, actualPatternLabel: pattern?.label };
  });
  const confusionMap = new Map<string, ConfusionPair>();

  normalizedAttempts.forEach((attempt) => {
    if (
      !attempt.actualPatternLabel ||
      attempt.selectedPatternLabel === attempt.actualPatternLabel ||
      attempt.selectedPatternLabel === "Still exploring"
    ) return;

    const key = `${attempt.selectedPatternLabel}::${attempt.actualPatternLabel}`;
    const existing = confusionMap.get(key);
    confusionMap.set(key, {
      predicted: attempt.selectedPatternLabel,
      actual: attempt.actualPatternLabel,
      count: (existing?.count ?? 0) + 1
    });
  });

  const mastery = patternOptions.map<PatternMastery>((pattern) => {
    const patternAttempts = normalizedAttempts.filter(
      (attempt) => attempt.actualPatternLabel === pattern.label
    );
    const weightedScores = patternAttempts.map((attempt, index) => ({
      score: getAttemptScore(attempt),
      weight: Math.max(0.55, 1 - index * 0.08)
    }));
    const totalWeight = weightedScores.reduce((sum, item) => sum + item.weight, 0);
    const evidenceScore = totalWeight === 0
      ? 0
      : weightedScores.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
    const evidenceFactor = Math.min(1, patternAttempts.length / 4);
    const masteryScore = Math.round(evidenceScore * (0.55 + evidenceFactor * 0.45));
    const correctRecognitions = patternAttempts.filter(
      (attempt) => attempt.selectedPatternLabel === pattern.label
    ).length;
    const averageHints = patternAttempts.length === 0
      ? 0
      : patternAttempts.reduce((sum, attempt) => sum + (attempt.hintsUsed ?? 0), 0) /
        patternAttempts.length;
    const relatedConfusions = [...confusionMap.values()]
      .filter((pair) => pair.actual === pattern.label)
      .sort((left, right) => right.count - left.count);
    const attemptedIds = new Set(patternAttempts.map((attempt) => attempt.problemId));
    const recommendedProblem = allProblems.find(
      (problem) => problem.targetPatternId === pattern.id && !attemptedIds.has(problem.id)
    ) ?? allProblems.find((problem) => problem.targetPatternId === pattern.id) ?? null;

    const status: PatternMastery["status"] = patternAttempts.length === 0
      ? "new"
      : masteryScore >= 85 && patternAttempts.length >= 3
        ? "mastered"
        : masteryScore >= 70
          ? "strong"
          : "building";
    const diagnosis = patternAttempts.length === 0
      ? "No evidence yet. Start with a recognition rep."
      : relatedConfusions[0]
        ? `Most often confused with ${relatedConfusions[0].predicted}. Practice explaining why that alternative does not fit.`
        : averageHints >= 2
          ? "Recognition is developing, but it still depends on multiple hints. Try a cold recall rep next."
          : correctRecognitions === patternAttempts.length
            ? "You are recognizing this pattern consistently. Test transfer on a fresh problem."
            : "The signal is mixed. Name the invariant before you start coding.";

    return {
      id: pattern.id,
      label: pattern.label,
      mastery: masteryScore,
      attempts: patternAttempts.length,
      correctRecognitions,
      averageHints,
      status,
      diagnosis,
      recommendedProblemId: recommendedProblem?.id ?? null,
      recommendedProblemTitle: recommendedProblem?.title ?? null
    };
  });

  return {
    mastery,
    confusions: [...confusionMap.values()].sort(
      (left, right) => right.count - left.count || left.actual.localeCompare(right.actual)
    )
  };
}

export function getReviewSchedule(outcome: MasteryAttempt["outcome"], previousInterval = 0) {
  const intervalDays = outcome === "confused"
    ? 1
    : outcome === "partial"
      ? Math.max(2, Math.min(4, previousInterval || 2))
      : previousInterval > 0
        ? Math.min(30, Math.max(7, previousInterval * 2))
        : 7;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);
  return { intervalDays, dueAt: dueAt.toISOString() };
}
