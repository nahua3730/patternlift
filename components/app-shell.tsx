"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalCoachDock } from "@/components/global-coach-dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const shellMeta = (() => {
    if (pathname === "/learn/setup") {
      return {
        eyebrow: "Learning Mode",
        title: "Choose your focus",
        body: "Pick the pattern families you want before we suggest problems.",
        backHref: "/",
        backLabel: "Back to modes",
        utilityLinks: []
      };
    }

    if (pathname === "/learn") {
      return {
        eyebrow: "Learning Mode",
        title: "Choose a problem to begin",
        body: "Set the coaching tone, then open the question you want to learn through.",
        backHref: "/learn/setup",
        backLabel: "Back to pattern choices",
        utilityLinks: []
      };
    }

    if (pathname === "/recognize/setup") {
      return {
        eyebrow: "Pattern Recognition",
        title: "Set up your coaching style",
        body: "Choose how active the coach should be before the recognition workspace opens.",
        backHref: "/",
        backLabel: "Back to modes",
        utilityLinks: []
      };
    }

    if (pathname === "/practice/setup") {
      return {
        eyebrow: "Pure Practice",
        title: "Set up your practice workspace",
        body: "Choose how much help stays nearby while you solve.",
        backHref: "/",
        backLabel: "Back to modes",
        utilityLinks: []
      };
    }

    if (pathname === "/practice") {
      return {
        eyebrow: "Workspace",
        title: "Solve with the flow you picked",
        body: "Stay with the current mode, then check progress or review when you’re ready.",
        backHref: "/",
        backLabel: "Mode selection",
        utilityLinks: [
          { href: "/progress", label: "Progress" },
          { href: "/review", label: "Review" }
        ]
      };
    }

    if (pathname === "/progress") {
      return {
        eyebrow: "Progress",
        title: "Look back before the next rep",
        body: "See what’s clicking, what still needs review, and where to return next.",
        backHref: "/practice/setup",
        backLabel: "Back to practice flow",
        utilityLinks: [{ href: "/review", label: "Review queue" }]
      };
    }

    if (pathname === "/review") {
      return {
        eyebrow: "Review",
        title: "Come back to what almost slipped",
        body: "Use weak spots as the next study step instead of starting cold again.",
        backHref: "/practice/setup",
        backLabel: "Back to practice flow",
        utilityLinks: [{ href: "/progress", label: "Progress" }]
      };
    }

    return {
      eyebrow: "PatternLift",
      title: "Move through one step at a time",
      body: "Choose a mode, follow the next step, and stay inside one flow.",
      backHref: "/",
      backLabel: "Home",
      utilityLinks: []
    };
  })();

  return (
    <div className="min-h-screen">
      {isHome ? (
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-80">
            {children}
          </div>
        </div>
      ) : (
        <div className="app-frame px-4 py-4 sm:px-5 sm:py-5">
          <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[92rem] gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="app-sidebar hidden lg:flex">
              <Link href="/" className="app-logo">
                <span className="app-logo-mark">PL</span>
                <span>
                  <span className="block text-sm font-semibold text-ink">PatternLift</span>
                  <span className="block text-xs text-black/54">
                    LeetCode coach, but calmer
                  </span>
                </span>
              </Link>

              <nav className="mt-8 space-y-2">
                {[
                  { href: "/learn/setup", match: "/learn", label: "Learn", helper: "Pick patterns and start guided reps" },
                  { href: "/recognize/setup", match: "/recognize", label: "Recognize", helper: "Sharpen pattern instinct fast" },
                  { href: "/practice/setup", match: "/practice", label: "Practice", helper: "Solve with code and tests" },
                  { href: "/progress", match: "/progress", label: "Progress", helper: "See what is sticking" },
                  { href: "/review", match: "/review", label: "Review", helper: "Come back to weak spots" }
                ].map((item) => {
                  const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                    >
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className={`mt-1 block text-xs ${active ? "text-white/76" : "text-black/52"}`}>
                        {item.helper}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto rounded-[8px] border border-black/8 bg-white/72 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
                  Current flow
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{shellMeta.title}</p>
                <p className="mt-2 text-sm leading-6 text-black/60">{shellMeta.body}</p>
              </div>
            </aside>

            <main className="flex min-w-0 flex-col gap-5 pb-80">
              <header className="page-hero">
                <div className="max-w-3xl">
                  <Link
                    href={shellMeta.backHref}
                    className="text-sm font-medium text-black/58 transition hover:text-black/84"
                  >
                    ← {shellMeta.backLabel}
                  </Link>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-coral">
                    {shellMeta.eyebrow}
                  </p>
                  <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {shellMeta.title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-black/64">
                    {shellMeta.body}
                  </p>
                </div>

                {shellMeta.utilityLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {shellMeta.utilityLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="coach-chip px-4 py-2 text-sm font-medium text-black/70"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </header>

              {children}
            </main>
          </div>
        </div>
      )}

      <GlobalCoachDock />
    </div>
  );
}
