/**
 * Transparent, client-safe arithmetic for a physician compensation illustration.
 * It intentionally does not estimate market value, legal compliance, tax, or reimbursement.
 */
export const COMPENSATION_CALCULATOR_VERSION = "1.0.0";

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export function calculateCompensationScenario(input = {}) {
  const guarantee = number(input.guarantee);
  const creditedActivity = number(input.creditedActivity);
  const threshold = number(input.threshold);
  const conversionRate = number(input.conversionRate);
  const qualityAdjustment = number(input.qualityAdjustment);
  const callPay = number(input.callPay);
  const leadershipPay = number(input.leadershipPay);
  const otherCash = number(input.otherCash);
  const benefitsValue = number(input.benefitsValue);
  const contractorExpenses = number(input.contractorExpenses);
  const repaymentRisk = number(input.repaymentRisk);
  const payableActivity = Math.max(0, creditedActivity - threshold);
  const productivityPay = payableActivity * conversionRate;
  const cashCompensation = guarantee + productivityPay + qualityAdjustment + callPay + leadershipPay + otherCash;
  const totalValueBeforeRisk = cashCompensation + benefitsValue;
  const illustrativeNetValue = Math.max(0, totalValueBeforeRisk - contractorExpenses - repaymentRisk);

  return {
    inputs: { guarantee, creditedActivity, threshold, conversionRate, qualityAdjustment, callPay, leadershipPay, otherCash, benefitsValue, contractorExpenses, repaymentRisk },
    trace: { payableActivity, productivityPay, cashCompensation, totalValueBeforeRisk, contractorExpenses, repaymentRisk },
    illustrativeNetValue,
    amountDependentOnPerformance: productivityPay + qualityAdjustment,
    amountAtRisk: repaymentRisk,
    warnings: [
      "Educational illustration only. Inputs are supplied by you; verify terms against the written agreement and compensation plan.",
      "This tool does not determine fair market value, legal compliance, worker classification, tax treatment, or the correct offer."
    ]
  };
}

export function compareCompensationScenarios(baseInput, scenarios) {
  return Object.fromEntries(Object.entries(scenarios ?? {}).map(([name, activity]) => [
    name,
    calculateCompensationScenario({ ...baseInput, creditedActivity: activity })
  ]));
}
