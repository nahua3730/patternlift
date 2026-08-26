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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 pb-12">
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

      <section id="how-it-works" className="home-loop-stage scroll-mt-10">
        <div className="home-loop-copy">
          <p className="home-section-kicker">The adaptive loop</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl">
            Your mistakes become<br />the curriculum.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
            Every prediction, explanation, hint, and code result updates a living model of what you actually understand.
          </p>
          <div className="mt-9 grid grid-cols-3 gap-3">
            {[["12", "pattern signals"], ["4", "confusion pairs"], ["8m", "next recall"]].map(([value, label]) => (
              <div key={label} className="home-signal-stat"><p>{value}</p><span>{label}</span></div>
            ))}
          </div>
        </div>

        <div className="home-loop-console">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2"><span className="console-dot bg-rose-400" /><span className="console-dot bg-amber-300" /><span className="console-dot bg-emerald-300" /></div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Session intelligence</span>
          </div>
          <div className="p-5">
            {[
              ["01", "Commit", "Sliding Window · 72% confidence"],
              ["02", "Diagnose", "Confused with Two Pointers"],
              ["03", "Update", "Mastery signal +6"],
              ["04", "Schedule", "Recall tomorrow · 8 min"]
            ].map(([number, title, detail], index) => (
              <div key={number} className="home-loop-row">
                <span className={`home-loop-node ${index === 3 ? "home-loop-node-active" : ""}`}>{number}</span>
                <div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>
                {index < 3 ? <span className="ml-auto text-slate-700">→</span> : <span className="ml-auto rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] font-semibold text-cyan-200">Ready</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-mode-stage">
        <div className="home-mode-heading">
          <p className="home-section-kicker text-indigo-600">Three training gears</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">Build it. Spot it. Prove it.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">Move from guided understanding to cold recognition without losing the thread between sessions.</p>
        </div>

        <div className="home-mode-list">
          {modeCards.map((card, index) => (
            <Link key={card.href} href={card.href} className="home-mode-row group">
              <span className="home-mode-number">{card.number}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-500">{card.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{card.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{card.body}</p>
              </div>
              <div className="home-mode-visual" aria-hidden="true">
                <span style={{ height: `${36 + index * 16}%` }} /><span style={{ height: `${68 - index * 8}%` }} /><span style={{ height: `${52 + index * 10}%` }} />
              </div>
              <span className="home-mode-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-final-cta">
        <div>
          <p className="home-section-kicker text-cyan-300">Your next rep is not random</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Train the decision before the implementation.</h2>
        </div>
        <Link href={currentUser ? "/learn/setup" : "/signup"} className="home-final-button">{currentUser ? "Open your workspace" : "Start building mastery"}<span>→</span></Link>
      </section>
    </div>
  );
}
