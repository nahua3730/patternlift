import Link from "next/link";
import type { SessionUser } from "@/lib/auth";

const modeCards = [
  {
    href: "/learn/setup",
    number: "01",
    eyebrow: "Build the model",
    title: "Learn a pattern",
    body:
      "Understand the signals, invariant, and common lookalikes before solving a sequence of guided problems."
  },
  {
    href: "/recognize/setup",
    number: "02",
    eyebrow: "Test the instinct",
    title: "Recognize under pressure",
    body:
      "Commit to a pattern and explain why it fits before code can hide a weak read of the prompt."
  },
  {
    href: "/practice/setup",
    number: "03",
    eyebrow: "Prove the transfer",
    title: "Solve it cold",
    body:
      "Use a real editor and test runner, with an interviewer nearby only when you ask for a nudge."
  }
] as const;

export function HomePage({ currentUser }: { currentUser: SessionUser | null }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 pb-12">
      <header className="flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="text-base font-semibold tracking-[-0.02em] text-ink">PatternLift</span>
        </Link>
        <nav className="flex items-center gap-2">
          {currentUser ? (
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              Signed in as {currentUser.displayName || currentUser.email}
            </span>
          ) : (
            <>
              <Link
                href="/login"
                className="uiverse-button-secondary inline-flex items-center justify-center px-4 py-2 text-sm font-medium"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="uiverse-button inline-flex items-center justify-center px-4 py-2 text-sm font-medium"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="home-hero grid min-h-[38rem] overflow-hidden lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative z-10 flex flex-col justify-center px-7 py-14 sm:px-12 lg:px-16">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
            Adaptive interview training
          </div>
          <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
            Stop memorizing solutions.
            <span className="mt-2 block bg-[linear-gradient(90deg,#a5b4fc,#67e8f9)] bg-clip-text text-transparent">
              Train the pattern instinct.
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            PatternLift models what you recognize, what you confuse, and what you can still
            recall later—then turns every attempt into the next best drill.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={currentUser ? "/recognize/setup" : "/signup"}
              className="home-primary-cta inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
            >
              {currentUser ? "Start a recognition drill" : "Build your mastery profile"}
              <span aria-hidden="true">↗</span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-white/14 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See the learning loop
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            {["Mastery by pattern", "Confusion-pair detection", "Voice interview mode"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="text-cyan-300">✓</span>{item}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-signal relative flex items-center justify-center px-6 py-12 lg:px-10">
          <div className="mastery-preview w-full max-w-md">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Live mastery signal</p>
                <p className="mt-1 text-sm font-medium text-white">Your pattern model</p>
              </div>
              <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">Updating</span>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Sliding Window</p>
                    <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">62%</p>
                  </div>
                  <span className="rounded-lg border border-amber-300/15 bg-amber-300/10 px-2.5 py-1.5 text-xs font-medium text-amber-200">Building</span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-[62%] rounded-full bg-[linear-gradient(90deg,#818cf8,#22d3ee)]" />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  You recognize fixed windows, but choose Two Pointers when the valid window must shrink dynamically.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Confusion pair</p>
                  <p className="mt-3 text-sm font-semibold text-white">Two Pointers <span className="text-slate-500">→</span> Sliding Window</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Next recall</p>
                  <p className="mt-3 text-sm font-semibold text-white">Due tomorrow · 8 min</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-indigo-400 px-4 py-3.5 text-sm font-semibold text-slate-950">
                <span>Next drill: Minimum Size Subarray Sum</span>
                <span aria-hidden="true">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">The adaptive loop</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
            Every attempt changes what happens next.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            The product is not a solution generator. It is a feedback system for recognition,
            explanation, transfer, and long-term recall.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-4">
          {[
            ["01", "Commit", "Predict the pattern and explain the signal before seeing a solution."],
            ["02", "Diagnose", "Measure confidence, hints, explanation quality, and code results."],
            ["03", "Update", "Recalculate mastery and surface the exact pattern confusion."],
            ["04", "Schedule", "Choose the next drill and bring it back at the right recall interval."]
          ].map(([number, title, body]) => (
            <article key={number} className="bg-white p-6 sm:p-7">
              <span className="text-xs font-mono text-indigo-500">{number}</span>
              <h3 className="mt-8 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Choose your training mode</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">One system, three kinds of rep.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">Start guided, test recognition, then prove you can transfer the pattern without scaffolding.</p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {modeCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="mode-card group flex min-h-[290px] flex-col justify-between p-7"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{card.eyebrow}</p>
                <span className="font-mono text-xs text-slate-400">{card.number}</span>
              </div>
              <h3 className="mt-12 text-2xl font-semibold tracking-[-0.03em] text-ink">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{card.body}</p>
            </div>

            <div className="mt-8 flex items-center justify-between text-sm font-semibold text-indigo-600">
              <span>Start this mode</span>
              <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
        </div>
      </section>
    </div>
  );
}
