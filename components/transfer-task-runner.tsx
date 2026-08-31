"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PatternPredictor } from "@/components/pattern-predictor";
import { PracticeWorkspace, type AttemptResult } from "@/components/practice-workspace";
import { RemediationStepView } from "@/components/remediation-step";
import { TransferResult } from "@/components/transfer-result";
import { diagnoseAttempt } from "@/lib/diagnosis";
import { confusionLabelForPrediction } from "@/lib/pattern-predictions";
import { patternOptions } from "@/lib/pattern-catalog";
import { getRemediationById, pickRemediation } from "@/lib/remediation";
import { transferImplementationFor } from "@/lib/study-plan";
import { mapPatternToTechniqueId } from "@/lib/techniques";
import type { BlindTransferTaskPayload, TransferTaskStateResponse } from "@/lib/transfer-contract";

type TransferPhase = "loading" | "predict" | "solve" | "remediation" | "retry" | "result";
type PersistedTransferState = {
  version: 1;
  phase: Extract<TransferPhase, "solve" | "remediation" | "retry" | "result">;
  solveGrade?: 0 | 1 | 2 | 3;
  remediationId?: string;
};

const STORAGE_PREFIX = "patternlift-transfer-v2a1:";

function storageKey(planRunId: string, dayNumber: number, studyTaskId: string) {
  return `${STORAGE_PREFIX}${planRunId}:${dayNumber}:${studyTaskId}`;
}

function readPersistedState(key: string): PersistedTransferState | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "null") as Partial<PersistedTransferState> | null;
    if (!value || value.version !== 1) return null;
    if (!value.phase || !["solve", "remediation", "retry", "result"].includes(value.phase)) return null;
    return value as PersistedTransferState;
  } catch {
    return null;
  }
}

function persistState(key: string, value: PersistedTransferState) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Server prediction remains authoritative; persistence is refresh UX only.
  }
}

