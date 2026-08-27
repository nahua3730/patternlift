export type MasteryTier = "none" | "seen" | "practiced" | "mastered";

export function tierForReps(reps: number): MasteryTier {
  if (reps >= 3) return "mastered";
  if (reps === 2) return "practiced";
  if (reps === 1) return "seen";
  return "none";
}

export const TIER_LABEL: Record<MasteryTier, string> = {
  none: "Not started",
  seen: "1 rep",
  practiced: "2 reps",
  mastered: "3+ reps · mastered"
};
