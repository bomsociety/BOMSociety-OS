# Architecture and operations

## Production website

`ghost-theme/` is the canonical production website source. Ghost routes `/` to `home.hbs`; `default.hbs` provides the shared document shell and loads the active site header, footer, CSS, analytics, and interaction JavaScript. Ghost owns posts, pages, members, Portal signup, and the live rendering environment.

The former standalone `homepage/` prototype and unused header/footer partials were removed in Sprint 1 to prevent divergent production behavior.

## Content and knowledge data

The `content/`, `knowledge/`, `analytics/`, `products/`, and `conference/` directories are repository-managed planning and domain data. They are not automatically published to Ghost. Any publishing workflow must explicitly validate and transform this data before it calls the Ghost Admin API.

## Administrative connector

```text
Custom GPT → Cloudflare Worker → Google Apps Script → Google Drive / Ghost Admin API
```

The Worker validates request shape and forwards POST requests to Apps Script. Apps Script validates the connector token and uses Script Properties for Ghost credentials. Google Drive is intended for operational artifacts and backups; it is not the Git source of truth.

## Release process

```text
Pull request → GitHub Actions validation → theme ZIP artifact → manual Ghost upload and activation
```

GitHub Actions runs repository tests and packages a versioned Ghost ZIP as an artifact. The workflow deliberately does not commit binaries, upload themes, or activate production changes. An operator backs up, uploads, activates, and verifies the release in Ghost.

## Operational verification

After activation, verify:

1. Homepage, header, footer, and mobile navigation.
2. Ghost Portal membership signup.
3. Briefs collection, topic archives, posts, pages, and custom page templates.
4. Theme JavaScript interactions and analytics event emission.
5. Rollback readiness using the backed-up active theme.
