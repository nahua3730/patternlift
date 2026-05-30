type HistoryItem = {
  id: string;
  problemTitle: string;
  selectedPatternLabel: string;
  outcome: "solid" | "partial" | "confused";
  insight: string;
};

type ProgressPanelProps = {
  totalAttempts: number;
  solidAttempts: number;
  reviewCount: number;
  currentStreak: number;
  history: HistoryItem[];
};

export function ProgressPanel({
  totalAttempts,
  solidAttempts,
  reviewCount,
  currentStreak,
  history
}: ProgressPanelProps) {
  const accuracy =
    totalAttempts === 0 ? 0 : Math.round((solidAttempts / totalAttempts) * 100);

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="uiverse-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-ember">
          Progress
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatCard label="Attempts" value={String(totalAttempts)} />
          <StatCard label="Strong Matches" value={String(solidAttempts)} />
          <StatCard label="Review Queue" value={String(reviewCount)} />
          <StatCard label="Current Streak" value={`${currentStreak} days`} />
        </div>

        <div className="mt-4 rounded-lg border border-black/10 bg-mist p-4">
          <p className="text-sm font-semibold text-ink">Pattern accuracy</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{accuracy}%</p>
          <p className="mt-2 text-sm leading-6 text-black/68">
            This is intentionally simple for now. The eventual version can split
            accuracy by pattern family and track improvement over time.
          </p>
        </div>
      </div>

      <div className="uiverse-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-lake">
          Attempt History
        </p>
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-black/10 bg-mist p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">
                  {item.problemTitle}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.outcome === "solid"
                      ? "bg-fern/20 text-fern"
                      : item.outcome === "partial"
                        ? "bg-lake/20 text-lake"
                        : "bg-ember/20 text-ember"
                  }`}
                >
                  {item.outcome}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-black/76">
                Pattern guessed: {item.selectedPatternLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-black/64">{item.insight}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-mist p-4">
      <p className="text-sm text-black/62">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
