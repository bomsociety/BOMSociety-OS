import test from "node:test";
import assert from "node:assert/strict";
import { createKnowledgeObject, loadKnowledgeSchemas, validateKnowledgeRecord } from "../src/engine.mjs";
import { importKnowledgeObject } from "../src/importer.mjs";

const timestamp = "2026-07-21T00:00:00Z";
const id = "123e4567-e89b-42d3-a456-426614174000";

test("schema catalog contains every canonical record type", async () => {
  const { catalog, schemas } = await loadKnowledgeSchemas();
  assert.deepEqual(Object.keys(catalog.schemas).sort(), ["claim", "corroboration", "decision", "evidence", "knowledgeObject", "learningPath", "lesson", "relationship", "source"]);
  assert.equal(schemas.size, 10);
});

test("knowledge objects validate and invalid UUIDs are rejected", async () => {
  const record = { ...createKnowledgeObject({ kind: "topic", title: "Validation", slug: "validation", summary: "A reusable test record.", now: timestamp }), id };
  assert.deepEqual(await validateKnowledgeRecord("knowledgeObject", record), []);
  assert.match((await validateKnowledgeRecord("knowledgeObject", { ...record, id: "not-a-uuid" })).join("\n"), /UUID/);
});

test("claims require their review and evidence-quality fields", async () => {
  const claim = { id, knowledgeObjectId: id, statement: "A testable statement.", evidenceLevel: "supported", corroborationScore: 0.8, confidence: 0.9, reviewer: "reviewer", version: 1, createdAt: timestamp, updatedAt: timestamp };
  assert.deepEqual(await validateKnowledgeRecord("claim", claim), []);
  assert.match((await validateKnowledgeRecord("claim", { ...claim, reviewer: "" })).join("\n"), /reviewer/);
});

test("importer creates all channel drafts without publishing", () => {
  const object = { id, kind: "guide", title: "Engine Test", slug: "engine-test", summary: "Reusable import output." };
  const output = importKnowledgeObject(object, { claims: [{ statement: "A reusable claim." }] });
  assert.deepEqual(Object.keys(output).sort(), ["faq", "ghostArticle", "newsletterDraft", "podcastScript", "seoMetadata"]);
  assert.equal(output.ghostArticle.slug, "engine-test");
  assert.match(output.ghostArticle.html, /A reusable claim/);
});

test("every canonical schema validates its required record shape", async () => {
  const common = { id, version: 1, createdAt: timestamp, updatedAt: timestamp };
  const records = {
    decision: { ...common, knowledgeObjectId: id, question: "Question?", outcome: "Outcome.", status: "accepted", claimIds: [] },
    evidence: { ...common, claimId: id, sourceId: id, kind: "study", excerpt: "Evidence.", collectedAt: timestamp },
    source: { ...common, title: "Source", publisher: "Publisher", url: "https://example.org", sourceType: "website" },
    corroboration: { ...common, claimId: id, evidenceIds: [], score: 0, method: "manual-review" },
    learningPath: { ...common, title: "Path", slug: "path", lessonIds: [] },
    lesson: { ...common, learningPathId: id, title: "Lesson", position: 1, knowledgeObjectIds: [] },
    relationship: { ...common, fromId: id, toId: id, relation: "supports" }
  };
  for (const [type, record] of Object.entries(records)) assert.deepEqual(await validateKnowledgeRecord(type, record), [], type);
});
