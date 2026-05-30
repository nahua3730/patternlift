"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/techniques", label: "Techniques" },
  { href: "/progress", label: "Progress" },
  { href: "/review", label: "Review" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-6 py-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="uiverse-panel flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ember">
              PatternLift
            </p>
            <p className="mt-2 text-sm leading-6 text-black/68">
              Learn the pattern, test the reasoning, and review the weak edges.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-ink text-white shadow-sm"
                      : "border border-black/10 bg-white/80 text-black/72 hover:border-black/24"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
