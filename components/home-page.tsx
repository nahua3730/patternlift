import Link from "next/link";

const modeCards = [
  {
    href: "/learn/setup",
    eyebrow: "Step 1",
    title: "Learning Mode",
    body:
      "Pick the patterns you actually want to learn, then move into a guided path of problems from easier reps into harder ones."
  },
  {
    href: "/recognize/setup",
    eyebrow: "Step 1",
    title: "Pattern Recognition",
    body:
      "Bring in a question, name the pattern you suspect, and let the coach sharpen your instinct before the code takes over."
  },
  {
    href: "/practice/setup",
    eyebrow: "Step 1",
    title: "Pure Practice",
    body:
      "Open the workspace, run code, and decide how much help you want sitting beside you while you solve."
  }
] as const;

export function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-6">
      <section className="home-hero px-4 py-10 text-center sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coral">
          PatternLift
        </p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          Learn coding patterns through a study flow that actually feels guided.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-black/68">
          Start with the kind of help you want today. Each mode takes you into
          its own path instead of dumping the whole app in your lap at once.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {modeCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="mode-card flex min-h-[270px] flex-col justify-between p-7"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
                {card.eyebrow}
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-ink">{card.title}</h2>
              <p className="mt-4 text-sm leading-7 text-black/68">{card.body}</p>
            </div>

            <div className="mt-8 flex items-center justify-between text-sm font-medium text-ink">
              <span>Open this path</span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          "Pick one mode instead of juggling everything.",
          "Keep the coach close even when you are not in guided mode.",
          "Move from pattern choice to real coding without a messy jump."
        ].map((line) => (
          <div key={line} className="uiverse-panel p-5 text-sm leading-6 text-black/64">
            {line}
          </div>
        ))}
      </section>
    </div>
  );
}
