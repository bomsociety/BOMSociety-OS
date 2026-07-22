# Ghost deployment and rollback

## Automated deployment

`.github/workflows/deploy-ghost-theme.yml` is the only production theme deployment workflow. A push to `main` (including a merged pull request) starts it automatically. It runs the repository test suite plus knowledge, publishing, decision, and measurement validation; builds a fresh ZIP from `ghost-theme/`; verifies that `package.json` is at the archive root; and hashes that same archive before uploading it to Ghost. It never downloads a workflow artifact, so an artifact from a pull request or earlier run cannot be deployed.

The workflow creates a short-lived Ghost Admin API JWT at runtime. Configure these encrypted GitHub Actions secrets in the `production` environment; do not put their values in repository files, logs, or workflow inputs:

- `GHOST_ADMIN_URL` — Ghost administrative site URL (for example, `https://example.com`).
- `GHOST_ADMIN_KEY` — Ghost Admin API key with theme upload and activation permission.
- `GHOST_SITE_URL` — public site URL to verify after activation.

Before upload, the workflow reads and records the currently active Ghost theme. After upload, Ghost returns the uploaded theme name and the workflow activates precisely that returned name. It then requests the public homepage and requires an HTTP 200 plus a title, hero headline, and CTA marker. The markers default to `BOMSociety`, `What decision needs your attention?`, and `Create My Free Profile`; override them with GitHub Actions environment variables `GHOST_VERIFY_TITLE`, `GHOST_VERIFY_HERO`, and `GHOST_VERIFY_CTA`. Each successful phase writes `BUILD SUCCESS`, `UPLOAD SUCCESS`, `ACTIVATION SUCCESS`, or `VERIFICATION SUCCESS` to the job summary. Deployments are serialized with a production concurrency lock.

## Rollback

If upload or activation fails, later deployment steps do not run and the currently active Ghost theme remains active. If activation succeeds but verification fails, the workflow automatically reactivates the recorded prior theme, writes `ROLLBACK SUCCESS` to the job summary, and still fails the workflow. Investigate a failed rollback immediately; the uploaded theme remains installed but inactive.

Keep the prior theme installed until the new theme has passed production verification.
