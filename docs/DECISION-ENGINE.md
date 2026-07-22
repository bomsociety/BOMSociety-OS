# Decision Engine

The Decision Engine is reusable, deterministic infrastructure for physician decision workflows. It has no UI, Ghost, publication, plugin, or generative-content dependency.

## Architecture

```text
Canonical Knowledge Objects ──► validation/traceability ─┬─► decision scoring
                                                          ├─► dependency-aware workflow
Physician inputs / progress / signals ───────────────────┼─► progress + completion score
                                                          └─► recommendation engine
                                                                  ├─ personalized learning
                                                                  ├─ related decisions
                                                                  ├─ risk flags
                                                                  └─ action items
```

### Canonical traceability

A caller provides the canonical Knowledge Objects it is authorized to use. `canonicalIds` rejects missing titles and duplicate IDs. Every decision, action, risk rule, learning recommendation, related-decision recommendation, and emitted recommendation must cite at least one known `knowledgeObjectId`. The engine emits identifiers and supplied metadata only; it never generates clinical, legal, financial, or other factual content.

### Decision definition

A decision contains `id`, `title`, `knowledgeObjectIds`, and a workflow. A workflow has steps with optional `dependsOn`, `weight`, and `required` (`true` by default). `validateDecision` validates top-level traceability and nested action/risk references. `buildDependencyGraph` rejects duplicate, missing, self-referential, and cyclic dependencies before work begins.

### Scoring and progress

`scoreDecision` calculates a normalized weighted score from caller-provided values in `[0,1]`. `advanceWorkflow` permits only unblocked, uncompleted steps and returns immutable state. `trackProgress` and `completionScore` use required-step weights; optional steps never lower required completion.

### Recommendations

`recommend` composes the supported deterministic types: `personalized_learning`, `related_decision`, `risk_flag`, and `action_item`. Personalized learning matches an explicit learner need. Related decisions follow explicit IDs. Risk flags evaluate declared `equals` or threshold rules. Action items are declared mappings for incomplete steps. All types are validated against the same canonical Knowledge Object set.
