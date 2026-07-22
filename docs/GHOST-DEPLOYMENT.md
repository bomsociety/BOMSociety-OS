# Ghost deployment and rollback

## Automated deployment

`.github/workflows/deploy-ghost-theme.yml` is the only production theme deployment workflow. It can only be started manually and always checks out `main` itself. It runs the repository test suite, builds a fresh ZIP from `ghost-theme/`, verifies that `package.json` is at the archive root, and hashes that same archive before uploading it to Ghost. It never downloads a workflow artifact, so an artifact from a pull request or earlier run cannot be deployed.

The workflow creates a short-lived Ghost Admin API JWT at runtime. Configure these encrypted GitHub Actions secrets in the `production` environment; do not put their values in repository files, logs, or workflow inputs:

- `GHOST_ADMIN_URL` — Ghost administrative site URL (for example, `https://example.com`).
- `GHOST_ADMIN_KEY` — Ghost Admin API key with theme upload and activation permission.
- `GHOST_SITE_URL` — public site URL to verify after activation.

After upload, Ghost returns the uploaded theme name. The workflow activates precisely that returned name, then requests the public homepage and requires all three production strings. Each of build, upload, activation, and verification has an independent named step and job-summary result. A failed step stops later steps; deployments are serialized with a production concurrency lock.

## Rollback

If upload or activation fails, later deployment steps do not run and the currently active Ghost theme remains active. If activation succeeds but verification fails, immediately use **Ghost Admin → Settings → Design → Change theme** to activate the previously active theme. Verify the public homepage afterward. Record the incident, the workflow run URL, the prior theme name, and the restored theme name.

Before a planned deployment, note the currently active theme name in Ghost Admin so it is available for rollback. Keep the prior theme installed until the new theme has passed production verification.
