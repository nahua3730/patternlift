"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { allProblems, getOfficialProblemRoadmapMeta, patternOptions, type AppProblem } from "@/lib/product";

type CoachStyle = "beginner" | "guided" | "optional" | "off";
type LearningModeProps = { patternIds: string[]; coachStyle: CoachStyle };

const difficultyRank: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2, Official: 3 };
const coachChoices: Array<{ id: CoachStyle; title: string; detail: string; badge?: string }> = [
  { id: "guided", title: "Adaptive", detail: "Quiet on routine steps; more present when you drift.", badge: "Recommended" },
  { id: "beginner", title: "Step-by-step", detail: "More explanation and smaller next steps.", badge: "Best for first reps" },
  { id: "optional", title: "On demand", detail: "No automatic feedback until you ask." }
];

export function LearningMode({ patternIds, coachStyle }: LearningModeProps) {
  const selectedPatterns = useMemo(() => patternOptions.filter((pattern) => patternIds.includes(pattern.id)), [patternIds]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPatternId, setSelectedPatternId] = useState(selectedPatterns[0]?.id ?? patternIds[0] ?? patternOptions[0].id);
  const [selectedCoachStyle, setSelectedCoachStyle] = useState<CoachStyle>(coachStyle);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const selectedPattern = selectedPatterns.find((pattern) => pattern.id === selectedPatternId) ?? selectedPatterns[0] ?? patternOptions[0];

  const problems = useMemo(() => allProblems
    .filter((problem) => problem.targetPatternId === selectedPatternId)
    .sort((left, right) => {
      const difficultyGap = (difficultyRank[left.difficulty] ?? 99) - (difficultyRank[right.difficulty] ?? 99);
      if (difficultyGap !== 0) return difficultyGap;
      const leftOfficial = getOfficialProblemRoadmapMeta(left.id)?.tracks.length ?? 0;
      const rightOfficial = getOfficialProblemRoadmapMeta(right.id)?.tracks.length ?? 0;
      return rightOfficial - leftOfficial || left.title.localeCompare(right.title);
    })
    .slice(0, 4), [selectedPatternId]);

  const recommendedProblem = problems[0];
  const selectedCoach = coachChoices.find((choice) => choice.id === selectedCoachStyle)!;

  function moveToStep(nextStep: 1 | 2 | 3) {
    setStep(nextStep);
    setShowAlternatives(false);
    requestAnimationFrame(() => {
      const wizard = document.querySelector(".learning-wizard");
      if (!wizard) return;
      const top = wizard.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    });
  }

  return (
    <div className="learning-wizard mx-auto w-full max-w-5xl">
      <header className="learning-wizard-header">
        <div>
          <p className="learning-wizard-kicker">Build today&apos;s session</p>
          <h2>One decision at a time.</h2>
          <p>Choose a focus, set the support level, then start one problem.</p>
        </div>
        <span className="learning-step-count">{step} / 3</span>
      </header>

      <nav className="learning-stepper" aria-label="Learning session setup">
        {[
          { id: 1, label: "Focus", summary: selectedPattern.label },
          { id: 2, label: "Support", summary: selectedCoach.title },
          { id: 3, label: "Start", summary: recommendedProblem?.title ?? "Choose a problem" }
        ].map((item) => {
          const active = step === item.id;
          const complete = step > item.id;
          return (
            <button key={item.id} type="button" onClick={() => { if (item.id <= step) moveToStep(item.id as 1 | 2 | 3); }}
              className={`learning-step ${active ? "learning-step-active" : ""} ${complete ? "learning-step-complete" : ""}`} aria-current={active ? "step" : undefined}>
              <span className="learning-step-index">{complete ? "✓" : item.id}</span>
              <span><strong>{item.label}</strong><small>{active || complete ? item.summary : "Up next"}</small></span>
            </button>
          );
        })}
      </nav>

      <section className="learning-wizard-panel">
        {step === 1 ? (
          <div className="learning-step-view">
            <div className="learning-step-copy"><span>Step 1</span><h3>What should we focus on?</h3><p>Pick just one for this session. You can come back for the others later.</p></div>
            <div className="learning-focus-list">
              {selectedPatterns.map((pattern, index) => {
                const active = pattern.id === selectedPatternId;
                return (
                  <button key={pattern.id} type="button" onClick={() => setSelectedPatternId(pattern.id)} className={`learning-focus-option ${active ? "learning-focus-option-active" : ""}`}>
                    <span className="learning-focus-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1"><strong>{pattern.label}</strong><small>{pattern.clues[0]}</small></span>
                    <span className="learning-radio" aria-hidden="true"><i /></span>
                  </button>
                );
              })}
            </div>
            <div className="learning-wizard-actions">
              <Link href="/learn/setup" className="learning-text-action">Change my focus set</Link>
              <button type="button" onClick={() => moveToStep(2)} className="learning-primary-action">Continue <span aria-hidden="true">→</span></button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="learning-step-view">
            <div className="learning-step-copy"><span>Step 2</span><h3>How much help feels right?</h3><p>This only changes how quickly the coach steps in.</p></div>
            <div className="learning-support-list">
              {coachChoices.map((choice) => {
                const active = choice.id === selectedCoachStyle;
                return (
                  <button key={choice.id} type="button" onClick={() => setSelectedCoachStyle(choice.id)} className={`learning-support-option ${active ? "learning-support-option-active" : ""}`}>
                    <span className="learning-radio" aria-hidden="true"><i /></span>
                    <span className="min-w-0 flex-1"><strong>{choice.title}</strong><small>{choice.detail}</small></span>
                    {choice.badge ? <span className="learning-choice-badge">{choice.badge}</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="learning-wizard-actions">
              <button type="button" onClick={() => moveToStep(1)} className="learning-text-action">← Back</button>
              <button type="button" onClick={() => moveToStep(3)} className="learning-primary-action">Find my first problem <span aria-hidden="true">→</span></button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="learning-step-view">
            <div className="learning-step-copy"><span>Step 3</span><h3>Start here.</h3><p>We picked the clearest first rep for {selectedPattern.label}.</p></div>
            {recommendedProblem ? <RecommendedProblem problem={recommendedProblem} coachStyle={selectedCoachStyle} patternId={selectedPatternId} /> : <div className="learning-no-problem">No starter problem is available for this pattern yet.</div>}
            {problems.length > 1 ? (
              <div className="learning-alternatives">
                <button type="button" onClick={() => setShowAlternatives((current) => !current)} className="learning-alternatives-toggle" aria-expanded={showAlternatives}>
                  <span>Prefer a different problem?</span><span aria-hidden="true">{showAlternatives ? "−" : "+"}</span>
                </button>
                {showAlternatives ? <div className="learning-alternative-list">{problems.slice(1).map((problem) => <ProblemLink key={problem.id} problem={problem} coachStyle={selectedCoachStyle} patternId={selectedPatternId} />)}</div> : null}
              </div>
            ) : null}
            <div className="learning-wizard-actions learning-wizard-actions-left"><button type="button" onClick={() => moveToStep(2)} className="learning-text-action">← Change support</button></div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function buildPracticeHref(problem: AppProblem, coachStyle: CoachStyle, patternId: string) {
  return `/practice?${new URLSearchParams({ problem: problem.id, mode: "learn", coach: coachStyle, patterns: patternId }).toString()}`;
}

function RecommendedProblem({ problem, coachStyle, patternId }: { problem: AppProblem; coachStyle: CoachStyle; patternId: string }) {
  const meta = getOfficialProblemRoadmapMeta(problem.id);
  return (
    <div className="learning-recommended-card">
      <div className="learning-recommended-topline"><span>Recommended first rep</span><span>{problem.difficulty} · 12–18 min</span></div>
      <div className="learning-recommended-body">
        <div className="learning-problem-number">{meta?.leetcodeNumber ? `#${meta.leetcodeNumber}` : "01"}</div>
        <div className="min-w-0 flex-1"><h4>{problem.title}</h4><p>{problem.reviewQuestion}</p></div>
      </div>
      <Link href={buildPracticeHref(problem, coachStyle, patternId)} className="learning-start-button">Start guided session <span aria-hidden="true">→</span></Link>
    </div>
  );
}

function ProblemLink({ problem, coachStyle, patternId }: { problem: AppProblem; coachStyle: CoachStyle; patternId: string }) {
  return (
    <Link href={buildPracticeHref(problem, coachStyle, patternId)} className="learning-alternative-row">
      <span><strong>{problem.title}</strong><small>{problem.difficulty}</small></span><span aria-hidden="true">→</span>
    </Link>
  );
}
