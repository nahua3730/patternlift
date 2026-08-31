# PatternLift

PatternLift is an AI-assisted coding-interview coach. It doesn't just let you solve
LeetCode problems with a chatbot next to the editor — it separately tests whether you can
*recognize* the right pattern, tracks how that skill evolves over time, and can run either
its own generated study plan or a real external curriculum (e.g. 代码随想录/"Carl") day by
day, picking up where you left off if a day gets missed.

## Why PatternLift

Many learners can follow a LeetCode solution once they see it, but still struggle to:

- recognize the right pattern from the prompt, before any hint reveals it
- tell similar patterns apart (sliding window vs. two pointers, BFS vs. DFS, greedy vs. DP)
- know whether a skill actually transfers to an unseen problem, or only worked because they
  just practiced that exact one
- keep a multi-week study plan on track when real life interrupts it

PatternLift is built around closing that gap specifically, not around being a general
chatbot.

## What's built

**Practice workspace** — a Monaco-based editor with real test execution, a pattern coach
(adaptive / step-by-step / on-demand hint styles), a progressive hint ladder, and code-fading
scaffolds, all backed by a 150+ problem catalog (NeetCode 150 / Blind 75).

**Blind Transfer** — the core differentiator. Before ever seeing a hint or the pattern name,
the learner predicts the pattern for an unseen problem. That prediction is locked in
server-side and immutable; recognition ("did they name it right?") and implementation ("did
they solve it independently?") are scored as two separate, honest signals — a learner can
recognize correctly but still need help, or misname the pattern and still solve it cleanly,
and the UI shows both without collapsing them into one number. The blindness boundary is
structural: the client bundle that renders the prediction step cannot reach the answer even
by inspection, verified against real production builds, and every scheduled Transfer is
re-checked against an anti-priming rule (was this pattern taught or practiced too recently,
same-day, or too soon after the last Transfer of it) before it's ever shown as a test.

**Mastery tracking** — a six-dimension skill vector per pattern (recognition, concept,
reasoning, implementation, independence, retention), each with its own confidence/evidence
count so a score built on one attempt is never presented with the same weight as one built on
twelve. Confusion pairs, weak-pattern ranking, and per-pattern Recognition Accuracy / Transfer
Solve Success are derived from the same underlying attempt history — Transfer Solve Success is
scored per *encounter* (one datapoint per Transfer task), not per attempt, so a struggle-then-
succeed retry can't be miscounted as an independent solve.

**Adaptive scheduling** — daily Core/Bonus task lists sized to the learner's own per-weekday
time budget, with 1-3-7-style spaced review seeding for high-priority material.

**Guided Curriculum** — a plan doesn't have to come from PatternLift's own generator. An
external curriculum (currently 代码随想录/Carl's real 35-day schedule) is adapted into the
same task model the generated plans use, so Today, Progress, and mastery tracking all work
identically either way. A curriculum's topic (e.g. "Linked List") is kept visually distinct
from a problem's actual algorithmic pattern (e.g. "Two Pointers") — the two can legitimately
differ, and the UI never lets one silently overwrite the other. If a day isn't finished,
nothing is lost or replayed: unfinished Core work resurfaces as Carryover the next day,
budget-aware, until it's done or explicitly skipped, and a finished plan window shows a real
completion state instead of looping the last day forever.

## Architecture notes

- **Client/server trust boundary**: the full problem catalog (with each problem's target
  pattern) is imported only by server-side code; client components only ever see `import
  type` references or a deliberately generic, pattern-catalog-only module. This is checked
  against actual compiled production chunks, not just source review.
- **Idempotent, concurrency-safe writes** where it matters: a pattern prediction can only ever
  be submitted once per task (DB unique constraint + `ON CONFLICT` handling), so a retried or
  duplicated request can't overwrite an already-locked, immutable result.
- **Fail-closed, not fail-open**: if a Transfer no longer satisfies the blindness/anti-priming
  invariants by the time it's served, it's downgraded to ordinary practice rather than shown
  as a compromised test — and that downgrade path is itself covered by the same leak-detection
  assertions as the normal path.
- **One execution engine, multiple plan sources**: generated and guided plans both compile
  down to the same `CurriculumPlan` / `StudyTask[]` shape, so scheduling, sessions, and
  Progress never need to know which one they're looking at.

## Tech Stack

- `Next.js` (App Router) + `TypeScript`
- `Tailwind CSS`
- `PostgreSQL` (via Neon) in production, `SQLite` locally
- `Monaco Editor` for in-browser code execution
- `OpenAI API` for the coach, curriculum agent, and mastery agent
- `Vercel`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Add your real OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=sk-...
```

Production deployments should also provide a PostgreSQL `DATABASE_URL`. On Vercel,
connect a Neon database from the Marketplace; Vercel injects the connection string
automatically. Local development continues to use `data/patternlift.db` when no Postgres
URL is configured.

4. Start the app:

```bash
npm run dev
```

If the AI coach still shows an invalid key error after updating `.env.local`, restart the dev server so Next.js picks up the new environment value.

5. Run the test suite:

```bash
npm test
```

## Status

Blind Transfer (Phase 2A) is complete and frozen. Guided Curriculum execution (Pilot
Foundation) is complete, verified against a real 35-day Carl pilot schedule, and currently
being dogfooded day by day. Weekly Pattern Review (Phase 2B) is designed but intentionally
paused until real usage surfaces what it actually needs to prioritize.

## Long-Term Direction

- Weekly Pattern Review — a periodic, evidence-driven checkpoint sampling recall and transfer
  across recently-studied patterns, not a fixed five-task quiz
- Additional guided curricula beyond Carl (NeetCode, Blind 75, fully custom)
- Interview-style mock sessions
- Agent-based, more proactive coaching workflows

## Author

Built by [Na Hua](https://github.com/nahua3730).
