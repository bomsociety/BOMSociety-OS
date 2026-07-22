# BOMSociety Knowledge Engine

This directory is the canonical, content-free foundation for BOMSociety knowledge.

## Model

```text
Knowledge Object
 ├─ Claims ──> Evidence ──> Sources
 │      └──> Corroboration
 ├─ Decisions
 ├─ Relationships ──> other canonical records
 └─ Learning Paths ──> Lessons ──> Knowledge Objects

Knowledge Object ──> Importer ──> Ghost | Newsletter | Podcast | FAQ | SEO
```

Every persisted record has an immutable UUID (`id`), a positive integer `version`, and creation/update timestamps. Claim records additionally require evidence level, corroboration score, confidence, and reviewer.

## Schemas and validation

The JSON Schema 2020-12 catalog is `schemas/index.json`. `src/json-schema-validator.mjs` validates the JSON Schema subset used by this catalog without external runtime dependencies. Use `validateKnowledgeRecord(type, record)` to receive validation errors, or `assertValidKnowledgeRecord(filename, record, schemas)` when schemas are already loaded.

## Imports

`importKnowledgeObject(object, { claims })` produces channel-ready drafts only; it does not write to Ghost or publish material. Validate the knowledge object before importing it.
