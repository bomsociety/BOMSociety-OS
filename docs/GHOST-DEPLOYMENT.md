# Ghost deployment and rollback

## Automated deployment

`.github/workflows/deploy-ghost-theme.yml` is the only production theme deployment workflow. A push to `main` (including a merged pull request) starts it automatically. It runs the repository test suite plus knowledge, publishing, decision, and measurement validation; builds a fresh ZIP from `ghost-theme/`; verifies that `package.json` is at the archive root; and hashes that same archive before uploading it to Ghost. It never downloads a workflow artifact, so an artifact from a pull request or earlier run cannot be deployed.

The workflow creates a short-lived Ghost Admin API JWT at runtime. Configure these encrypted GitHub Actions secrets in the `production` environment; do not put their values in repository files, logs, or workflow inputs:

- `GHOST_ADMIN_URL` — Ghost administrative site URL (for example, `https://example.com`). Change it only when the Ghost Admin endpoint moves, including a domain or path change.
- `GHOST_ADMIN_KEY` — Ghost Admin API key with theme upload and activation permission. Replace it when the key is rotated, revoked, or its integration is replaced.
- `GHOST_SITE_URL` — public site URL used for homepage verification. Change it only when the public site origin changes.
- `GHOST_API_VERSION` — the `Accept-Version` value supported by the target Ghost Admin API, in `v<major>.<minor>` form (for example, `v6.54`). The workflow default is `v6.54` for the currently supported production instance. Ghost does not provide a forever-stable Admin API compatibility version: it can retire older client versions with `UPDATE_CLIENT`. Set this secret to the version reported by Ghost when that occurs; a future Ghost minor upgrade then needs only this secret update, not a repository change.

Every Admin API request sends `Accept-Version` from `GHOST_API_VERSION`, including reading the active theme, uploading, activating, and rollback. The workflow uses the documented default only when the secret is not set; production should set the secret explicitly so its configuration is independent of the repository default.

Before upload, the workflow reads and records the currently active Ghost theme. It logs the raw upload response, then activates the installed identifier returned by Ghost. If that response omits an identifier, it queries installed themes and selects the theme whose name matches `ghost-theme/package.json`; it never derives an activation name from the ZIP filename. It then requests the public homepage and requires an HTTP 200 plus a title, hero headline, and CTA marker. The markers default to `BOMSociety`, `What decision needs your attention?`, and `Create My Free Profile`; override them with GitHub Actions environment variables `GHOST_VERIFY_TITLE`, `GHOST_VERIFY_HERO`, and `GHOST_VERIFY_CTA`. Each successful phase writes `BUILD SUCCESS`, `UPLOAD SUCCESS`, `ACTIVATION SUCCESS`, or `VERIFICATION SUCCESS` to the job summary. Deployments are serialized with a production concurrency lock.

## Rollback

If upload or activation fails, later deployment steps do not run and the currently active Ghost theme remains active. If activation succeeds but verification fails, the workflow automatically reactivates the recorded prior theme, writes `ROLLBACK SUCCESS` to the job summary, and still fails the workflow. Investigate a failed rollback immediately; the uploaded theme remains installed but inactive.

Keep the prior theme installed until the new theme has passed production verification.
