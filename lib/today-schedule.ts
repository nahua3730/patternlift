// Pilot Foundation: the smallest possible budget-fill primitive for
// carryover Core work - deliberately the same shape as study-plan.ts's
// bucketTasks (index 0 always fits, then a running-total greedy fill), NOT
// a second scheduler. Used to split a set of required tasks into what
// fits today's guaranteed minutes ("active") versus what stays queued for
// a later day - it never changes any task's persisted bucket, it only
// decides a presentation-layer partition, recomputed fresh on every call.
export function splitByBudget<T extends { estimatedMinutes: number }>(
  tasks: T[],
  guaranteedMinutes: number
): { active: T[]; queued: T[] } {
  let runningTotal = 0;
  const active: T[] = [];
  const queued: T[] = [];

  tasks.forEach((task, index) => {
    if (index === 0 || runningTotal + task.estimatedMinutes <= guaranteedMinutes) {
      active.push(task);
      runningTotal += task.estimatedMinutes;
    } else {
      queued.push(task);
    }
  });

  return { active, queued };
}
