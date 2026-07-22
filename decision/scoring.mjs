import { invariant, nonEmptyString, unitInterval } from "./validation.mjs";

/**
 * Scores a decision using declared dimensions only. No factual content is generated.
 * Dimensions are normalized to [0, 1], so score and confidence are reproducible.
 */
export function scoreDecision({ dimensions, inputs }) {
  invariant(Array.isArray(dimensions) && dimensions.length > 0, "dimensions must be a non-empty array");
  invariant(inputs && typeof inputs === "object", "inputs must be an object");
  let weightTotal = 0;
  let weightedScore = 0;
  const breakdown = dimensions.map(({ id, weight }) => {
    nonEmptyString(id, "dimension id");
    invariant(typeof weight === "number" && Number.isFinite(weight) && weight > 0, `dimension ${id} weight must be positive`);
    unitInterval(inputs[id], `input ${id}`);
    weightTotal += weight;
    weightedScore += inputs[id] * weight;
    return { id, value: inputs[id], weight, contribution: inputs[id] * weight };
  });
  return Object.freeze({ score: weightedScore / weightTotal, weightTotal, breakdown: Object.freeze(breakdown) });
}
