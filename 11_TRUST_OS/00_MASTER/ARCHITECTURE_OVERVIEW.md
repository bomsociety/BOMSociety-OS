# Architecture Overview

```mermaid
flowchart LR
  C[People, organizations, agents] --> E[Edge: WAF, DDoS, bot controls]
  E --> I[Identity & session service]
  I --> V[Verification adapters]
  I --> T[Trust Engine / policy decision point]
  T --> P[API policy enforcement]
  P --> D[(Separated data domains)]
  D --> A[Analytics isolation & aggregation]
  A --> X[Enterprise Decision Intelligence]
  V --> L[Evidence ledger]
  T --> L
  P --> L
  L --> O[Audit, monitoring, incident response]
```

Control planes are separated from data planes. PII/token vault, evidence ledger, product events, security telemetry, and enterprise aggregates use separate logical stores, access roles, encryption contexts, retention schedules, and export paths. A policy decision point evaluates identity, device/session, tenant, purpose, jurisdiction, consent, classification, and risk at request time.
