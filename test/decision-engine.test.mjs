import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceWorkflow, availableSteps, buildDependencyGraph, canonicalIds, completionScore,
  createWorkflowState, recommend, scoreDecision, trackProgress, validateDecision,
} from "../decision/index.mjs";

const knowledgeObjects = [
  { id: "ko-contract", title: "Contract review Knowledge Object" },
  { id: "ko-compensation", title: "Compensation Knowledge Object" },
  { id: "ko-risk", title: "Risk Knowledge Object" },
];
const ids = canonicalIds(knowledgeObjects);
const decision = {
  id: "employment-offer", title: "Assess an employment offer", knowledgeObjectIds: ["ko-contract"],
  workflow: { id: "offer-workflow", steps: [
    { id: "review", weight: 2 }, { id: "compare", dependsOn: ["review"] }, { id: "sign", dependsOn: ["compare"], required: false },
  ] },
  relatedDecisionIds: ["compensation-review"],
  riskRules: [{ id: "low-notice", signal: "noticeDays", operator: "atMost", value: 30, severity: "high", knowledgeObjectIds: ["ko-risk"] }],
  actionItems: [{ id: "request-review", stepId: "review", priority: 10, knowledgeObjectIds: ["ko-contract"] }],
};
const related = { id: "compensation-review", title: "Review compensation", knowledgeObjectIds: ["ko-compensation"], workflow: { id: "pay", steps: [{ id: "read" }] } };

test("scores declared dimensions reproducibly", () => {
  const result = scoreDecision({ dimensions: [{ id: "urgency", weight: 3 }, { id: "impact", weight: 1 }], inputs: { urgency: 1, impact: 0.5 } });
  assert.equal(result.score, 0.875);
  assert.deepEqual(result.breakdown[0], { id: "urgency", value: 1, weight: 3, contribution: 3 });
  assert.throws(() => scoreDecision({ dimensions: [{ id: "urgency", weight: 1 }], inputs: { urgency: 2 } }), /0 to 1/);
});

test("validates canonical traceability and workflow dependency graphs", () => {
  assert.equal(validateDecision(decision, ids), true);
  assert.throws(() => validateDecision({ ...decision, knowledgeObjectIds: ["invented"] }, ids), /unknown Knowledge Object/);
  assert.throws(() => buildDependencyGraph([{ id: "a", dependsOn: ["b"] }, { id: "b", dependsOn: ["a"] }]), /cycle/);
  const graph = buildDependencyGraph(decision.workflow.steps);
  assert.deepEqual(availableSteps(graph).map(({ id }) => id), ["review"]);
});

test("advances a dependency-aware workflow and calculates required completion", () => {
  let state = createWorkflowState(decision.workflow);
  assert.throws(() => advanceWorkflow(decision.workflow, state, "compare"), /blocked/);
  state = advanceWorkflow(decision.workflow, state, "review", "2026-07-21T00:00:00.000Z");
  assert.equal(trackProgress(decision.workflow, state).score, 2 / 3);
  state = advanceWorkflow(decision.workflow, state, "compare", "2026-07-21T00:01:00.000Z");
  assert.deepEqual(completionScore(decision.workflow, state), { completed: 3, total: 3, score: 1, isComplete: true });
  assert.equal(state.completedAt, null, "optional remaining steps do not prevent completion scoring");
});

test("generates only canonical-Knowledge-Object-traceable recommendations", () => {
  const state = createWorkflowState(decision.workflow);
  const recommendations = recommend({
    decision, decisions: [decision, related], learnerNeeds: ["contracts"],
    learningObjects: [{ id: "learn-contract", need: "contracts", priority: 4, knowledgeObjectIds: ["ko-contract"] }],
    signals: { noticeDays: 14 }, workflowState: state,
  }, ids);
  assert.deepEqual(recommendations.map(({ type, id }) => [type, id]), [
    ["personalized_learning", "learn-contract"], ["related_decision", "compensation-review"], ["risk_flag", "low-notice"], ["action_item", "request-review"],
  ]);
  assert.ok(recommendations.every((recommendation) => recommendation.knowledgeObjectIds.every((id) => ids.has(id))));
});
