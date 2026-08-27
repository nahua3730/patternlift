import {
  allProblems,
  getOfficialProblemRoadmapMeta,
  patternOptions,
  type RoadmapTrack
} from "@/lib/product";

export type ExperienceLevel = "new" | "rusty" | "comfortable";
export type StudyMode = "learn" | "recognize" | "practice" | "review";

export type OnboardingAnswers = {
  experienceLevel: ExperienceLevel;
  deadlineWeeks: number | null;
  dailyMinutes: number;
};

export type CurriculumWeeklyPlan = {
  headline: string;
  rationale: string;
  totalWeeks: number;
  dailyMinutes: number;
  weeks: {
    weekNumber: number;
    focusPatternIds: string[];
    dominantStudyMode: "learn" | "recognize" | "practice";
    includesReviewDay: boolean;
  }[];
};

export type CurriculumDay = {
  dayNumber: number;
  weekNumber: number;
  patternId: string | null;
  patternLabel: string;
  studyMode: StudyMode;
  problemIds: string[];
};

export type CurriculumPlan = {
  headline: string;
  rationale: string;
  totalWeeks: number;
  dailyMinutes: number;
  days: CurriculumDay[];
};

const DAY_TEMPLATE: StudyMode[] = ["learn", "learn", "recognize", "recognize", "practice", "practice", "review"];

export const curriculumPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "rationale", "totalWeeks", "dailyMinutes", "weeks"],
  properties: {
    headline: { type: "string" },
    rationale: { type: "string" },
    totalWeeks: { type: "integer", minimum: 2, maximum: 8 },
    dailyMinutes: { type: "integer", minimum: 20, maximum: 180 },
    weeks: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["weekNumber", "focusPatternIds", "dominantStudyMode", "includesReviewDay"],
        properties: {
          weekNumber: { type: "integer", minimum: 1, maximum: 8 },
          focusPatternIds: {
            type: "array",
            minItems: 1,
            maxItems: 2,
            items: { type: "string", enum: patternOptions.map((pattern) => pattern.id) }
          },
          dominantStudyMode: { type: "string", enum: ["learn", "recognize", "practice"] },
          includesReviewDay: { type: "boolean" }
        }
      }
    }
  }
} as const;

function weeksFromDeadline(deadlineWeeks: number | null): number {
  if (deadlineWeeks == null) return 6;
  return Math.min(8, Math.max(2, deadlineWeeks));
}

const EASY_FIRST_PATTERN_ORDER = [
  "hashing",
  "two-pointers",
  "sliding-window",
  "stack",
  "binary-search",
  "bfs",
  "dfs",
  "intervals",
  "heap",
  "greedy",
  "dynamic-programming"
];

function orderedPatternIds() {
  const known = EASY_FIRST_PATTERN_ORDER.filter((id) => patternOptions.some((pattern) => pattern.id === id));
  const remaining = patternOptions.map((pattern) => pattern.id).filter((id) => !known.includes(id));
  return [...known, ...remaining];
}

export function buildFallbackWeeklyPlan(answers: OnboardingAnswers): CurriculumWeeklyPlan {
  const totalWeeks = weeksFromDeadline(answers.deadlineWeeks);
  const order = orderedPatternIds();
  const dominantStudyMode: CurriculumWeeklyPlan["weeks"][number]["dominantStudyMode"] =
    answers.experienceLevel === "new" ? "learn" : answers.experienceLevel === "rusty" ? "recognize" : "practice";

  const weeks: CurriculumWeeklyPlan["weeks"] = [];
  let cursor = 0;
  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber += 1) {
    const isLastWeek = weekNumber === totalWeeks;
    const focusPatternIds = isLastWeek
      ? [order[cursor % order.length]]
      : [order[cursor % order.length], order[(cursor + 1) % order.length]];
    cursor += focusPatternIds.length;
    weeks.push({
      weekNumber,
      focusPatternIds,
      dominantStudyMode: weekNumber === 1 ? "learn" : dominantStudyMode,
      includesReviewDay: weekNumber > 1
    });
  }

  return {
    headline:
      answers.deadlineWeeks == null
        ? `A ${totalWeeks}-week path built around pattern recognition.`
        : `Your ${totalWeeks}-week path to interview-ready.`,
    rationale:
      answers.experienceLevel === "new"
        ? "Starting from the basics — every week begins with guided learning before independent practice."
        : answers.experienceLevel === "rusty"
          ? "Front-loading recognition reps to rebuild instinct fast, then shifting to speed and mixed review."
          : "Mostly practice and mixed review, since the fundamentals are already there.",
    totalWeeks,
    dailyMinutes: answers.dailyMinutes,
    weeks
  };
}

