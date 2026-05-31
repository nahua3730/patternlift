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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section className="uiverse-panel px-6 py-8 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          {mode === "login"
            ? "Log in and pick up where you left off."
            : "Sign up so your practice, reviews, and coach history stay yours."}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/68">
          {mode === "login"
            ? "Your workspace, review queue, and progress will be right where you left them."
            : "Once you have an account, your study history follows you instead of living in one browser session."}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={handleSubmit} className="uiverse-panel space-y-5 px-6 py-6 md:px-8">
          {mode === "signup" ? (
            <label className="block text-sm font-medium text-ink">
              Name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="uiverse-field mt-2 block w-full px-4 py-3 text-sm text-ink"
                placeholder="What should we call you?"
              />
            </label>
          ) : null}

          <label className="block text-sm font-medium text-ink">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="uiverse-field mt-2 block w-full px-4 py-3 text-sm text-ink"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="uiverse-field mt-2 block w-full px-4 py-3 text-sm text-ink"
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

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="uiverse-button inline-flex items-center justify-center px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>

            <Link
              href="/"
              className="uiverse-button-secondary inline-flex items-center justify-center px-5 py-3 text-sm font-medium"
            >
              Back home
            </Link>
          </div>
        </form>

        <aside className="uiverse-panel px-6 py-6">
          <p className="text-lg font-semibold text-ink">
            {mode === "login" ? "Need an account first?" : "Already have an account?"}
          </p>
          <p className="mt-3 text-sm leading-7 text-black/66">
            {mode === "login"
              ? "Create one first and we’ll bring you right back into your study flow."
              : "Log in instead and keep your current practice history together."}
          </p>
          <Link
            href={companionHref}
            className="uiverse-button-secondary mt-5 inline-flex items-center justify-center px-5 py-3 text-sm font-medium"
          >
            {mode === "login" ? "Go to sign up" : "Go to log in"}
          </Link>
        </aside>
      </div>
    </div>
  );
}
