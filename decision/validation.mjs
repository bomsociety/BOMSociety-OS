/** Validation helpers for the infrastructure-only Decision Engine. */
export function invariant(condition, message) {
  if (!condition) throw new TypeError(message);
}

export function nonEmptyString(value, name) {
  invariant(typeof value === "string" && value.trim().length > 0, `${name} must be a non-empty string`);
}

export function unitInterval(value, name) {
  invariant(typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1, `${name} must be a number from 0 to 1`);
}

export function canonicalIds(knowledgeObjects) {
  invariant(Array.isArray(knowledgeObjects), "knowledgeObjects must be an array");
  const ids = new Set();
  for (const object of knowledgeObjects) {
    invariant(object && typeof object === "object", "each Knowledge Object must be an object");
    nonEmptyString(object.id, "Knowledge Object id");
    nonEmptyString(object.title, `Knowledge Object ${object.id} title`);
    invariant(!ids.has(object.id), `duplicate Knowledge Object id: ${object.id}`);
    ids.add(object.id);
  }
  return ids;
}

export function validateKnowledgeReferences(references, knownIds, label = "item") {
  invariant(Array.isArray(references) && references.length > 0, `${label} must cite at least one canonical Knowledge Object`);
  for (const reference of references) {
    const id = typeof reference === "string" ? reference : reference?.knowledgeObjectId;
    nonEmptyString(id, `${label} knowledgeObjectId`);
    invariant(knownIds.has(id), `${label} cites unknown Knowledge Object: ${id}`);
  }
}

/** Validates a decision definition before it enters the engine registry. */
export function validateDecision(decision, knownIds) {
  nonEmptyString(decision?.id, "decision id");
  nonEmptyString(decision.title, `decision ${decision.id} title`);
  validateKnowledgeReferences(decision.knowledgeObjectIds, knownIds, `decision ${decision.id}`);
  invariant(decision.workflow && typeof decision.workflow === "object", `decision ${decision.id} requires a workflow`);
  nonEmptyString(decision.workflow.id, `decision ${decision.id} workflow id`);
  invariant(Array.isArray(decision.workflow.steps) && decision.workflow.steps.length > 0, `decision ${decision.id} workflow requires steps`);
  const stepIds = new Set();
  for (const step of decision.workflow.steps) {
    nonEmptyString(step?.id, `decision ${decision.id} workflow step id`);
    invariant(!stepIds.has(step.id), `decision ${decision.id} has duplicate workflow step: ${step.id}`);
    stepIds.add(step.id);
    for (const dependency of step.dependsOn ?? []) {
      nonEmptyString(dependency, `decision ${decision.id} dependency`);
      invariant(dependency !== step.id, `decision ${decision.id} step ${step.id} cannot depend on itself`);
    }
  }
  for (const step of decision.workflow.steps) {
    for (const dependency of step.dependsOn ?? []) invariant(stepIds.has(dependency), `decision ${decision.id} step ${step.id} depends on unknown step: ${dependency}`);
  }
  for (const item of [...(decision.riskRules ?? []), ...(decision.actionItems ?? [])]) {
    nonEmptyString(item.id, `decision ${decision.id} item id`);
    validateKnowledgeReferences(item.knowledgeObjectIds, knownIds, `decision ${decision.id} item ${item.id}`);
  }
  for (const item of decision.actionItems ?? []) {
    if (item.stepId !== undefined) invariant(stepIds.has(item.stepId), `decision ${decision.id} action item ${item.id} references unknown step: ${item.stepId}`);
  }
  for (const rule of decision.riskRules ?? []) {
    nonEmptyString(rule.signal, `decision ${decision.id} risk rule ${rule.id} signal`);
    invariant(["equals", "atMost", "atLeast"].includes(rule.operator), `decision ${decision.id} risk rule ${rule.id} has unsupported operator`);
  }
  return true;
}
