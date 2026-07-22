import { invariant } from "./validation.mjs";

export function completionScore(workflow, state) {
  invariant(state?.workflowId === workflow?.id, "state belongs to a different workflow");
  const required = workflow.steps.filter((step) => step.required !== false);
  const totalWeight = required.reduce((total, step) => total + (step.weight ?? 1), 0);
  const completeWeight = required.filter((step) => state.completedStepIds.includes(step.id)).reduce((total, step) => total + (step.weight ?? 1), 0);
  return Object.freeze({ completed: completeWeight, total: totalWeight, score: totalWeight === 0 ? 1 : completeWeight / totalWeight, isComplete: required.every((step) => state.completedStepIds.includes(step.id)) });
}

export function trackProgress(workflow, state) {
  const completion = completionScore(workflow, state);
  return Object.freeze({ workflowId: workflow.id, completedStepCount: state.completedStepIds.length, totalStepCount: workflow.steps.length, ...completion });
}
