import type { SupportedLanguage } from "@/lib/problem-code";

// 0 = blank/independent, 3 = heaviest support. Mechanically derived from
// whatever starter code the problem already has, rather than requiring a
// hand-authored fill-in-the-blank solution per problem per level - that
// would mean authoring scaffolds for 150+ problems before this could ship.
export type ScaffoldLevel = 0 | 1 | 2 | 3;

export const SCAFFOLD_LABEL: Record<ScaffoldLevel, string> = {
  0: "Independent",
  1: "Light nudge",
  2: "Partial skeleton",
  3: "Heavy support"
};

const LINE_COMMENT: Record<SupportedLanguage, string> = {
  javascript: "//",
  typescript: "//",
  python: "#",
  ruby: "#",
  c: "//",
  csharp: "//",
  java: "//",
  cpp: "//",
  swift: "//",
  go: "//",
  kotlin: "//"
};

function stripCommentLines(code: string, language: SupportedLanguage) {
  const prefix = LINE_COMMENT[language];
  return code
    .split("\n")
    .filter((line) => !line.trim().startsWith(prefix))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n");
}

// Inserts comment lines just before the final line of the code (the
// closing brace / return / pass), so they read as guidance inside the
// function body rather than trailing after it.
function insertCommentsBeforeLastLine(code: string, language: SupportedLanguage, lines: string[]) {
  if (lines.length === 0) return code;
  const prefix = LINE_COMMENT[language];
  const codeLines = code.split("\n");
  const insertAt = Math.max(0, codeLines.length - 1);
  const commentLines = lines.map((line) => `${prefix} ${line}`);
  codeLines.splice(insertAt, 0, ...commentLines);
  return codeLines.join("\n");
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export type ScaffoldContext = {
  coreIdea?: string | null;
  firstSteps?: readonly string[];
};

// Level 2 (partial skeleton) is deliberately just the problem's existing
// starter code unchanged - it already carries real, per-problem guiding
// comments today, which is more accurate than anything generated here.
// Level 3 adds the pattern's generic step list on top of that. Levels 0-1
// strip down from there.
export function buildScaffoldedStarterCode(
  baseStarterCode: string,
  language: SupportedLanguage,
  level: ScaffoldLevel,
  context: ScaffoldContext
): string {
  if (level === 3) {
    if (!context.firstSteps || context.firstSteps.length === 0) return baseStarterCode;
    const steps = ["Approach:", ...context.firstSteps.map((step, index) => `${index + 1}. ${step}`)];
    return insertCommentsBeforeLastLine(baseStarterCode, language, steps);
  }

  if (level === 2) return baseStarterCode;

  const stripped = stripCommentLines(baseStarterCode, language);

  if (level === 1) {
    const nudge = context.coreIdea ? truncate(context.coreIdea, 90) : null;
    return nudge ? insertCommentsBeforeLastLine(stripped, language, [nudge]) : stripped;
  }

  return stripped;
}

// Part 13: support fades based on the learner's OWN recent history with
// this specific pattern, not a global setting. Simple, explainable rule -
// a success at a level suggests trying one level lighter next time; a
// failure holds or nudges back up, capped at the ladder's ends.
export function nextScaffoldLevel(lastLevel: ScaffoldLevel, lastOutcomeWasSolid: boolean): ScaffoldLevel {
  if (lastOutcomeWasSolid) {
    return Math.max(0, lastLevel - 1) as ScaffoldLevel;
  }
  return Math.min(3, lastLevel + 1) as ScaffoldLevel;
}
