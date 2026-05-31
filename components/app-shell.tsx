"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="min-h-screen px-6 py-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {isHome ? null : (
          <header className="uiverse-panel flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Link
                href={shellMeta.backHref}
                className="text-sm font-medium text-black/58 transition hover:text-black/84"
              >
                ← {shellMeta.backLabel}
              </Link>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-ember">
                {shellMeta.eyebrow}
              </p>
              <p className="mt-2 text-xl font-semibold text-ink">{shellMeta.title}</p>
              <p className="mt-2 text-sm leading-6 text-black/66">{shellMeta.body}</p>
            </div>

            {shellMeta.utilityLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {shellMeta.utilityLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-black/10 bg-white/82 px-4 py-2 text-sm font-medium text-black/70 transition hover:border-black/20 hover:text-black/88"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>
        )}

        {children}
      </div>
    </div>
  );
}
