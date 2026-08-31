import assert from "node:assert/strict";
import { test } from "node:test";
import { assertBlindTransferPayload, blindTransferTaskPayload } from "@/lib/transfer-contract";

test("blind Transfer DTO is an allow-listed task identity, not a solve payload", () => {
  const task = blindTransferTaskPayload({
    id: "task-1",
    priority: "A",
    bucket: "core",
    problemId: "two-sum",
    estimatedMinutes: 30,
    status: "pending",
    predictionLocked: false
  });
  assert.deepEqual(Object.keys(task).sort(), [
    "bucket", "estimatedMinutes", "id", "kind", "predictionState", "priority", "problemId", "status", "title", "type"
  ]);
  assert.equal(task.title, "Pattern Challenge");
  assert.equal("patternId" in task, false);
  assert.equal("targetPatternId" in task, false);
  assert.equal("recommendedClues" in task, false);
});

test("recoverable problem-to-answer association fails the development guard", () => {
  assert.throws(() =>
    assertBlindTransferPayload(
      { task: { problemId: "two-sum", patternId: "hashing" } },
      {
        problemId: "two-sum",
        targetPatternId: "hashing",
        targetPatternLabel: "Hash Map / Set",
        contrastPatternId: "two-pointers"
      }
    )
  );
});

test("a harmless property-name string is not treated as an answer mapping", () => {
  assert.doesNotThrow(() =>
    assertBlindTransferPayload(
      { task: { problemId: "two-sum", title: "Pattern Challenge" }, schemaNote: "targetPatternId" },
      {
        problemId: "two-sum",
        targetPatternId: "hashing",
        targetPatternLabel: "Hash Map / Set",
        contrastPatternId: "two-pointers"
      }
    )
  );
});
