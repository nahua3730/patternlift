import type { CompareMode } from "@/lib/problem-code";

export function compareValues(actual: unknown, expected: unknown, mode: CompareMode) {
  switch (mode) {
    case "unordered-number-array":
      return compareNormalized(actual, expected, sortPrimitiveArray);
    case "unordered-string-array":
      return compareNormalized(actual, expected, sortPrimitiveArray);
    case "unordered-point-array":
      return compareNormalized(actual, expected, sortPointArray);
    case "unordered-nested-array":
      return compareNormalized(actual, expected, sortNestedArray);
    default:
      return JSON.stringify(actual) === JSON.stringify(expected);
  }
}

function compareNormalized(actual: unknown, expected: unknown, normalizer: (value: unknown) => unknown) {
  return JSON.stringify(normalizer(actual)) === JSON.stringify(normalizer(expected));
}

function sortPrimitiveArray(value: unknown) {
  if (!Array.isArray(value)) return value;
  return [...value].sort();
}

function sortPointArray(value: unknown) {
  if (!Array.isArray(value)) return value;
  return [...value]
    .map((entry) => (Array.isArray(entry) ? [...entry] : entry))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function sortNestedArray(value: unknown) {
  if (!Array.isArray(value)) return value;

  return [...value]
    .map((entry) =>
      Array.isArray(entry) ? [...entry].sort((left, right) => Number(left) - Number(right)) : entry
    )
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}
