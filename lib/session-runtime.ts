import type { RemediationActivity } from "@/lib/remediation";
import type { SessionStep, SessionStepType } from "@/lib/session";
import type { SupportPlan } from "@/lib/support-plan";

// Client-safe session helpers. Keeping these outside lib/session prevents the
// browser from pulling in the server-side problem catalog merely to persist
// progress or construct a bounded remediation branch.
export function sessionStorageKey(planRunId: string, dayNumber: number): string {
  return `${planRunId}:${dayNumber}`;
}

export function buildRemediationBranch(params: {
  originalStep: SessionStep;
  activity: RemediationActivity;
  supportPlan: SupportPlan;
  freshProblemId?: string;
  freshProblemTitle?: string;
}): SessionStep[] {
  const { originalStep, activity, supportPlan, freshProblemId, freshProblemTitle } = params;
  const remediationStep: SessionStep = {
    id: `${originalStep.id}-remediation-${activity.id}`,
    type: "remediation",
    title: activity.title,
    estimatedMinutes: activity.estimatedMinutes,
    patternId: originalStep.patternId,
    patternLabel: originalStep.patternLabel,
    problemId: originalStep.problemId,
    problemTitle: originalStep.problemTitle,
    failureType: activity.failureType,
    remediationId: activity.id,
    studyTaskId: originalStep.studyTaskId
  };

  const retryProblemId = activity.nextAction === "fresh_problem" && freshProblemId ? freshProblemId : originalStep.problemId;
  const retryProblemTitle =
    activity.nextAction === "fresh_problem" && freshProblemTitle ? freshProblemTitle : originalStep.problemTitle;
  const retryType: SessionStepType = activity.nextAction === "fresh_recognition_prompt" ? "recall" : originalStep.type;
  const retryStep: SessionStep = {
    id: `${originalStep.id}-retry`,
    type: retryType,
    title:
      activity.nextAction === "fresh_recognition_prompt"
        ? `Fresh recognition: ${retryProblemTitle ?? "Problem"}`
        : activity.nextAction === "fresh_problem"
          ? `Transfer: ${retryProblemTitle ?? "Problem"}`
          : `Retry: ${retryProblemTitle ?? "Problem"}`,
    estimatedMinutes: originalStep.estimatedMinutes,
    patternId: originalStep.patternId,
    patternLabel: originalStep.patternLabel,
    problemId: retryProblemId,
    problemTitle: retryProblemTitle,
    coachStyle: supportPlan.coachStyle,
    retryOfStepId: originalStep.id,
    studyTaskId: originalStep.studyTaskId,
    supportPlan
  };
  return [remediationStep, retryStep];
}
