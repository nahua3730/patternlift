"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type MasteryAgentPlan,
  type MasteryAgentRecommendation
} from "@/lib/mastery-agent";
import { allProblems, patternOptions } from "@/lib/product";

const modeCopy = {
  learn: { label: "Learn", description: "Understand the signal with active coaching." },
  recognize: { label: "Recognize", description: "Choose the pattern before implementation." },
  practice: { label: "Practice", description: "Solve independently and test transfer." }
} as const;

const coachCopy = {
  beginner: "Step-by-step",
  guided: "Adaptive",
  optional: "On demand"
} as const;

export function MasteryAgentStart() {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<MasteryAgentRecommendation | null>(null);
  const [plan, setPlan] = useState<MasteryAgentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const initialRequestStarted = useRef(false);

  const availableProblems = useMemo(() => {
    const supported = allProblems.filter((problem) => ["Easy", "Medium", "Hard"].includes(problem.difficulty));
    if (!plan) return supported;
    const matching = supported.filter((problem) => problem.targetPatternId === plan.patternId);
    return matching.length ? matching : supported;
  }, [plan]);

  useEffect(() => {
    if (initialRequestStarted.current) return;
    initialRequestStarted.current = true;
    void generateRecommendation();
  }, []);

  async function generateRecommendation() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mastery-agent/recommend", { method: "POST" });
      const payload = (await response.json()) as MasteryAgentRecommendation & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not build your session.");
      setRecommendation(payload);
      setPlan(payload.plan);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not build your session.");
    } finally {
      setLoading(false);
    }
  }

  function chooseProblem(problemId: string) {
    const problem = allProblems.find((entry) => entry.id === problemId);
    if (!problem || !plan) return;
    const pattern = patternOptions.find((entry) => entry.id === problem.targetPatternId);
    if (!pattern) return;
    setPlan({
      ...plan,
      problemId: problem.id,
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      patternId: pattern.id,
      patternLabel: pattern.label
    });
  }

  function choosePattern(patternId: string) {
    if (!plan) return;
    const pattern = patternOptions.find((entry) => entry.id === patternId);
    const problem =
      allProblems.find(
        (entry) => entry.targetPatternId === patternId && entry.difficulty === plan.difficulty
      ) ?? allProblems.find((entry) => entry.targetPatternId === patternId && ["Easy", "Medium", "Hard"].includes(entry.difficulty));
    if (!pattern || !problem) return;
    setPlan({
      ...plan,
      patternId: pattern.id,
      patternLabel: pattern.label,
      problemId: problem.id,
      problemTitle: problem.title,
      difficulty: problem.difficulty
    });
  }

  function chooseDifficulty(difficulty: string) {
    if (!plan) return;
    const problem =
      allProblems.find(
        (entry) => entry.targetPatternId === plan.patternId && entry.difficulty === difficulty
      ) ?? allProblems.find((entry) => entry.difficulty === difficulty);
    if (!problem) return;
    const pattern = patternOptions.find((entry) => entry.id === problem.targetPatternId)!;
    setPlan({
      ...plan,
      difficulty: problem.difficulty,
      problemId: problem.id,
      problemTitle: problem.title,
      patternId: pattern.id,
      patternLabel: pattern.label
    });
  }

  async function launchSession() {
    if (!recommendation || !plan) return;
    setLaunching(true);
    setError("");
    try {
      const response = await fetch("/api/mastery-agent/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: recommendation.runId, plan })
      });
      const payload = (await response.json()) as { href?: string; error?: string };
      if (!response.ok || !payload.href) {
        throw new Error(payload.error || "Could not start the session.");
      }
      router.push(payload.href);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the session.");
      setLaunching(false);
    }
  }

  if (loading) return <MasteryAgentLoading />;

  if (!plan || !recommendation) {
    return (
      <div className="mx-auto flex min-h-[32rem] max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-950">The session could not be prepared.</p>
          <p className="mt-2 text-sm text-slate-500">{error || "Please try once more."}</p>
          <button type="button" onClick={() => void generateRecommendation()} className="uiverse-button mt-6 px-5 py-3 text-sm font-semibold">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mastery-agent-page">
      <section className="mastery-agent-hero">
        <div>
          <div className="mastery-agent-live"><span /> Mastery Agent</div>
          <h2>Your next session is ready.</h2>
          <p>
            PatternLift reviewed your learning evidence and assembled one focused session.
            Accept it as-is or adjust anything before you start.
          </p>
        </div>
        <div className="mastery-agent-orbit" aria-hidden="true">
          <span className="mastery-agent-orbit-core">M</span>
          <i /><i /><i />
        </div>
      </section>

      <section className="mastery-agent-layout">
        <div className="mastery-agent-plan">
          <div className="mastery-agent-plan-heading">
            <div>
              <p className="product-kicker text-cyan-300">Recommended session</p>
              <h3>{plan.problemTitle}</h3>
            </div>
            <span>{plan.estimatedMinutes} min</span>
          </div>

          <div className="mastery-agent-focus">
            <span>Session focus</span>
            <p>{plan.focusSkill}</p>
          </div>

          <div className="mastery-agent-fields">
            <label>
              Pattern
              <select value={plan.patternId} onChange={(event) => choosePattern(event.target.value)}>
                {patternOptions.map((pattern) => <option key={pattern.id} value={pattern.id}>{pattern.label}</option>)}
              </select>
            </label>
            <label>
              Difficulty
              <select value={plan.difficulty} onChange={(event) => chooseDifficulty(event.target.value)}>
                {(["Easy", "Medium", "Hard"] as const).map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              Problem
              <select value={plan.problemId} onChange={(event) => chooseProblem(event.target.value)}>
                {availableProblems.map((problem) => <option key={problem.id} value={problem.id}>{problem.title} · {problem.difficulty}</option>)}
              </select>
            </label>
          </div>

          <div className="mastery-agent-mode-section">
            <p>Training goal</p>
            <div className="mastery-agent-modes">
              {(Object.keys(modeCopy) as Array<keyof typeof modeCopy>).map((mode) => {
                const active = plan.studyMode === mode;
                return (
                  <button key={mode} type="button" onClick={() => setPlan({ ...plan, studyMode: mode })} className={active ? "active" : ""}>
                    <span>{modeCopy[mode].label}</span>
                    <small>{modeCopy[mode].description}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mastery-agent-controls">
            <label>
              Coach support
              <select value={plan.coachStyle} onChange={(event) => setPlan({ ...plan, coachStyle: event.target.value as MasteryAgentPlan["coachStyle"] })}>
                {(Object.keys(coachCopy) as Array<keyof typeof coachCopy>).map((style) => <option key={style} value={style}>{coachCopy[style]}</option>)}
              </select>
            </label>
            <label>
              Session length
              <select value={plan.estimatedMinutes} onChange={(event) => setPlan({ ...plan, estimatedMinutes: Number(event.target.value) })}>
                {[10, 15, 20, 30, 45].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
              </select>
            </label>
          </div>

          {error ? <p className="mastery-agent-error">{error}</p> : null}
          <div className="mastery-agent-actions">
            <button type="button" onClick={() => void launchSession()} disabled={launching} className="mastery-agent-launch">
              <span>{launching ? "Opening workspace…" : "Start this session"}</span><span aria-hidden="true">→</span>
            </button>
            <button type="button" onClick={() => void generateRecommendation()} className="mastery-agent-secondary">Generate another</button>
          </div>
        </div>

        <aside className="mastery-agent-reasoning">
          <div className="mastery-agent-reasoning-head">
            <span className="mastery-agent-spark">✦</span>
            <div><p>Why this session</p><small>{Math.round(plan.confidence * 100)}% recommendation confidence</small></div>
          </div>
          <p className="mastery-agent-rationale">{plan.rationale}</p>
          <div className="mastery-agent-evidence">
            <span>Evidence used</span>
            <p>{plan.evidenceSummary}</p>
          </div>

          {plan.alternatives.length ? (
            <div className="mastery-agent-alternatives">
              <span>Good alternatives</span>
              {plan.alternatives.map((alternative) => (
                <button key={alternative.problemId} type="button" onClick={() => chooseProblem(alternative.problemId)}>
                  <span><strong>{alternative.problemTitle}</strong><small>{alternative.reason}</small></span><i>↗</i>
                </button>
              ))}
            </div>
          ) : null}

          <button type="button" onClick={() => setShowDetails((current) => !current)} className="mastery-agent-details-toggle">
            <span>How the agent decided</span><span>{showDetails ? "−" : "+"}</span>
          </button>
          {showDetails ? (
            <div className="mastery-agent-trace">
              {(recommendation.toolTrace.filter((item) => !item.startsWith("fallback:"))).map((tool, index) => (
                <div key={`${tool}-${index}`}><span>{index + 1}</span><p>{tool.replaceAll("_", " ")}</p></div>
              ))}
              {recommendation.source === "fallback" ? <p>Built from PatternLift&apos;s local mastery model while AI was unavailable.</p> : null}
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function MasteryAgentLoading() {
  const steps = ["Reading recent attempts", "Mapping mastery signals", "Selecting the next best problem"];
  return (
    <div className="mastery-agent-loading">
      <div className="mastery-agent-loading-mark"><span>✦</span></div>
      <p className="product-kicker text-indigo-500">Mastery Agent is working</p>
      <h2>Building one session around you.</h2>
      <div>
        {steps.map((step, index) => <p key={step} style={{ animationDelay: `${index * 240}ms` }}><span>{index + 1}</span>{step}</p>)}
      </div>
    </div>
  );
}
