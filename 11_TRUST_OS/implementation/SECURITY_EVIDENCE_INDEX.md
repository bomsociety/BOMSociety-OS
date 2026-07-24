# Security evidence index
| Control | Evidence | Status |
|---|---|---|
| Analytics validation/quarantine | `trust/platform.mjs` `validateAnalyticsEvent`, `LocalAnalyticsSink`; `test/trust-platform.test.mjs` | repository-enforced |
| Identity and verification contracts | `trust/platform.mjs` `IDENTITY_TIERS`, `verificationAdapters`, `decideVerification` | mock-only |
| Enterprise release gate | `trust/platform.mjs` `aggregateEnterprise`; tests | repository-enforced synthetic fixtures |
| Headers/cookies/WAF | external checklist | Cloudflare/Ghost configuration required |
