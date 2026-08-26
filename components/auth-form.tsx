"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string;
};

export function AuthForm({ mode, nextPath = "/" }: AuthFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const companionHref = useMemo(() => {
    const params = new URLSearchParams();
    if (nextPath && nextPath !== "/") {
      params.set("next", nextPath);
    }

    return `/${mode === "login" ? "signup" : "login"}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
  }, [mode, nextPath]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName,
          email,
          password
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Something went wrong.");
      }

      router.push(nextPath);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <section className="auth-story">
        <div>
          <p className="auth-kicker">Adaptive mastery, not answer memorization</p>
          <h1 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl">
            {mode === "login" ? "Your pattern model is waiting." : "Build an interview instinct that compounds."}
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            {mode === "login"
              ? "Return to your active drills, recall schedule, and the exact pattern confusions you were working through."
              : "PatternLift watches how you recognize, explain, and recall each pattern—then chooses the next useful rep."}
          </p>
        </div>
        <div className="auth-signal">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Your learning signal</span>
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <SignalStat value="12" label="Patterns" />
            <SignalStat value="4" label="Weak pairs" />
            <SignalStat value="8m" label="Next rep" />
          </div>
        </div>
      </section>

      <section className="auth-form-pane">
        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            {mode === "login" ? "Welcome back" : "Create account"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950">
            {mode === "login" ? "Log in to PatternLift" : "Start your mastery profile"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {mode === "login" ? "Continue from your last training session." : "Free to start. Your progress stays synced across sessions."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {mode === "signup" ? (
            <label className="auth-label">
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="uiverse-field mt-2 block w-full px-4 py-3.5 text-sm text-ink"
                placeholder="How should we address you?"
              />
            </label>
          ) : null}

          <label className="auth-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="uiverse-field mt-2 block w-full px-4 py-3.5 text-sm text-ink"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="uiverse-field mt-2 block w-full px-4 py-3.5 text-sm text-ink"
              placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </label>

          {error ? (
            <div className="rounded-[8px] border border-coral/22 bg-coral/8 px-4 py-3 text-sm text-coral">
              {error}
            </div>
          ) : null}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="uiverse-button inline-flex w-full items-center justify-center px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>

          </div>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            {mode === "login" ? "New to PatternLift?" : "Already have an account?"}{" "}
            <Link href={companionHref} className="font-semibold text-indigo-600 transition hover:text-indigo-500">
              {mode === "login" ? "Create an account" : "Log in instead"}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function SignalStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-4">
      <p className="text-xl font-semibold tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
