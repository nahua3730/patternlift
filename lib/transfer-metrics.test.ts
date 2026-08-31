import assert from "node:assert/strict";
import { test } from "node:test";
import { transferSolveSuccessByPattern, type TransferAttemptRecord } from "@/lib/transfer-metrics";

function attempt(
  studyTaskId: string,
  patternId: string,
  outcome: TransferAttemptRecord["outcome"],
  isRetry: boolean,
  createdAt: string
): TransferAttemptRecord {
  return { studyTaskId, patternId, outcome, isRetry, createdAt };
}

// A. wrong recognition + first independent solve succeeds -> SUCCESS.
// (Recognition correctness itself isn't a field here - the point is that a
// single clean, non-retry attempt is exactly one SUCCESS datapoint.)
test("a single independent solid attempt counts as one Transfer Solve Success", () => {
  const result = transferSolveSuccessByPattern([
    attempt("task-a", "two-pointers", "solid", false, "2026-01-01T00:00:00.000Z")
  ]);
  assert.deepEqual(result["two-pointers"], { solid: 1, total: 1 });
});

// B. correct recognition + first solve fails + remediation + successful
// retry -> the encounter is still a FAIL, not 50% and not a success.
test("a failed original attempt followed by a successful remediation retry is still one FAIL datapoint, not 50%", () => {
  const result = transferSolveSuccessByPattern([
    attempt("task-b", "dfs", "confused", false, "2026-01-01T00:00:00.000Z"),
    attempt("task-b", "dfs", "solid", true, "2026-01-01T00:05:00.000Z")
  ]);
  assert.deepEqual(result["dfs"], { solid: 0, total: 1 });
});

// C. multiple retries for one Transfer task still contribute only ONE
// denominator datapoint - repeated Submit clicks must not inflate the count.
test("multiple retries after one original attempt still contribute exactly one datapoint", () => {
  const result = transferSolveSuccessByPattern([
    attempt("task-c", "heap", "confused", false, "2026-01-01T00:00:00.000Z"),
    attempt("task-c", "heap", "confused", true, "2026-01-01T00:05:00.000Z"),
    attempt("task-c", "heap", "solid", true, "2026-01-01T00:10:00.000Z")
  ]);
  assert.deepEqual(result["heap"], { solid: 0, total: 1 });
});

// D. one successful independent Transfer + one helped Transfer -> 1/2 = 50%.
// This is the case where 50% IS correct: two distinct encounters, not two
// attempts inside one encounter.
test("two distinct Transfer encounters, one clean and one helped, aggregate to 50%", () => {
  const result = transferSolveSuccessByPattern([
    attempt("task-d1", "two-pointers", "solid", false, "2026-01-01T00:00:00.000Z"),
    attempt("task-d2", "two-pointers", "confused", false, "2026-01-02T00:00:00.000Z"),
    attempt("task-d2", "two-pointers", "solid", true, "2026-01-02T00:05:00.000Z")
  ]);
  assert.deepEqual(result["two-pointers"], { solid: 1, total: 2 });
});

test("a retry-only record with no original attempt on record contributes nothing (defensive - should not happen in practice)", () => {
  const result = transferSolveSuccessByPattern([
    attempt("task-e", "stack", "solid", true, "2026-01-01T00:00:00.000Z")
  ]);
  assert.equal(result["stack"], undefined);
});

test("when multiple non-retry rows exist for one task (defensive edge case), the earliest one is authoritative", () => {
  const result = transferSolveSuccessByPattern([
    attempt("task-f", "greedy", "solid", false, "2026-01-01T00:05:00.000Z"),
    attempt("task-f", "greedy", "confused", false, "2026-01-01T00:00:00.000Z")
  ]);
  assert.deepEqual(result["greedy"], { solid: 0, total: 1 });
});
