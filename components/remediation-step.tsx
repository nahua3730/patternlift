"use client";

import { useState } from "react";
import type { RemediationActivity } from "@/lib/remediation";

type RemediationStepProps = {
  activity: RemediationActivity;
  onComplete: (success: boolean) => void;
  onSkip?: () => void;
};

// One component, branching by payload.shape rather than a separate
// component per interaction type - four UI patterns cover all nine
// pedagogical interaction types without a full generic exercise engine.
export function RemediationStepView({ activity, onComplete, onSkip }: RemediationStepProps) {
  return (
    <div className="uiverse-panel p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-ember">Quick repair</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{activity.title}</h2>
      <p className="mt-1 text-sm text-black/58">{activity.instruction}</p>
      <div className="mt-4">
        {activity.payload.shape === "choice" ? (
          <ChoiceView payload={activity.payload} onComplete={onComplete} />
        ) : activity.payload.shape === "order" ? (
          <OrderView payload={activity.payload} onComplete={onComplete} />
        ) : activity.payload.shape === "blank" ? (
          <BlankView payload={activity.payload} onComplete={onComplete} />
        ) : (
          <FreeView payload={activity.payload} onComplete={onComplete} />
        )}
      </div>
      {onSkip ? (
        <button type="button" onClick={onSkip} className="mt-4 text-xs font-medium text-black/40 hover:text-black/60">
          Skip this - I&apos;ve got it
        </button>
      ) : null}
    </div>
  );
}

function ChoiceView({
  payload,
  onComplete
}: {
  payload: Extract<RemediationActivity["payload"], { shape: "choice" }>;
  onComplete: (success: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === payload.correctIndex;

  return (
    <div>
      {payload.context ? (
        <p className="mb-3 rounded-lg bg-mist p-3 text-xs leading-5 text-black/60">{payload.context}</p>
      ) : null}
      <p className="text-sm font-medium text-ink">{payload.prompt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {payload.options.map((option, index) => (
          <button
            key={option}
            type="button"
            disabled={answered}
            onClick={() => setSelected(index)}
            className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-100 ${
              answered && index === payload.correctIndex
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : answered && index === selected
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : answered
                    ? "border-black/10 bg-mist text-black/40"
                    : "border-black/10 bg-mist text-black/72 hover:border-black/24"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {answered ? (
        <div className="mt-4 rounded-2xl bg-mist p-4 text-sm leading-6 text-black/72">
          <p className="font-semibold text-ink">{correct ? "Yes." : "Not quite."}</p>
          <p className="mt-1">{correct ? payload.correctExplain : payload.incorrectExplain}</p>
          <button
            type="button"
            onClick={() => onComplete(correct)}
            className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
          >
            Continue →
          </button>
        </div>
      ) : null}
    </div>
  );
}

function OrderView({
  payload,
  onComplete
}: {
  payload: Extract<RemediationActivity["payload"], { shape: "order" }>;
  onComplete: (success: boolean) => void;
}) {
  const [chosen, setChosen] = useState<number[]>([]);
  const done = chosen.length === payload.steps.length;
  const correct = done && chosen.every((value, index) => value === payload.correctOrder[index]);

  return (
    <div>
      <p className="text-sm font-medium text-ink">{payload.prompt}</p>
      <p className="mt-1 text-xs text-black/45">Click each step in the order it should happen.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {payload.steps.map((step, index) => {
          const position = chosen.indexOf(index);
          const picked = position !== -1;
          return (
            <button
              key={step}
              type="button"
              disabled={done || picked}
              onClick={() => setChosen((current) => [...current, index])}
              className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-100 ${
                picked ? "border-black/20 bg-ink text-white" : "border-black/10 bg-mist text-black/72 hover:border-black/24"
              }`}
            >
              {picked ? `${position + 1}. ` : ""}
              {step}
            </button>
          );
        })}
      </div>
      {done ? (
        <div className="mt-4 rounded-2xl bg-mist p-4 text-sm leading-6 text-black/72">
          <p className="font-semibold text-ink">{correct ? "Right order." : "Not quite the right order."}</p>
          <p className="mt-1">{payload.explain}</p>
          <button
            type="button"
            onClick={() => onComplete(correct)}
            className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
          >
            Continue →
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BlankView({
  payload,
  onComplete
}: {
  payload: Extract<RemediationActivity["payload"], { shape: "blank" }>;
  onComplete: (success: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");
  const correct = payload.acceptableAnswers.some((answer) => normalize(answer) === normalize(value));

  return (
    <div>
      {payload.template ? (
        <pre className="mb-3 overflow-x-auto rounded-lg bg-ink p-3 text-xs leading-5 text-white/90">{payload.template}</pre>
      ) : null}
      <p className="text-sm font-medium text-ink">{payload.prompt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={submitted}
          placeholder="Type your answer"
          className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-black/24 disabled:opacity-70"
        />
        {!submitted ? (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            disabled={value.trim().length === 0}
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-40"
          >
            Check
          </button>
        ) : null}
      </div>
      {submitted ? (
        <div className="mt-4 rounded-2xl bg-mist p-4 text-sm leading-6 text-black/72">
          <p className="font-semibold text-ink">{correct ? "Yes, that's it." : "Not quite."}</p>
          <p className="mt-1">{payload.explain}</p>
          <button
            type="button"
            onClick={() => onComplete(correct)}
            className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
          >
            Continue →
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FreeView({
  payload,
  onComplete
}: {
  payload: Extract<RemediationActivity["payload"], { shape: "free" }>;
  onComplete: (success: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      <p className="text-sm font-medium text-ink">{payload.prompt}</p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={submitted}
        rows={3}
        placeholder="Type a sentence or two..."
        className="mt-3 w-full rounded-2xl border border-black/10 bg-white p-4 text-sm text-ink outline-none focus:border-black/24 disabled:opacity-70"
      />
      {!submitted ? (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={value.trim().length === 0}
          className="mt-3 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-40"
        >
          Compare with a good answer
        </button>
      ) : (
        <div className="mt-4 rounded-2xl bg-mist p-4 text-sm leading-6 text-black/72">
          <p className="font-semibold text-ink">A good answer looks like:</p>
          <p className="mt-1">{payload.sampleGoodAnswer}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-black/45">Did yours match this?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onComplete(true)}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:opacity-85"
            >
              Yes, close enough
            </button>
            <button
              type="button"
              onClick={() => onComplete(false)}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/60 transition hover:border-black/24"
            >
              Not really
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
