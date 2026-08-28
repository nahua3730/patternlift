"use client";

// The one place in the workspace that always answers "what do I click
// now?" - a single primary action that changes with state, per V2.3.1's
// explicit Run / Submit / Continue model. Never shows more than one
// primary + one secondary action at a time.
export type SessionActionBarProps = {
  phase: "working" | "submitted";
  runSummary: { passed: number; total: number } | null;
  runnerError: string | null;
  isRunningCode: boolean;
  onRun: () => void;
  onSubmit: () => void;
  diagnosisSummary: string | null;
  outcome: "solid" | "partial" | "confused" | null;
  continueLabel: string;
  onContinue?: () => void;
  fallbackHref?: string;
};

function RunStatus({
  runSummary,
  runnerError,
  isRunningCode
}: {
  runSummary: { passed: number; total: number } | null;
  runnerError: string | null;
  isRunningCode: boolean;
}) {
  if (isRunningCode) {
    return <span className="session-action-status">Running…</span>;
  }
  if (runnerError) {
    return <span className="session-action-status session-action-status-warn">Code could not run</span>;
  }
  if (!runSummary) {
    return <span className="session-action-status session-action-status-muted">Not run yet</span>;
  }
  const allPassed = runSummary.passed === runSummary.total;
  return (
    <span className={`session-action-status ${allPassed ? "session-action-status-good" : "session-action-status-warn"}`}>
      {allPassed ? "✓ " : ""}
      {runSummary.passed} / {runSummary.total} tests passed
    </span>
  );
}

export function SessionActionBar({
  phase,
  runSummary,
  runnerError,
  isRunningCode,
  onRun,
  onSubmit,
  diagnosisSummary,
  outcome,
  continueLabel,
  onContinue,
  fallbackHref
}: SessionActionBarProps) {
  if (phase === "submitted") {
    return (
      <div className="session-action-bar session-action-bar-submitted">
        <div className="min-w-0">
          <p className={`session-action-recorded session-action-recorded-${outcome ?? "partial"}`}>Attempt recorded ✓</p>
          {diagnosisSummary ? <p className="session-action-summary">{diagnosisSummary}</p> : null}
        </div>
        {onContinue ? (
          <button type="button" onClick={onContinue} className="session-action-primary">
            {continueLabel} <span aria-hidden="true">→</span>
          </button>
        ) : fallbackHref ? (
          <a href={fallbackHref} className="session-action-primary">
            Practice something else <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="session-action-bar">
      <div className="min-w-0">
        <RunStatus runSummary={runSummary} runnerError={runnerError} isRunningCode={isRunningCode} />
        <p className="session-action-hint">
          You can submit even if it&apos;s not fully working - PatternLift will figure out what to practice next.
        </p>
      </div>
      <div className="session-action-buttons">
        <button type="button" onClick={onRun} disabled={isRunningCode} className="session-action-secondary">
          {isRunningCode ? "Running…" : "Run tests"}
        </button>
        <button type="button" onClick={onSubmit} className="session-action-primary">
          Submit attempt
        </button>
      </div>
    </div>
  );
}
