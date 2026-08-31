import { allProblems, patternOptions } from "@/lib/product";
import { buildSkillVector, type TechniqueSkillVector } from "@/lib/skill-vector";
import { diagnoseAttempt, type AttemptDiagnosis } from "@/lib/diagnosis";

export type MasteryAttempt = {
  problemId: string;
  problemTitle: string;
  selectedPatternLabel: string;
  actualPatternLabel?: string;
  outcome: "solid" | "partial" | "confused";
  score?: number;
  // The DB's dedicated explanation-quality signal (distinct from `score`,
  // which is the attempt's overall local score) - optional because older
  // rows predate the column and callers that don't need it can omit it.
  explanationScore?: number;
  hintsUsed?: number;
  codePassed?: boolean | null;
  confidence?: number;
  confusedWith?: string | null;
  createdAt?: string;
  // V2.3: the deepest hint level requested (0-5, 0/undefined = none) and
  // the code-fading scaffold level the attempt was solved under (0-3) -
  // both feed independence/implementation scoring in skill-vector.ts.
  highestHintLevel?: number;
  scaffoldLevel?: number;
};

export type PatternMastery = {
  id: string;
  label: string;
  // Legacy fields, kept byte-for-byte compatible for existing consumers
  // (progress-panel.tsx, mastery-agent.ts, coach-agent.ts) - both are now
  // DERIVED from `skills`/`diagnosisDetail` rather than computed separately,
  // so the richer model and the simple number can never silently diverge.
  mastery: number;
  diagnosis: string;
  attempts: number;
  correctRecognitions: number;
  averageHints: number;
  status: "new" | "building" | "strong" | "mastered";
  recommendedProblemId: string | null;
  recommendedProblemTitle: string | null;
  // New in V2.2: the six-dimension breakdown behind `mastery`, and a
  // structured diagnosis (from the most recent attempt on this pattern)
  // behind the `diagnosis` summary string.
  skills: TechniqueSkillVector;
  diagnosisDetail: AttemptDiagnosis | null;
};

export type ConfusionPair = {
  predicted: string;
  actual: string;
  count: number;
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

const RETENTION_GAP_MS = 3 * 86_400_000;

// Retention context for the diagnosis engine: was this the learner's most
// recent attempt on this pattern happening well after their first one
// (a genuine delayed retry, not a same-session repeat), and did an earlier
// attempt land solid? Mirrors the gap definition in skill-vector.ts.
// Exported so the attempts POST route can compute the same context at
// submission time, before the new attempt is even persisted.
export function retentionContextFor(patternAttempts: MasteryAttempt[]) {
  const dated = patternAttempts
    .filter((attempt) => attempt.createdAt)
    .map((attempt) => ({ attempt, time: new Date(attempt.createdAt as string).getTime() }))
    .sort((a, b) => a.time - b.time);
  if (dated.length < 2) return undefined;

  const earliest = dated[0];
  const latest = dated[dated.length - 1];
  return {
    isDelayedRetry: latest.time - earliest.time >= RETENTION_GAP_MS,
    priorOutcomeWasSolid: dated.slice(0, -1).some((entry) => entry.attempt.outcome === "solid")
  };
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
    const relatedConfusions = [...confusionMap.values()]
      .filter((pair) => pair.actual === pattern.label)
      .sort((left, right) => right.count - left.count);

    const skills = buildSkillVector(normalizedAttempts, pattern.label, relatedConfusions);
    const masteryScore = skills.overall;

    // patternAttempts is newest-first (matches loadRecentAttempts ordering
    // and the recency weighting above), so element 0 is the latest rep.
    const mostRecent = patternAttempts[0];
    const diagnosisDetail = mostRecent
      ? diagnoseAttempt(
          {
            selectedPatternLabel: mostRecent.selectedPatternLabel,
            actualPatternLabel: pattern.label,
            outcome: mostRecent.outcome,
            explanationScore: mostRecent.explanationScore,
            codePassed: mostRecent.codePassed,
            hintsUsed: mostRecent.hintsUsed,
            confidence: mostRecent.confidence
          },
          retentionContextFor(patternAttempts)
        )
      : null;

    const correctRecognitions = patternAttempts.filter(
      (attempt) => attempt.selectedPatternLabel === pattern.label
    ).length;
    const averageHints = patternAttempts.length === 0
      ? 0
      : patternAttempts.reduce((sum, attempt) => sum + (attempt.hintsUsed ?? 0), 0) /
        patternAttempts.length;
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

    // The latest attempt's specific diagnosis takes priority when it
    // flags a real gap - that's the most actionable, concrete feedback.
    // Otherwise fall back to pattern-level trend commentary (confusion
    // pairs, hint dependency, transfer readiness), which stays useful
    // even when the last rep itself was clean.
    const diagnosis = patternAttempts.length === 0
      ? "No evidence yet. Start with a recognition rep."
      : diagnosisDetail?.primaryFailure
        ? diagnosisDetail.learnerFacingSummary
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
      diagnosis,
      attempts: patternAttempts.length,
      correctRecognitions,
      averageHints,
      status,
      recommendedProblemId: recommendedProblem?.id ?? null,
      recommendedProblemTitle: recommendedProblem?.title ?? null,
      skills,
      diagnosisDetail
    };
  });

  return {
    mastery,
    confusions: [...confusionMap.values()].sort(
      (left, right) => right.count - left.count || left.actual.localeCompare(right.actual)
    )
  };
}
