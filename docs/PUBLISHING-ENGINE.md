# Publishing Engine

The Publishing Engine is an offline, deterministic transform from a Sprint 3 canonical Knowledge Object to ten **draft-only** artifacts. It is implemented without plugins, external libraries, Ghost Admin API calls, or any other network publishing behavior.

## Inputs and preservation

`lib/publishing-engine.mjs` accepts the existing canonical object unchanged. It reads structured fields already stored in that object: summaries, claims, decision objects, lessons, taxonomy, relationships, SEO fields, corroboration state, and empty evidence placeholders. It does not create facts, citations, topics, or evidence. Empty evidence placeholders are copied into every artifact's `generated_from` record.

Every artifact carries:

- `artifact_type` and `artifact_version`;
- originating `knowledge_object_uuid` / `knowledge_object_id` and source object version (when the canonical record provides one);
- all source Claim IDs and copied evidence placeholders; and
- `publication: { mode: "draft", published: false, network_requests: false }`.

## Output formats

One JSON document is created for each output type:

1. `ghost-article` — a Ghost-compatible **draft** payload.
2. `weekly-newsletter` — a draft newsletter payload.
3. `podcast-script` — a draft script segmented by canonical lessons.
4. `faq` — claim-backed questions and answers.
5. `seo-metadata`.
6. `open-graph-metadata`.
7. `json-ld` structured data.
8. `internal-link-recommendations` derived from canonical relationships.
9. `related-topic-recommendations` derived only from shared existing taxonomy.
10. `founder-dashboard-summary`.

## Commands

```bash
npm run validate:publishing
npm run publishing:generate
```

The generate command reads all `knowledge/objects/*/knowledge-object.json` files and writes draft JSON into the ignored `publishing-artifacts/` directory. For a one-object smoke test:

```bash
node automation/generate-publishing-artifacts.mjs \
  --input knowledge/objects/employment-contracts/knowledge-object.json \
  --output /tmp/publishing-artifacts
```

The command only writes local JSON files and reports that no publication occurred.
