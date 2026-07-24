# API-First Platform

Domain APIs: Identity, Verification, Trust, Analytics, Enterprise, Consent, and Audit. REST/JSON contracts use explicit resource ownership, idempotency keys for writes, pagination, problem-details errors, request/correlation IDs, and OpenAPI publication. Major versions appear in the path; additive changes are backward compatible, deprecations are announced with migration windows, and schemas are contract-tested.

OAuth 2.1/OIDC authenticates users and clients. Authorization uses audience-bound, short-lived tokens and granular scopes such as `identity:read:self`, `verification:submit`, `trust:read`, `analytics:write`, `enterprise:aggregate:read`, and `audit:read`; scopes never override ABAC, consent, tenant, or aggregate policy. Machine clients use workload identity and mTLS/signed assertions where appropriate.

Webhooks are signed, timestamped, replay-protected, versioned, retried with bounded exponential backoff, and deliver only minimal payloads; consumers verify signatures and fetch authorized resources. SDKs are generated from stable contracts, pin versions, expose retry/idempotency guidance, and never embed secrets. Rate limits, quotas, developer audit trails, and revocation are available across all APIs.
