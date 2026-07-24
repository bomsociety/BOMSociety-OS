# BOMSociety Trust Operating System (BTOS) v1.0

BTOS is the durable, API-first control plane for BOMSociety trust, identity, safety, data stewardship, and privacy-preserving Decision Intelligence. It governs product, platform, enterprise, research, and partner implementations. It is normative unless a more restrictive law, contract, or approved ADR applies.

## Non-negotiable invariants

1. BOMSociety never sells identifiable physician or employer data.
2. Enterprise outputs are aggregate, privacy-preserving, purpose-limited Decision Intelligence—not raw Decision Episode histories.
3. Human analytics and automation traffic are isolated before measurement; uncertain traffic is not silently promoted to human.
4. Authorization is deny-by-default, least-privilege, tenant-scoped, and continuously evaluated.
5. Every material trust assertion and derived output is attributable, time-bounded, integrity-protected, and auditable.
6. Country expansion is configuration-driven through jurisdiction, profession, authority, and rule registries.

## Architecture map

| Area | Normative design |
|---|---|
| Foundation | [Trust Constitution](00_MASTER/TRUST_CONSTITUTION.md), [principles](00_MASTER/GUIDING_PRINCIPLES.md), [threat model](00_MASTER/THREAT_MODEL.md), [architecture](00_MASTER/ARCHITECTURE_OVERVIEW.md) |
| Subjects and verification | [identity](01_IDENTITY/IDENTITY_LIFECYCLE.md), [verification framework](02_VERIFICATION/VERIFICATION_FRAMEWORK.md) |
| Decisions and safety | [Trust Engine](03_TRUST_ENGINE/TRUST_ENGINE.md), [security](04_SECURITY/SECURITY_ARCHITECTURE.md), [bot intelligence](05_BOT_INTELLIGENCE/BOT_INTELLIGENCE.md) |
| Data and analytics | [governance](06_DATA_GOVERNANCE/DATA_GOVERNANCE.md), [analytics](07_ANALYTICS/ANALYTICS_ARCHITECTURE.md), [methods](11_METHODS/DECISION_INTELLIGENCE_METHODS.md) |
| Customers and scale | [enterprise](08_ENTERPRISE/ENTERPRISE_ASSURANCE.md), [global](09_GLOBAL/GLOBAL_ARCHITECTURE.md), [API](10_API/API_PLATFORM.md) |
| Assurance | [compliance](12_COMPLIANCE/COMPLIANCE_PROGRAM.md), [exit readiness](13_EXIT_READINESS/EXIT_READINESS.md), [ADRs](adrs/) |

Schemas in [`schemas/`](schemas/) are JSON Schema Draft 2020-12 contracts. Implementations must version contracts compatibly and validate at every trust boundary.
