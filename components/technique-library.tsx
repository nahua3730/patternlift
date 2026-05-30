import { techniqueLibrary } from "@/lib/techniques";

export function TechniqueLibrary() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-ember">
            Techniques
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            A quick-reference library for the technique families you should keep
            reaching for.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-black/72">
            This page turns common algorithm frameworks into practical prompts:
            when to think of them, what question to ask first, and what mistake
            beginners often make.
          </p>
        </div>

        <div className="uiverse-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-lake">
            Source Note
          </p>
          <p className="mt-4 text-sm leading-7 text-black/72">
            The technique families here are inspired by the core catalog on
            Labuladong&apos;s Essential Technique page, but the summaries and tips
            are adapted for PatternLift&apos;s coaching workflow.
          </p>
          <a
            href="https://labuladong.online/algo/essential-technique/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full border border-black/10 bg-mist px-4 py-2 text-sm font-medium text-black/72 transition hover:border-black/24"
          >
            Open Labuladong reference
          </a>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {techniqueLibrary.map((technique) => (
          <article key={technique.id} className="uiverse-panel p-5">
            <h2 className="text-xl font-semibold text-ink">{technique.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-black/72">
              <p>
                <span className="font-semibold text-ink">When to think:</span>{" "}
                {technique.whenToThink}
              </p>
              <p>
                <span className="font-semibold text-ink">Core idea:</span>{" "}
                {technique.coreIdea}
              </p>
              <p>
                <span className="font-semibold text-ink">Starter question:</span>{" "}
                {technique.starterQuestion}
              </p>
              <p>
                <span className="font-semibold text-ink">Common trap:</span>{" "}
                {technique.commonTrap}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {technique.quickTips.map((tip) => (
                <span
                  key={tip}
                  className="rounded-full border border-black/10 bg-mist px-3 py-2 text-xs font-medium text-black/70"
                >
                  {tip}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
