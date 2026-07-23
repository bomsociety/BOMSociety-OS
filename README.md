# BOMSociety OS

BOMSociety OS is the source-controlled production architecture for the BOMSociety knowledge and intelligence platform.

## Canonical architecture

- `ghost-theme/` is the only production website source. Its `home.hbs` template is the canonical homepage.
- Ghost(Pro) hosts the rendered site and manages posts, pages, members, and Portal signup.
- `content/`, `knowledge/`, `analytics/`, `products/`, and `conference/` contain structured planning and domain data for future publishing and product workflows.
- `connector/` contains the Custom GPT, Cloudflare Worker, and Google Apps Script integration layer for Ghost Admin API and Google Drive operations.

```text
GitHub → Ghost theme ZIP → Ghost(Pro)
Custom GPT → Cloudflare Worker → Apps Script → Google Drive / Ghost Admin API
```

## Development

Requires Node.js 20 or newer and the `zip` command.

```bash
npm test
npm run theme:zip
```

`npm run theme:zip` creates `releases/UPLOAD-TO-GHOST-bomsociety-theme-v<version>.zip`. Release ZIPs are build outputs and are not committed to the repository.

## Deployment

The **Deploy Ghost theme** workflow starts automatically when a pull request is merged into `main`. It validates, builds, uploads, activates, and verifies the exact theme archive through the Ghost Admin API. If live verification fails after activation, it automatically restores the previously active theme. See [Ghost deployment and rollback](docs/GHOST-DEPLOYMENT.md) for required secrets, configurable markers, and safeguards.

## Versioning

The root package, theme package, and `VERSION` file use the same SemVer prerelease value. The current version is `1.3.5`.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) describes system boundaries and operational responsibilities.
- [`docs/PRODUCT-ORIENTATION.md`](docs/PRODUCT-ORIENTATION.md) describes product strategy and information hierarchy.
- [`docs/PUBLISHING-ENGINE.md`](docs/PUBLISHING-ENGINE.md) documents the deterministic, offline draft-artifact pipeline for canonical Knowledge Objects.
