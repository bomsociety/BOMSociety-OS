# Identity Lifecycle and Access Model

## Lifecycle
`anonymous → registered → verified (professional/physician/organization) → suspended | revoked | deleted`. States are independent per credential and tenant. Registration creates a pseudonymous subject ID; identifying attributes are vaulted. Verification raises an attribute assurance level, never silently changes organizational authorization. Suspension blocks sessions; revocation invalidates dependent assertions; deletion executes the data-retention policy while preserving legally required, minimized audit evidence.

## Trust levels and roles
| Level | Evidence | Example permitted capability |
|---|---|---|
| Anonymous | device/session risk only | public content, consented anonymous measurement |
| Registered | verified contact channel | saved preferences, private account features |
| Verified Professional | profession evidence + freshness | professional experiences where policy permits |
| Verified Physician | license-authority evidence + active status | physician-restricted experiences |
| Enterprise Organization | domain/SSO/legal-org evidence | tenant workspace |

Roles: `member`, `professional`, `physician`, `enterprise_viewer`, `enterprise_analyst`, `enterprise_admin`, `support_operator`, `security_admin`, `privacy_officer`, `trust_reviewer`, `platform_admin`. RBAC grants a capability baseline; ABAC narrows by tenant, data class, purpose, country, verification, consent, risk, and time. No role bypasses aggregate/export policy.

## Sessions, services, and agents
Use OIDC/OAuth 2.1 with PKCE, short-lived access tokens, rotating refresh tokens, sender-constrained tokens where supported, session/device binding, idle and absolute expiry, revocation, concurrent-session controls, and step-up MFA for sensitive actions. Cookies are `Secure`, `HttpOnly`, `SameSite`, scoped, and rotated on authentication changes. Service accounts are workload identities with non-human owner, scope, expiry, rotation, and no interactive login. AI agents use dedicated identities, tool-level scopes, bounded delegation, approval for consequential actions, and immutable action logs.
