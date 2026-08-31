export type ReviewOutcome = "solid" | "partial" | "confused";

export function getReviewSchedule(
  outcome: ReviewOutcome,
  previousInterval = 0,
  options?: { isPriorityA?: boolean; repetitions?: number }
) {
  if (options?.isPriorityA && outcome === "solid" && (options.repetitions ?? 0) < 2) {
    const seedIntervals = [3, 4];
    const intervalDays = seedIntervals[options.repetitions ?? 0];
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + intervalDays);
    return { intervalDays, dueAt: dueAt.toISOString() };
  }

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
