import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSkillVector } from "@/lib/skill-vector";
import type { MasteryAttempt } from "@/lib/mastery";

function attempt(overrides: Partial<MasteryAttempt> = {}): MasteryAttempt {
  return {
    problemId: "two-sum",
    problemTitle: "Two Sum",
    selectedPatternLabel: "Hash Map",
    actualPatternLabel: "Hash Map",
    outcome: "solid",
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

test("no attempts for a pattern -> every dimension is empty, not defaulted", () => {
  const vector = buildSkillVector([], "Hash Map", []);
  assert.equal(vector.recognition.evidenceCount, 0);
  assert.equal(vector.overall, 0);
});

test("strong recognition, weak implementation profile is distinguishable from the reverse", () => {
  const strongRecognitionWeakImpl = buildSkillVector(
    [
      attempt({ outcome: "partial", codePassed: false, explanationScore: 80 }),
      attempt({ outcome: "partial", codePassed: false, explanationScore: 82 }),
      attempt({ outcome: "solid", codePassed: true, explanationScore: 85 })
    ],
    "Hash Map",
    []
  );
  assert.ok(strongRecognitionWeakImpl.recognition.score > 90);
  assert.ok(strongRecognitionWeakImpl.implementation.score < 70);

  const weakRecognitionStrongImpl = buildSkillVector(
    [
      attempt({ selectedPatternLabel: "Two Pointers", outcome: "confused" }),
      attempt({ selectedPatternLabel: "Two Pointers", outcome: "confused" }),
      attempt({ outcome: "solid", codePassed: true })
    ],
    "Hash Map",
    []
  );
  assert.ok(weakRecognitionStrongImpl.recognition.score < 70);
  assert.ok(weakRecognitionStrongImpl.implementation.score > 90);

  // The two profiles must not collapse to the same overall number despite
  // both being "mixed" - that would defeat the point of having dimensions.
  assert.notEqual(
    Math.round(strongRecognitionWeakImpl.overall),
    Math.round(weakRecognitionStrongImpl.overall)
  );
});

test("a recurring confusion pair pulls recognition down further than isolated misses", () => {
  const isolatedMiss = buildSkillVector(
    [attempt({ selectedPatternLabel: "Two Pointers", outcome: "confused" }), attempt({ outcome: "solid" })],
    "Hash Map",
    []
  );
  const recurringConfusion = buildSkillVector(
    [attempt({ selectedPatternLabel: "Two Pointers", outcome: "confused" }), attempt({ outcome: "solid" })],
    "Hash Map",
    [{ predicted: "Two Pointers", actual: "Hash Map", count: 3 }]
  );
  assert.ok(recurringConfusion.recognition.score < isolatedMiss.recognition.score);
});

test("retention only scores delayed attempts, not same-day repeats", () => {
  const now = Date.now();
  const sameDay = buildSkillVector(
    [
      attempt({ createdAt: new Date(now).toISOString(), outcome: "solid" }),
      attempt({ createdAt: new Date(now + 1000 * 60 * 10).toISOString(), outcome: "solid" })
    ],
    "Hash Map",
    []
  );
  assert.equal(sameDay.retention.evidenceCount, 0);

  const delayed = buildSkillVector(
    [
      attempt({ createdAt: new Date(now).toISOString(), outcome: "solid" }),
      attempt({ createdAt: new Date(now + 5 * 86_400_000).toISOString(), outcome: "solid" })
    ],
    "Hash Map",
    []
  );
  assert.equal(delayed.retention.evidenceCount, 1);
});

test("confidence grows with evidence count but saturates", () => {
  const oneAttempt = buildSkillVector([attempt()], "Hash Map", []);
  const manyAttempts = buildSkillVector(
    Array.from({ length: 10 }, () => attempt()),
    "Hash Map",
    []
  );
  assert.ok(manyAttempts.recognition.confidence > oneAttempt.recognition.confidence);
  assert.ok(manyAttempts.recognition.confidence <= 1);
});