export function TransferTaskRunner({
  task,
  planRunId,
  dayNumber,
  onAttempt,
  onGrade,
  onComplete
}: {
  task: BlindTransferTaskPayload;
  planRunId: string;
  dayNumber: number;
  onAttempt: (result: AttemptResult) => void;
  onGrade: (problemId: string, grade: 0 | 1 | 2 | 3) => void;
  onComplete: () => void;
  onExit?: () => void;
}) {
  const key = storageKey(planRunId, dayNumber, task.id);
  const [runtime, setRuntime] = useState<Extract<TransferTaskStateResponse, { state: "prediction_locked" }> | null>(null);
  const [phase, setPhase] = useState<TransferPhase>("loading");
  const [nextPhase, setNextPhase] = useState<TransferPhase | null>(null);
  const [solveGrade, setSolveGrade] = useState<0 | 1 | 2 | 3 | undefined>();
  const [remediationId, setRemediationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/transfer-tasks/${encodeURIComponent(task.id)}`, { cache: "no-store" });
    const body = (await response.json()) as TransferTaskStateResponse & { error?: string };
    if (!response.ok) throw new Error(body.error || "Could not load this pattern challenge.");
    if (body.state === "awaiting_prediction") {
      // Old answer-bearing session-step caches are deliberately not read by
      // this runner. With no server prediction, the only valid state is blind.
      try {
        window.localStorage.removeItem(key);
      } catch {}
      setRuntime(null);
      setPhase("predict");
      return;
    }

    setRuntime(body);
    const persisted = readPersistedState(key);
    const restoredPhase = persisted?.phase ?? "solve";
    setSolveGrade(persisted?.solveGrade);
    setRemediationId(persisted?.remediationId);
    setPhase(restoredPhase);
  }, [key, task.id]);

  useEffect(() => {
    hydrate().catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load this challenge."));
  }, [hydrate]);

  const remediation = useMemo(
    () => (remediationId ? getRemediationById(remediationId) : null),
    [remediationId]
  );

  if (error) return <div className="uiverse-panel p-6 text-sm text-red-500">{error}</div>;
  if (phase === "loading") return <div className="uiverse-panel p-6 text-sm text-black/40">Loading challenge…</div>;

  if (phase === "predict") {
    return (
      <PatternPredictor
        problemId={task.problemId}
        studyTaskId={task.id}
        onSubmitted={() => {
          setPhase("loading");
          hydrate().catch((caught) => setError(caught instanceof Error ? caught.message : "Could not unlock this challenge."));
        }}
      />
    );
  }

  if (!runtime) return <div className="uiverse-panel p-6 text-sm text-red-500">Locked runtime is unavailable.</div>;

  const recordAttempt = (rawResult: AttemptResult, retry: boolean) => {
    const predictedPatternId = runtime.prediction.predictedPatternId;
    const predictedLabel = predictedPatternId
      ? (patternOptions.find((pattern) => pattern.id === predictedPatternId)?.label ?? rawResult.selectedPatternLabel)
      : "Still exploring";
    const implementation = transferImplementationFor({
      codePassed: rawResult.codePassed,
      hintsUsed: rawResult.hintsUsed,
      highestHintLevel: rawResult.highestHintLevel,
      fallbackOutcome: rawResult.outcome
    });
    const finalGrade = retry ? Math.min(implementation.grade, 1) as 0 | 1 : implementation.grade;
    const result: AttemptResult = {
      ...rawResult,
      outcome: implementation.outcome,
      selectedPatternId: predictedPatternId as AttemptResult["selectedPatternId"],
      selectedPatternLabel: predictedLabel,
      correctPatternLabel: runtime.solve.patternLabel,
      confusedWith: confusionLabelForPrediction(predictedLabel, runtime.solve.patternLabel),
      diagnosis: diagnoseAttempt({
        selectedPatternLabel: predictedLabel,
        actualPatternLabel: runtime.solve.patternLabel,
        outcome: implementation.outcome,
        explanationScore: rawResult.explanationScore,
        codePassed: rawResult.codePassed,
        hintsUsed: rawResult.hintsUsed,
        confidence: rawResult.confidence
      }),
      studyTaskId: task.id,
      isRetryAfterRemediation: retry,
      remediationUsed: retry && remediationId ? [remediationId] : rawResult.remediationUsed
    };

    onAttempt(result);
    onGrade(result.problemId, finalGrade);
    setSolveGrade(finalGrade);

    const failureType = result.diagnosis?.primaryFailure;
    const needsRepair = implementation.outcome !== "solid" && !retry && Boolean(failureType);
    const activity = failureType ? pickRemediation(mapPatternToTechniqueId(runtime.solve.problem.targetPatternId), failureType) : null;
    const destination: TransferPhase = needsRepair && activity ? "remediation" : "result";
    if (activity) setRemediationId(activity.id);
    setNextPhase(destination);
    persistState(key, {
      version: 1,
      phase: destination === "remediation" ? "remediation" : "result",
      solveGrade: finalGrade,
      remediationId: activity?.id
    });
  };

  if (phase === "remediation") {
    if (!remediation) {
      return <TransferResult studyTaskId={task.id} solveGrade={solveGrade} onComplete={onComplete} />;
    }
    return (
      <RemediationStepView
        activity={remediation}
        onComplete={() => {
          setPhase("retry");
          persistState(key, { version: 1, phase: "retry", solveGrade, remediationId });
        }}
        onSkip={() => {
          setPhase("retry");
          persistState(key, { version: 1, phase: "retry", solveGrade, remediationId });
        }}
      />
    );
  }

  if (phase === "result") {
    return <TransferResult studyTaskId={task.id} solveGrade={solveGrade} onComplete={onComplete} />;
  }

  const retry = phase === "retry";
  return (
    <PracticeWorkspace
      key={`${task.id}-${retry ? "retry" : "solve"}`}
      initialProblemId={runtime.solve.problem.id}
      problemRuntime={runtime.solve.problem}
      problemCodeConfig={runtime.solve.codeConfig}
      hasNativeCodeConfig={runtime.solve.hasNativeCodeConfig}
      studyTaskId={task.id}
      mode="practice"
      coachStyle={runtime.solve.coachStyle}
      isRetryAfterRemediation={retry}
      remediationUsed={retry && remediationId ? [remediationId] : []}
      continueLabel={nextPhase === "remediation" ? "Continue to Repair" : "Continue to Result"}
      onAttempt={(result) => recordAttempt(result, retry)}
      onComplete={() => {
        const destination = nextPhase ?? "result";
        setPhase(destination);
        setNextPhase(null);
      }}
    />
  );
}
