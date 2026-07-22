import { invariant, nonEmptyString, validateKnowledgeReferences } from "./validation.mjs";

export const RECOMMENDATION_TYPES = Object.freeze(["personalized_learning", "related_decision", "risk_flag", "action_item"]);

function traceable(type, id, knowledgeObjectIds, knownIds, details = {}) {
  invariant(RECOMMENDATION_TYPES.includes(type), `unsupported recommendation type: ${type}`);
  nonEmptyString(id, "recommendation id");
  validateKnowledgeReferences(knowledgeObjectIds, knownIds, `recommendation ${id}`);
  return Object.freeze({ id, type, knowledgeObjectIds: Object.freeze([...knowledgeObjectIds]), ...details });
}

export function personalizedLearningRecommendations({ learnerNeeds = [], learningObjects = [] }, knownIds) {
  return learningObjects
    .filter((item) => item.need && learnerNeeds.includes(item.need))
    .map((item) => traceable("personalized_learning", item.id, item.knowledgeObjectIds, knownIds, { need: item.need, priority: item.priority ?? 0 }));
}

export function relatedDecisionRecommendations(decision, decisions = [], knownIds) {
  return (decision.relatedDecisionIds ?? []).map((id) => {
    const related = decisions.find((candidate) => candidate.id === id);
    invariant(related, `decision ${decision.id} references unknown related decision: ${id}`);
    return traceable("related_decision", related.id, related.knowledgeObjectIds, knownIds, { decisionId: related.id });
  });
}

export function riskFlags(decision, signals = {}, knownIds) {
  return (decision.riskRules ?? []).filter((rule) => {
    nonEmptyString(rule.signal, "risk rule signal");
    if (rule.operator === "equals") return signals[rule.signal] === rule.value;
    if (rule.operator === "atMost") return signals[rule.signal] <= rule.value;
    if (rule.operator === "atLeast") return signals[rule.signal] >= rule.value;
    throw new TypeError(`unsupported risk rule operator: ${rule.operator}`);
  }).map((rule) => traceable("risk_flag", rule.id, rule.knowledgeObjectIds, knownIds, { severity: rule.severity, signal: rule.signal }));
}

export function actionItems(decision, state, knownIds) {
  invariant(state && Array.isArray(state.completedStepIds), "workflowState must include completedStepIds");
  const incomplete = new Set(decision.workflow.steps.map((step) => step.id).filter((id) => !state.completedStepIds.includes(id)));
  return (decision.actionItems ?? []).filter((item) => !item.stepId || incomplete.has(item.stepId))
    .map((item) => traceable("action_item", item.id, item.knowledgeObjectIds, knownIds, { stepId: item.stepId ?? null, priority: item.priority ?? 0 }));
}

export function recommend(context, knownIds) {
  invariant(context && typeof context === "object", "recommendation context must be an object");
  const { decision, decisions = [], learnerNeeds = [], learningObjects = [], signals = {}, workflowState } = context;
  return Object.freeze([
    ...personalizedLearningRecommendations({ learnerNeeds, learningObjects }, knownIds),
    ...relatedDecisionRecommendations(decision, decisions, knownIds),
    ...riskFlags(decision, signals, knownIds),
    ...actionItems(decision, workflowState, knownIds),
  ]);
}
