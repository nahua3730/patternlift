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
      <section className="px-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ember">
          PatternLift
        </p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          Learn coding patterns through a flow that feels like a real study app.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-black/68">
          Start by choosing how you want to work today. Each mode takes you into
          its own next step instead of dropping everything onto one screen.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {modeCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="uiverse-panel flex min-h-[250px] flex-col justify-between p-7 transition hover:-translate-y-0.5 hover:border-black/18"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lake">
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
    </div>
  );
}
