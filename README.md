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

1. Open a pull request and let the validation workflow pass.
2. Merge the approved change.
3. Download the `bomsociety-ghost-theme` workflow artifact.
4. Back up the active Ghost theme.
5. Upload and activate the archive in Ghost Admin.
6. Verify the homepage, navigation, member Portal, posts, pages, and topic archives.

The GitHub workflow validates and packages the theme; it does not activate a theme in Ghost.

## Versioning

The root package, theme package, and `VERSION` file use the same SemVer prerelease value. The current version is `1.2.0-b7`.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) describes system boundaries and operational responsibilities.
- [`docs/PRODUCT-ORIENTATION.md`](docs/PRODUCT-ORIENTATION.md) describes product strategy and information hierarchy.
- [`docs/PUBLISHING-ENGINE.md`](docs/PUBLISHING-ENGINE.md) documents the deterministic, offline draft-artifact pipeline for canonical Knowledge Objects.