export function validateCurriculumWeeklyPlan(value: unknown): CurriculumWeeklyPlan | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CurriculumWeeklyPlan>;
  const totalWeeks = Math.min(8, Math.max(2, Math.round(Number(candidate.totalWeeks) || 0)));
  if (!totalWeeks) return null;
  if (!Array.isArray(candidate.weeks) || candidate.weeks.length === 0) return null;

  const weeks = candidate.weeks
    .map((week, index) => {
      if (!week || typeof week !== "object") return null;
      const focusPatternIds = Array.isArray(week.focusPatternIds)
        ? week.focusPatternIds
            .filter((id): id is string => patternOptions.some((pattern) => pattern.id === id))
            .slice(0, 2)
        : [];
      if (focusPatternIds.length === 0) return null;
      const dominantStudyMode = (["learn", "recognize", "practice"] as const).includes(
        week.dominantStudyMode as never
      )
        ? (week.dominantStudyMode as "learn" | "recognize" | "practice")
        : "learn";
      return {
        weekNumber: Number(week.weekNumber) || index + 1,
        focusPatternIds,
        dominantStudyMode,
        includesReviewDay: Boolean(week.includesReviewDay)
      };
    })
    .filter((week): week is CurriculumWeeklyPlan["weeks"][number] => Boolean(week))
    .slice(0, totalWeeks);

  if (weeks.length === 0) return null;

  return {
    headline: String(candidate.headline || "Your personalized study path."),
    rationale: String(candidate.rationale || "Sequenced from your onboarding answers."),
    totalWeeks: weeks.length,
    dailyMinutes: Math.min(180, Math.max(20, Number(candidate.dailyMinutes) || 45)),
    weeks
  };
}

function difficultyRank(difficulty: string) {
  return difficulty === "Easy" ? 0 : difficulty === "Medium" ? 1 : difficulty === "Hard" ? 2 : 3;
}

function pickProblem(patternId: string, track: RoadmapTrack, used: Set<string>) {
  const inTrack = allProblems
    .filter((problem) => problem.targetPatternId === patternId)
    .filter((problem) => getOfficialProblemRoadmapMeta(problem.id)?.tracks.includes(track))
    .filter((problem) => !used.has(problem.id))
    .sort((left, right) => difficultyRank(left.difficulty) - difficultyRank(right.difficulty));

  const anyTrack = allProblems
    .filter((problem) => problem.targetPatternId === patternId)
    .filter((problem) => !used.has(problem.id))
    .sort((left, right) => difficultyRank(left.difficulty) - difficultyRank(right.difficulty));

  const fallbackReuse = allProblems.filter((problem) => problem.targetPatternId === patternId);

  const chosen = inTrack[0] ?? anyTrack[0] ?? fallbackReuse[0] ?? allProblems[0];
  used.add(chosen.id);
  return chosen;
}

export function expandWeeklyPlanToDays(weeklyPlan: CurriculumWeeklyPlan, track: RoadmapTrack): CurriculumPlan {
  const used = new Set<string>();
  const days: CurriculumDay[] = [];
  let dayNumber = 0;

  for (const week of weeklyPlan.weeks) {
    for (let slot = 0; slot < 7; slot += 1) {
      dayNumber += 1;
      const studyMode = DAY_TEMPLATE[slot];
      const patternId = week.focusPatternIds[slot % week.focusPatternIds.length];
      const pattern = patternOptions.find((entry) => entry.id === patternId);

      if (studyMode === "review") {
        days.push({
          dayNumber,
          weekNumber: week.weekNumber,
          patternId: null,
          patternLabel: "Mixed review",
          studyMode: "review",
          problemIds: []
        });
        continue;
      }

      const problem = pickProblem(patternId, track, used);
      days.push({
        dayNumber,
        weekNumber: week.weekNumber,
        patternId,
        patternLabel: pattern?.label ?? problem.category,
        studyMode,
        problemIds: [problem.id]
      });
    }
  }

  return {
    headline: weeklyPlan.headline,
    rationale: weeklyPlan.rationale,
    totalWeeks: weeklyPlan.totalWeeks,
    dailyMinutes: weeklyPlan.dailyMinutes,
    days
  };
}
