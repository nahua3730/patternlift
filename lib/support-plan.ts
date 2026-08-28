import type { CoachStyle } from "@/lib/curriculum-agent";
import type { TechniqueSkillVector, DimensionScore } from "@/lib/skill-vector";
import type { HintLevel } from "@/lib/hint-ladder";
import { type ScaffoldLevel, nextScaffoldLevel } from "@/lib/scaffold";

export type SupportPlan = {
  scaffoldLevel: ScaffoldLevel;
  maxHintLevel: HintLevel;
  coachStyle: CoachStyle;
  // Internal reasoning, logged in the dev debug view - not shown to the
  // learner as-is (Part 11: "the UI does not need to expose all metadata").
  reason: string;
};

const WEAK = 60;
const STRONG = 70;

function isWeak(dimension?: DimensionScore) {
  return Boolean(dimension) && dimension!.evidenceCount > 0 && dimension!.score < WEAK;
}
function isStrong(dimension?: DimensionScore) {
  return Boolean(dimension) && dimension!.evidenceCount > 0 && dimension!.score >= STRONG;
}

function atLeastGuided(style: CoachStyle): CoachStyle {
  return style === "optional" ? "guided" : style;
}

export type SupportPlanInput = {
  skills?: TechniqueSkillVector;
  defaultCoachStyle: CoachStyle;
  // From the learner's most recent attempt on THIS pattern, if any -
  // drives Part 13's gradual fade. Per-technique, not global.
  recentScaffoldLevel?: ScaffoldLevel;
  recentOutcomeWasSolid?: boolean;
  // True when this pattern was mastered before but the most recent
  // attempt regressed - Part 10's "don't re-teach, just add light support"
  // case.
  recentFailureAfterPriorMastery?: boolean;
};

export function chooseSupportPlan(input: SupportPlanInput): SupportPlan {
  const { skills, defaultCoachStyle } = input;
  const fadeLevel =
    input.recentScaffoldLevel != null
      ? nextScaffoldLevel(input.recentScaffoldLevel, input.recentOutcomeWasSolid ?? false)
      : null;

  // No evidence yet - today's existing default experience, unchanged.
  if (!skills) {
    return {
      scaffoldLevel: 2,
      maxHintLevel: 5,
      coachStyle: defaultCoachStyle,
      reason: "No prior evidence yet - starting with the default level of support."
    };
  }

  // A real regression after prior mastery gets a light touch, not a
  // reset to heavy scaffolding - the gap is more likely rust than a
  // missing foundation.
  if (input.recentFailureAfterPriorMastery) {
    return {
      scaffoldLevel: 1,
      maxHintLevel: 3,
      coachStyle: "guided",
      reason: "Mastered before, but the last attempt slipped - light support and a recall nudge, not a full re-teach."
    };
  }

  // Weak concept or reasoning means the foundation itself is shaky -
  // this overrides fading, since success-driven fading shouldn't remove
  // support the learner still structurally needs.
  if (isWeak(skills.concept) || isWeak(skills.reasoning)) {
    return {
      scaffoldLevel: 3,
      maxHintLevel: 5,
      coachStyle: atLeastGuided(defaultCoachStyle),
      reason: "Concept or reasoning still developing - heavier scaffold and the full hint ladder stay available."
    };
  }

  // Recognizes the pattern but can't yet turn it into code - partial
  // skeleton with code-level hints available, but not a full re-teach.
  if (isStrong(skills.recognition) && isWeak(skills.implementation)) {
    const level = fadeLevel != null ? (Math.max(fadeLevel, 2) as ScaffoldLevel) : 2;
    return {
      scaffoldLevel: level,
      maxHintLevel: 4,
      coachStyle: defaultCoachStyle,
      reason: "Recognition is solid; implementation needs work - partial skeleton, hints capped below full code reveal."
    };
  }

  // Can execute with support but not alone - the target now is reducing
  // support, not reinforcing the concept further.
  if (isStrong(skills.implementation) && isWeak(skills.independence)) {
    const level = fadeLevel != null ? (Math.min(fadeLevel, 1) as ScaffoldLevel) : 1;
    return {
      scaffoldLevel: level,
      maxHintLevel: 2,
      coachStyle: "optional",
      reason: "Can solve with help but not independently - reducing scaffold and hint depth to build independence."
    };
  }

  // Consistently strong overall - independent attempt, minimal support.
  if (isStrong({ score: skills.overall, confidence: 1, evidenceCount: 1 })) {
    const level = fadeLevel != null ? (Math.min(fadeLevel, 0) as ScaffoldLevel) : 0;
    return {
      scaffoldLevel: level,
      maxHintLevel: 1,
      coachStyle: "optional",
      reason: "Consistently strong on this pattern - independent attempt with minimal support available."
    };
  }

  // No strong signal either way - let fading (if any evidence exists)
  // gently pull toward less support over time; otherwise the default.
  const level = fadeLevel != null ? fadeLevel : 2;
  return {
    scaffoldLevel: level,
    maxHintLevel: 4,
    coachStyle: defaultCoachStyle,
    reason: "Mixed signal so far - standard support level."
  };
}
