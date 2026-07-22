import { availableSteps, buildDependencyGraph } from "./dependency-graph.mjs";
import { invariant, nonEmptyString } from "./validation.mjs";

export function createWorkflowState(workflow) {
  nonEmptyString(workflow?.id, "workflow id");
  return Object.freeze({ workflowId: workflow.id, completedStepIds: Object.freeze([]), startedAt: null, completedAt: null });
}

export function advanceWorkflow(workflow, state, stepId, at = new Date().toISOString()) {
  const graph = buildDependencyGraph(workflow.steps);
  nonEmptyString(stepId, "stepId");
  invariant(state.workflowId === workflow.id, "state belongs to a different workflow");
  invariant(graph.steps.has(stepId), `unknown workflow step: ${stepId}`);
  invariant(!state.completedStepIds.includes(stepId), `workflow step already completed: ${stepId}`);
  invariant(availableSteps(graph, state.completedStepIds).some((step) => step.id === stepId), `workflow step is blocked by dependencies: ${stepId}`);
  const completedStepIds = [...state.completedStepIds, stepId];
  return Object.freeze({ workflowId: state.workflowId, completedStepIds: Object.freeze(completedStepIds), startedAt: state.startedAt ?? at, completedAt: completedStepIds.length === workflow.steps.length ? at : null });
}
