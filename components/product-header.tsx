export function ProductHeader() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-ember">
          PatternLift
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Learn to recognize coding patterns faster and remember them longer.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-black/72">
          PatternLift is an AI-assisted LeetCode pattern coach built for learners
          who can follow a solution after reading it, but still freeze when they
          need to identify the pattern on their own.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white/75 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-lake">
          Product Direction
        </p>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-black/72">
          <li>Pattern recognition before solution reveal</li>
          <li>Contrast-based drills for similar approaches</li>
          <li>Guided AI hints instead of instant answers</li>
          <li>Review driven by your actual confusion history</li>
        </ul>
      </div>
    </section>
  );
}

