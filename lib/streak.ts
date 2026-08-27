const ONE_DAY_MS = 86_400_000;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function computeStreak(checkinDates: string[]): number {
  const unique = Array.from(new Set(checkinDates)).sort((left, right) => (left < right ? 1 : -1));
  if (unique.length === 0) return 0;

  const today = new Date();
  const todayKey = dateKey(today);
  const yesterdayKey = dateKey(new Date(today.getTime() - ONE_DAY_MS));

  if (unique[0] !== todayKey && unique[0] !== yesterdayKey) return 0;

  let streak = 1;
  for (let index = 1; index < unique.length; index += 1) {
    const previous = new Date(`${unique[index - 1]}T00:00:00Z`).getTime();
    const current = new Date(`${unique[index]}T00:00:00Z`).getTime();
    if ((previous - current) / ONE_DAY_MS === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}
