# Sprint 9 Intelligence Mapping

The first product records only actions that improve a defined enterprise intelligence product. No interaction exposes competency weights, scoring formulas, percentages, XP, or fabricated intelligence.

| User action | Primary Intelligence Objects | Signals captured | Enterprise products enabled |
| --- | --- | --- | --- |
| Opens BOM Score breakdown | `physician-competency-profile` | Intent to inspect competency model | Physician Decision Index™ |
| Opens **Get Paid More** | `compensation-decision-journey`, `rvu-compensation` | Compensation decision interest | Physician Decision Index™, Compensation Intelligence™ |
| Selects a learning depth | `compensation-learning-preference` | Depth and time preference | Compensation Intelligence™ |
| Advances a lesson | `compensation-readiness` | Completion and practical-action intent | Physician Decision Index™, Compensation Intelligence™ |
| Opens the real case | `compensation-decision-pattern` | Case relevance | Compensation Intelligence™ |
| Starts or answers the knowledge check | `compensation-readiness`, `compensation-knowledge-signal` | Concept selected and answer pattern | Physician Decision Index™, Compensation Intelligence™ |
| Opens an AI tension card | `ai-adoption-decision-journey` | AI workflow interest | AI Adoption Intelligence™ |
| Opens another tension card | Corresponding decision journey object | Topic-level decision interest | Physician Decision Index™ |

## Implementation

`ghost-theme/assets/js/main.js` owns the interaction-to-signal dispatch. Each interactive product control carries `data-intelligence-action`; `intelligence_action` events include the action, mapped intelligence objects, signals, and enabled products. BOM Score changes are local interface feedback for meaningful completion only. Future score decay may be added without exposing weights.
