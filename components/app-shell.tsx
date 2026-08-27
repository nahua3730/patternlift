"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GlobalCoachDock } from "@/components/global-coach-dock";
import { LogoutButton } from "@/components/logout-button";
import type { SessionUser } from "@/lib/auth";

type NavIcon = "learn" | "recognize" | "practice" | "progress" | "review" | "roadmap" | "today" | "techniques" | "series";

const navigation: Array<{ href: string; match: string; label: string; icon: NavIcon }> = [
  { href: "/today", match: "/today", label: "Today", icon: "today" },
  { href: "/roadmap", match: "/roadmap", label: "Roadmap", icon: "roadmap" },
  { href: "/progress", match: "/progress", label: "Progress", icon: "progress" },
  { href: "/review", match: "/review", label: "Review", icon: "review" },
  { href: "/start", match: "/start", label: "Quick pick", icon: "practice" },
  { href: "/learn/setup", match: "/learn", label: "My Path", icon: "learn" },
  { href: "/recognize/setup", match: "/recognize", label: "Recognize", icon: "recognize" },
  { href: "/techniques", match: "/techniques", label: "Techniques", icon: "techniques" },
  { href: "/fundamentals", match: "/fundamentals", label: "Fundamentals Series", icon: "series" }
];

const PRACTICE_NAV_COUNT = 2;
const INSIGHTS_NAV_COUNT = 2;

const pageMeta: Record<string, { eyebrow: string; title: string; backHref: string }> = {
  "/start": { eyebrow: "Quick pick", title: "Your next session", backHref: "/" },
  "/learn/setup": { eyebrow: "Learning path", title: "Choose your focus", backHref: "/" },
  "/learn": { eyebrow: "Learning path", title: "Build your session", backHref: "/learn/setup" },
  "/recognize/setup": { eyebrow: "Recognition", title: "Set your coaching level", backHref: "/" },
  "/practice/setup": { eyebrow: "Practice", title: "Set your coaching level", backHref: "/" },
  "/practice/select": { eyebrow: "Practice", title: "Select a problem", backHref: "/practice/setup" },
  "/practice": { eyebrow: "Inline coach", title: "Problem workspace", backHref: "/" },
  "/today": { eyebrow: "Today", title: "Your daily plan", backHref: "/" },
  "/onboarding": { eyebrow: "Onboarding", title: "Build your plan", backHref: "/" },
  "/roadmap": { eyebrow: "Roadmap", title: "Blind 75 & NeetCode 150", backHref: "/" },
  "/progress": { eyebrow: "Analytics", title: "Mastery dashboard", backHref: "/" },
  "/review": { eyebrow: "Recall", title: "Review queue", backHref: "/" },
  "/techniques": { eyebrow: "Library", title: "Technique library", backHref: "/" },
  "/fundamentals": { eyebrow: "Curated series", title: "Fundamentals series", backHref: "/" }
};

