import { invariant, nonEmptyString } from "./validation.mjs";

export function buildDependencyGraph(steps) {
  invariant(Array.isArray(steps) && steps.length > 0, "steps must be a non-empty array");
  const byId = new Map();
  for (const step of steps) {
    nonEmptyString(step?.id, "step id");
    invariant(!byId.has(step.id), `duplicate step id: ${step.id}`);
    byId.set(step.id, { ...step, dependsOn: [...(step.dependsOn ?? [])] });
  }
  for (const step of byId.values()) {
    for (const dependency of step.dependsOn) {
      nonEmptyString(dependency, `dependency for ${step.id}`);
      invariant(byId.has(dependency), `step ${step.id} depends on unknown step: ${dependency}`);
      invariant(dependency !== step.id, `step ${step.id} cannot depend on itself`);
    }
  }
  const visiting = new Set(); const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) throw new TypeError(`dependency graph contains a cycle at step: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id); byId.get(id).dependsOn.forEach(visit); visiting.delete(id); visited.add(id);
  };
  byId.forEach((_, id) => visit(id));
  return Object.freeze({ steps: byId });
}

export function availableSteps(graph, completedStepIds = []) {
  const completed = new Set(completedStepIds);
  return [...graph.steps.values()].filter((step) => !completed.has(step.id) && step.dependsOn.every((id) => completed.has(id)));
}
