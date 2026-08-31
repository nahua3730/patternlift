import assert from "node:assert/strict";
import { test } from "node:test";
import { allProblems } from "@/lib/product";
import { buildBlindProblemPreview } from "@/lib/transfer-problem";

test("blind Transfer preview strips generated roadmap/category metadata at the API boundary", () => {
  const problem = allProblems.find((entry) => entry.id === "official-rotate-image");
  assert.ok(problem, "expected generated Math & Geometry roadmap problem");
  assert.equal(problem.category, "Math & Geometry");
  assert.match(problem.prompt, /official .* roadmap in Math & Geometry/);

  const preview = buildBlindProblemPreview(problem);
  assert.deepEqual(Object.keys(preview), ["id", "title", "difficulty", "prompt"]);
  assert.doesNotMatch(preview.prompt, /Math & Geometry/);
  assert.doesNotMatch(preview.prompt, /Blind 75|NeetCode 150|official .* roadmap/);
  assert.match(preview.prompt, /Use the editor and custom test panel/);
});

test("blind Transfer preview preserves a hand-written problem statement exactly", () => {
  const problem = allProblems.find((entry) => entry.id === "two-sum");
  assert.ok(problem, "expected hand-written sample problem");

  const preview = buildBlindProblemPreview(problem);
  assert.equal(preview.prompt, problem.prompt);
  assert.equal(preview.title, problem.title);
  assert.equal(preview.difficulty, problem.difficulty);
});
