import type { SessionStep } from "@/lib/session";

// Short, orienting copy per step type - never a tutorial card, just enough
// that a first-time learner knows what they're looking at and what to do.
// Retry framing takes priority over the base type (V2.3.1 Part 9): a retry
// should never look like a fresh, unrelated step.
function introFor(step: SessionStep): { title: string; body: string } {
  if (step.retryOfStepId) {
    return {
      title: `Retry · ${step.problemTitle ?? "this problem"}`,
      body: "You just practiced the part that caused trouble. Try the problem again."
    };
  }

  switch (step.type) {
    case "recall":
      return {
        title: "Recall before looking",
        body: "Try reconstructing the idea from memory before asking for any help."
      };
    case "guided_problem":
      return {
        title: `Guided practice · ${step.problemTitle ?? "this problem"}`,
        body: "Start on your own. If you get stuck, ask for a hint - then submit whatever you have, even if it's not finished."
      };
    case "independent_problem":
      return {
        title: "Solve it on your own",
        body: "Try this one with less support. Do your best before asking for help, then submit your attempt."
      };
    case "contrast":
      return {
        title: "Which pattern fits?",
        body: "Compare the clues and choose the technique that best matches this problem."
      };
    case "remediation":
      return {
        title: "Let's fix one thing",
        body: "Your last attempt suggests one small idea needs reinforcement. Complete this short exercise, then try again."
      };
    case "reflection":
      return {
        title: "Explain it back",
        body: "In one or two sentences, explain why this technique works here."
      };
    case "learn":
      return {
        title: `Learn · ${step.patternLabel ?? "this pattern"}`,
        body: "A quick orientation before you practice - read it, then continue."
      };
    case "blind_prediction":
      return {
        title: "Pattern prediction",
        body: "What pattern would you try first? Lock in your guess before you start solving."
      };
    case "transfer_result":
      return {
        title: "Recognition & solve result",
        body: "Here's how your prediction and your solve compare - kept as two separate results."
      };
    case "transfer_encounter":
      return {
        title: "Pattern challenge",
        body: "Lock in the pattern you would try before the solve workspace is unlocked."
      };
  }
}

export function SessionStepIntro({ step }: { step: SessionStep }) {
  const { title, body } = introFor(step);
  return (
    <div className="session-step-intro">
      <p className="session-step-intro-title">{title}</p>
      <p className="session-step-intro-body">{body}</p>
    </div>
  );
}
