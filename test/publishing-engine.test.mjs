import test from "node:test";
import assert from "node:assert/strict";
import { generatePublishingBundle, SUPPORTED_OUTPUT_FORMATS, validateKnowledgeObject } from "../lib/publishing-engine.mjs";

const object = {
  id: "2d688fce-e327-4dd7-a11b-46b95178eeaa",
  version: "a16a692d-0785-4cd4-9d58-d5474c5f4ae8",
  slug: "canonical-test-object",
  title: "Canonical Test Object",
  status: "review",
  summary30: "A canonical summary.",
  summary120: "A longer canonical summary.",
  seo: { title: "Canonical Test Object | BOMSociety", description: "", canonical_url: "https://bomsociety.org/canonical-test-object/" },
  claims: [{ id: "7b0582b2-f3c5-4d16-8e2c-25aa3f1f3ca3", statement: "A canonical claim.", evidence: [], evidence_placeholder: "" }],
  relationships: [{ target_id: "d6f32ea5-9a74-4639-9250-ea13e343f6f7", target_slug: "related", relation: "related" }],
  related_topics: [{ id: "ed555956-4a8a-47e1-a122-cbdf9574a9b3", title: "Related" }]
};

test("publishing pipeline creates every supported versioned artifact with source UUID traceability", () => {
  const bundle = generatePublishingBundle(object);
  assert.deepEqual(Object.keys(bundle), SUPPORTED_OUTPUT_FORMATS);
  for (const [format, artifact] of Object.entries(bundle)) {
    assert.equal(artifact.metadata.artifact, format);
    assert.equal(artifact.metadata.source_object_id, object.id);
    assert.equal(artifact.metadata.source_object_version, object.version);
    assert.deepEqual(artifact.metadata.claim_ids, [object.claims[0].id]);
    assert.equal(artifact.metadata.artifact_version, "1.0.0");
  }
  assert.equal(bundle.ghost_article.post.status, "draft");
});

test("publishing pipeline preserves intentionally empty evidence placeholders", () => {
  const bundle = generatePublishingBundle(object);
  assert.deepEqual(bundle.ghost_article.content.claims[0].evidence, []);
  assert.equal(bundle.ghost_article.content.claims[0].evidence_placeholder, "");
  assert.deepEqual(bundle.json_ld.document.mainEntity[0].evidence, []);
  assert.equal(bundle.podcast_script.segments[2].evidence_placeholder, "");
});

test("validation rejects an object that cannot maintain UUID claim traceability", () => {
  const invalid = structuredClone(object);
  invalid.claims[0].id = "not-a-uuid";
  assert.match(validateKnowledgeObject(invalid).join(" "), /Claim 0 id must be a UUID/);
  assert.throws(() => generatePublishingBundle(invalid), /Invalid Knowledge Object/);
});
