# Threat Model

## Assets
Identity evidence, credentials, sessions, consent, tenant data, Decision Episodes, aggregated intelligence, keys/secrets, audit records, model artifacts, and deployment provenance are protected assets.

## Adversaries and mitigations
| Threat | Primary controls |
|---|---|
| Account takeover / credential stuffing | phishing-resistant MFA, breach-password checks, rate limits, device/session risk, re-authentication |
| Sybil, scraper, bot, or synthetic response fraud | bot classes, behavioral signals, challenge escalation, duplicate controls, quarantined analytics |
| Privileged misuse / tenant crossing | RBAC + ABAC, just-in-time elevation, tenant predicates, immutable audit, quarterly access review |
| Evidence forgery / verification abuse | signed provider receipts, provenance, expiry, corroboration, manual review, connector isolation |
| API abuse / data exfiltration | scoped tokens, quotas, DLP egress policy, aggregation gate, export approval and watermarking |
| Supply-chain compromise | lockfiles, signed builds, SBOM, dependency scanning, isolated CI credentials, provenance attestations |
| Ransomware / destructive change | immutable backups, restoration exercises, least privilege, segmented accounts, change controls |
| Prompt injection / agent misuse | tool allowlists, scoped service identities, untrusted-content boundaries, approval gates, full tool audit |

Threat assessment is repeated at design, material change, incident, and at least annually. Severity combines likelihood, impact, exploitability, detectability, and affected data class.
