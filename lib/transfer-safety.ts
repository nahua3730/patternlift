import { allProblems } from "@/lib/product";
import type { CurriculumDay, CurriculumPlan } from "@/lib/curriculum-agent";
import type { StudyTask } from "@/lib/study-plan";
import {
  MIN_DAYS_BETWEEN_PRACTICE_AND_TRANSFER,
  MIN_DAYS_BETWEEN_TRANSFERS
} from "@/lib/transfer-policy";

function taskTouchesPattern(task: StudyTask, patternId: string) {
  if (task.patternId === patternId) return true;
  if (!task.problemId) return false;
  const problem = allProblems.find((entry) => entry.id === task.problemId);
  return problem?.targetPatternId === patternId || problem?.contrastPatternId === patternId;
}

export function isPedagogicallyBlindTransfer(input: {
  plan: Pick<CurriculumPlan, "days">;
  day: CurriculumDay;
  task: StudyTask;
}) {
  const { plan, day, task } = input;
  const patternId = task.patternId;
  if (task.type !== "transfer" || !patternId || !task.problemId) return false;
  if (day.patternId === patternId) return false;

  const earlierDays = plan.days.filter((entry) => entry.dayNumber < day.dayNumber);
  const learnDays = earlierDays.filter((entry) =>
    (entry.tasks ?? []).some((candidate) => candidate.type === "learn" && candidate.patternId === patternId)
  );
  const practiceDays = earlierDays.filter((entry) =>
    (entry.tasks ?? []).some((candidate) => candidate.type === "practice" && candidate.patternId === patternId)
  );
  const latestLearn = learnDays.at(-1)?.dayNumber;
  const latestPractice = practiceDays.at(-1)?.dayNumber;
  if (latestLearn == null || latestPractice == null) return false;
  if (day.dayNumber - Math.max(latestLearn, latestPractice) < MIN_DAYS_BETWEEN_PRACTICE_AND_TRANSFER) return false;

  const previousTransfers = earlierDays
    .flatMap((entry) => entry.tasks ?? [])
    .filter((candidate) => candidate.type === "transfer" && candidate.patternId === patternId);
  if (previousTransfers.length > 0) {
    const previousTransferDay = earlierDays
      .filter((entry) => (entry.tasks ?? []).some((candidate) => candidate.id === previousTransfers.at(-1)?.id))
      .at(-1)?.dayNumber;
    if (previousTransferDay != null && day.dayNumber - previousTransferDay < MIN_DAYS_BETWEEN_TRANSFERS) return false;
  }

  // Conservative same-day rule: no other task may teach, practice, recall,
  // review, or contrast the hidden pattern before the encounter. The runtime
  // can reorder steps, but generation should not rely on that to rescue a
  // pedagogically contaminated day.
  return !(day.tasks ?? []).some((candidate) => candidate.id !== task.id && taskTouchesPattern(candidate, patternId));
}
