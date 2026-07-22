# Sprint 4 — Publishing Engine

The publishing engine is a deterministic projection layer over a Sprint 3 canonical Knowledge Object. It does not create, infer, enrich, or publish factual content. It only reuses supplied summaries, claims, evidence fields, relationships, and SEO fields. Empty evidence values are deliberately copied unchanged.

## Pipeline

```text
Sprint 2 Knowledge Object schema + Sprint 3 canonical object
                           |
                           v
             validate UUIDs, required claims, evidence presence
                           |
                           v
                generatePublishingBundle(object)
                           |
     +---------------------+----------------------------+
     |                     |                            |
     v                     v                            v
 Ghost draft        Newsletter / podcast / FAQ     Metadata / discovery
 payload            payloads                        (SEO, OG, JSON-LD,
                                                     links, related topics,
                                                     founder summary)
     |                     |                            |
     +---------------------+----------------------------+
                           v
          versioned artifacts with object + claim UUID traceability
```

## Supported output formats

1. `ghost_article` — a Ghost-compatible **draft** payload; the engine never calls Ghost.
2. `weekly_newsletter`
3. `podcast_script`
4. `faq`
5. `seo_metadata`
6. `open_graph_metadata`
7. `json_ld`
8. `internal_link_recommendations`
9. `related_topic_recommendations`
10. `founder_dashboard_summary`

Every artifact has `metadata.artifact_version`, `metadata.engine_version`, `metadata.source_object_id`, `metadata.source_object_version`, and `metadata.claim_ids`. The `source` object repeats the UUID lineage for consumers that only retain content fields.

## Local generation and validation

The generator writes a JSON file only; it has no network or Ghost publishing capability.

```bash
npm run publishing:generate -- path/to/knowledge-object.json /tmp/publishing-artifacts.json
npm run validate:publishing
```
