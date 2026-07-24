# Global Configuration Architecture

Jurisdiction policy is a registry chain: `country → profession → license authority → verification provider → rules`. Configuration defines accepted identifiers, source authority, evidence minimums, expiry/reverification, language, consent/legal basis, data residency, retention, age/access rules, localization, aggregation threshold, and export constraints. Product code consumes policy versions, not US-specific assumptions.

Each country launch requires a configuration review, source validation, privacy/security assessment, localized notices/rights operations, regional hosting/transfer decision, test fixtures, and rollback plan. Conflicting claims remain unresolved rather than being normalized across authorities without documented mapping. Global identifiers are pseudonymous; local identifiers are vaulted and never used as an enterprise join key.
