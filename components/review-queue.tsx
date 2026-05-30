type ReviewItem = {
  id: string;
  problemTitle: string;
  targetPatternLabel: string;
  contrastPatternLabel: string;
  reviewQuestion: string;
  urgency: "high" | "medium";
};

type ReviewQueueProps = {
  items: ReviewItem[];
};

export function ReviewQueue({ items }: ReviewQueueProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-black/10 bg-white/75 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-ember">
          Review Queue
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">
          Bring weak pattern edges back while they are still fresh.
        </h2>
        <p className="mt-4 text-sm leading-7 text-black/68">
          The review loop is the heart of the app: missed distinctions become
          future drills instead of disappearing into the void.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-black/10 bg-ink p-5 text-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">
                {item.problemTitle}
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.urgency === "high"
                    ? "bg-ember/20 text-ember"
                    : "bg-lake/20 text-lake"
                }`}
              >
                {item.urgency} priority
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/74">
              Review {item.targetPatternLabel} against {item.contrastPatternLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/66">
              {item.reviewQuestion}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
