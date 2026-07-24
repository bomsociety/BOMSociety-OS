# Provider-Agnostic Verification Framework

Verification is an orchestration framework, not a vendor dependency. Connectors implement a stable interface: `discover`, `initiate`, `collect`, `verify`, `refresh`, `revoke`, and `health`. Providers may include identity platforms, professional networks, registries, institutional email, medical councils, enterprise SSO, and future country-specific authorities; no provider is assumed authoritative beyond its configured claims.

## Verification record
A record binds subject, claim type, evidence references, provider connector/version, jurisdiction, confidence dimensions, status, issued/expiry/reverification timestamps, consent/legal basis, reviewer actions, and integrity hash. Evidence is encrypted, access-controlled, minimized, and retained separately from the public identity profile.

## Confidence and workflow
Evaluate identity, professional, license, and organization confidence independently. Sources are weighted by authority, directness, integrity, freshness, corroboration, and conflict. Workflow: requested → evidence pending → automated assessment → manual review (if ambiguous, risky, or challenged) → verified/rejected/expired/revoked. Manual reviewers see minimum necessary evidence; four-eyes approval is required for high-impact overrides. Reverification is scheduled before expiry and triggered by source changes, risk signals, claim changes, or jurisdiction policy. Outcomes include machine-readable reasons and an appeal path.