export function AppShell({ children, currentUser }: { children: React.ReactNode; currentUser: SessionUser | null }) {
  const pathname = usePathname();
  const [railCollapsed, setRailCollapsed] = useState(false);
  const isHome = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isPracticeWorkspace = pathname === "/practice";
  const meta =
    pageMeta[pathname] ??
    (pathname.startsWith("/fundamentals/")
      ? { eyebrow: "Curated series", title: "Watch & practice", backHref: "/fundamentals" }
      : { eyebrow: "PatternLift", title: "Workspace", backHref: "/" });

  if (isHome) {
    return (
      <div className="min-h-screen">
        <div className="px-4 py-5 sm:px-7 sm:py-7">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </div>
        <GlobalCoachDock />
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className="auth-shell min-h-screen">
        <header className="auth-shell-header">
          <Brand dark={false} />
          <Link href="/" className="auth-home-link">Back to home <span aria-hidden="true">↗</span></Link>
        </header>
        <main className="auth-shell-main">{children}</main>
      </div>
    );
  }

  return (
    <div className="product-shell min-h-screen">
      <aside className={`product-rail hidden lg:flex ${railCollapsed ? "product-rail-collapsed" : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <Brand dark compact={railCollapsed} />
          <button
            type="button"
            className="rail-collapse-button"
            onClick={() => setRailCollapsed((current) => !current)}
            aria-label={railCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={railCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {railCollapsed ? "→" : "←"}
          </button>
        </div>
        <div className="mt-10">
          <p className={`rail-section-label ${railCollapsed ? "sr-only" : ""}`}>Practice</p>
          <nav className="mt-3 space-y-1">
            {navigation.slice(0, PRACTICE_NAV_COUNT).map((item) => <RailLink key={item.href} item={item} pathname={pathname} />)}
          </nav>
        </div>
        <div className="mt-8">
          <p className={`rail-section-label ${railCollapsed ? "sr-only" : ""}`}>Insights</p>
          <nav className="mt-3 space-y-1">
            {navigation.slice(PRACTICE_NAV_COUNT, PRACTICE_NAV_COUNT + INSIGHTS_NAV_COUNT).map((item) => <RailLink key={item.href} item={item} pathname={pathname} />)}
          </nav>
        </div>
        <div className="mt-8">
          <p className={`rail-section-label ${railCollapsed ? "sr-only" : ""}`}>More ways to practice</p>
          <nav className="mt-3 space-y-1">
            {navigation.slice(PRACTICE_NAV_COUNT + INSIGHTS_NAV_COUNT).map((item) => <RailLink key={item.href} item={item} pathname={pathname} />)}
          </nav>
        </div>
        <div className="rail-account mt-auto">
          <div className="rail-avatar" aria-hidden="true">
            {(currentUser?.displayName || currentUser?.email || "P").slice(0, 1).toUpperCase()}
          </div>
          <div className={`min-w-0 flex-1 ${railCollapsed ? "hidden" : ""}`}>
            <p className="truncate text-sm font-medium text-white">{currentUser?.displayName || "Your workspace"}</p>
            <p className="truncate text-xs text-slate-500">{currentUser?.email}</p>
          </div>
          <LogoutButton className={`rail-logout ${railCollapsed ? "hidden" : ""}`} aria-label="Log out">↗</LogoutButton>
        </div>
      </aside>

      <div className={`product-stage min-w-0 flex-1 ${railCollapsed ? "product-stage-expanded" : ""}`}>
        <header className="mobile-product-header lg:hidden">
          <Brand dark={false} />
          <span className="status-dot" aria-label="Synced" />
        </header>
        <header className="product-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={meta.backHref} className="topbar-back" aria-label="Go back"><span aria-hidden="true">←</span></Link>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{meta.eyebrow}</p>
              <h1 className="truncate text-base font-semibold tracking-[-0.02em] text-slate-900">{meta.title}</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="status-dot" />
            <span className="text-xs font-medium text-slate-500">Synced</span>
          </div>
        </header>
        <main className={`workspace-content ${isPracticeWorkspace ? "workspace-content-wide" : ""}`}>{children}</main>
      </div>
      <MobileTabBar pathname={pathname} />
    </div>
  );
}

function RailLink({ item, pathname }: { item: (typeof navigation)[number]; pathname: string }) {
  const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
  return (
    <Link href={item.href} className={`rail-link ${active ? "rail-link-active" : ""}`}>
      <NavGlyph icon={item.icon} />
      <span className="rail-link-label">{item.label}</span>
      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" /> : null}
    </Link>
  );
}

function Brand({ dark, compact = false }: { dark: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className={`brand-mark ${dark ? "brand-mark-rail" : ""}`} aria-hidden="true"><span /><span /><span /></span>
      <span className={compact ? "hidden" : ""}>
        <span className={`block text-sm font-semibold tracking-[-0.02em] ${dark ? "text-white" : "text-slate-900"}`}>PatternLift</span>
        <span className="block text-[11px] text-slate-500">Adaptive mastery</span>
      </span>
    </Link>
  );
}

function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav className="mobile-tab-bar lg:hidden" aria-label="Primary navigation">
      {navigation.map((item) => {
        const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
        return (
          <Link key={item.href} href={item.href} className={active ? "mobile-tab-active" : ""}>
            <NavGlyph icon={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function NavGlyph({ icon }: { icon: NavIcon }) {
  const paths: Record<NavIcon, React.ReactNode> = {
    learn: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v14H6.5A2.5 2.5 0 0 0 4 19.5v-14Zm16 0A2.5 2.5 0 0 0 17.5 3H13v14h4.5a2.5 2.5 0 0 1 2.5 2.5v-14Z" />,
    recognize: <><circle cx="12" cy="12" r="3" /><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /></>,
    practice: <><path d="m8 16 8-8" /><path d="m14 6 4 4" /><path d="M6 18h4l9-9a2.8 2.8 0 0 0-4-4l-9 9v4Z" /></>,
    progress: <><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19V2" /></>,
    review: <><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h6" /></>,
    roadmap: <><rect x="3" y="4" width="18" height="5" rx="1.4" /><rect x="3" y="15" width="18" height="5" rx="1.4" /></>,
    today: <><path d="M3 10.5 10 4l7 6.5" /><path d="M5 9v7h10V9" /></>,
    techniques: <><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-6 6c0 2.5 1.5 3.5 2 5h8c.5-1.5 2-2.5 2-5a6 6 0 0 0-6-6Z" /></>,
    series: <><rect x="2.5" y="4.5" width="19" height="14" rx="2" /><path d="m10.5 9 4.5 3-4.5 3Z" /></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[icon]}</svg>;
}
