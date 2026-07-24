# Analytics Architecture

Six physically/logically separated domains: Anonymous, Registered, Verified Physician, Enterprise, Research, Operational, and Security. Cross-domain joins require a documented purpose, steward approval, privacy review, and a privacy-preserving transformation; raw identity keys never enter enterprise or research marts.

Canonical events contain immutable event ID/time, schema version, actor pseudonym, tenant/jurisdiction, event name/category, context, consent/purpose, bot class/confidence, verification/trust snapshot, provenance/integrity, and data classification. Producers validate schema at ingestion; invalid events go to quarantine. Event taxonomy separates acquisition, authentication, verification, decision interaction, consent, product usage, aggregation, export, administrative, and security events.

Enterprise analytics is generated only from eligible, verified, purpose-authorized events. It applies quality filters, duplicate prevention, minimum cells, suppression, noise/rounding where required, cohort stability checks, and confidence intervals. Dashboards expose methodology, coverage, missingness, refresh date, and suppression—not member-level observations.
