import assert from "node:assert/strict";
import test from "node:test";
import { calculateCompensationScenario, compareCompensationScenarios } from "../lib/compensation-calculator.mjs";

test("compensation calculator exposes a deterministic formula trace", () => {
  const result = calculateCompensationScenario({ guarantee: 300000, creditedActivity: 6500, threshold: 5000, conversionRate: 55, qualityAdjustment: 5000, callPay: 12000, leadershipPay: 8000, benefitsValue: 25000, contractorExpenses: 10000, repaymentRisk: 4000 });
  assert.equal(result.trace.payableActivity, 1500);
  assert.equal(result.trace.productivityPay, 82500);
  assert.equal(result.trace.cashCompensation, 407500);
  assert.equal(result.illustrativeNetValue, 418500);
  assert.equal(result.amountDependentOnPerformance, 87500);
  assert.equal(result.amountAtRisk, 4000);
});

test("calculator never turns negative or missing user inputs into invented values", () => {
  const result = calculateCompensationScenario({ guarantee: -2, creditedActivity: "not a number", threshold: 20, conversionRate: -4 });
  assert.deepEqual(result.trace, { payableActivity: 0, productivityPay: 0, cashCompensation: 0, totalValueBeforeRisk: 0, contractorExpenses: 0, repaymentRisk: 0 });
  assert.equal(result.illustrativeNetValue, 0);
});

test("scenario comparison retains each activity assumption", () => {
  const comparison = compareCompensationScenarios({ guarantee: 100, threshold: 10, conversionRate: 5 }, { low: 5, expected: 10, high: 20 });
  assert.equal(comparison.low.illustrativeNetValue, 100);
  assert.equal(comparison.expected.illustrativeNetValue, 100);
  assert.equal(comparison.high.illustrativeNetValue, 150);
});
