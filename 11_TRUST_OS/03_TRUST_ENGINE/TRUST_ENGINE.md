# BOM Trust Engine

The Trust Engine is a versioned policy and scoring service. It is not a universal reputation score and must not make protected-class inferences. Scores are calibrated per purpose, bounded [0,100], timestamped, explainable through contributing factors, and never used as the sole basis for a material adverse action.

## Outputs
| Output | Meaning |
|---|---|
| Human Score / Bot Score | likelihood of genuine person interaction / automation risk |
| Verification Score | strength and freshness of claim evidence |
| Trust Score | policy-composed reliability for a stated purpose |
| Professional / Enterprise Score | evidence-backed confidence for respective claims |
| Research, Aggregation, Export Eligibility | allow/deny/conditional decisions with policy reasons |
| Privacy Classification | governing data class and handling obligations |

`TrustScore = policy(version, evidence quality, verification freshness, integrity, behavior risk, conflicts, purpose)`; raw model values are not externally exposed. Scores decay with time, source expiry, adverse integrity events, and unresolved conflicts. Policy specifies thresholds and human-review bands, not application code.

Every event carries `confidence`, `provenance`, `integrity`, and append-only `audit_history`: source, collector, timestamp, cryptographic hash/signature where available, transformation lineage, policy/model version, decision, actor, and review. Scores may be recomputed; historic decisions retain their original versions.
