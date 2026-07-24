# Security Architecture

## Baseline
Zero Trust controls authenticate workloads and people, authorize each request, segment environments/tenants, encrypt in transit (TLS 1.2+) and at rest with envelope keys, and record high-value actions. Cloudflare or an equivalent edge service provides DDoS/WAF/bot/rate controls; origin access is private and authenticated. Secrets reside only in managed secret storage, are never logged, have owner/rotation/expiry, and use short-lived workload credentials. Keys have separate duties, inventory, rotation, revocation, and recovery procedures.

## Application and delivery
Deny-by-default RBAC+ABAC, parameterized queries, allowlisted outbound destinations, SSRF egress controls, CSRF tokens, contextual output encoding, input validation, secure upload scanning, and security headers (CSP nonce/strict policy, HSTS, frame-ancestors, nosniff, referrer policy) are mandatory. APIs apply per-subject/tenant/IP quotas and abuse response. CI/CD requires protected branches, review, tests, dependency/license/security scanning, SBOM, signed/provenanced artifacts, scoped deploy identity, and rollback. No production credential may be available to build jobs by default.

## Operations
Centralize tamper-evident audit logs, security telemetry, alerting, vulnerability SLAs, and incident runbooks. Backups are encrypted, immutable where feasible, access-limited, geographically appropriate, and restoration-tested. Recovery objectives are service-specific and tested through tabletop and restore exercises. Incidents follow detect→contain→preserve evidence→eradicate→recover→notify as required→postmortem; lessons create owned remediation.
