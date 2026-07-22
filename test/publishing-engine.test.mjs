import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ARTIFACT_TYPES, PUBLISHING_ENGINE_VERSION, generatePublishingArtifacts } from "../lib/publishing-engine.mjs";

const run = promisify(execFile);
const objectPath = new URL("../knowledge/objects/employment-contracts/knowledge-object.json", import.meta.url);
const object = JSON.parse(await readFile(objectPath, "utf8"));

test("publishing engine creates ten deterministic, draft-only artifacts with traceability", () => {
  const first = generatePublishingArtifacts(object, { knowledgeObjects: [object] });
  const second = generatePublishingArtifacts(object, { knowledgeObjects: [object] });
  assert.deepEqual(first, second);
  assert.deepEqual(Object.keys(first), ARTIFACT_TYPES);
  for (const type of ARTIFACT_TYPES) {
    const item = first[type];
    assert.equal(item.artifact_type, type);
    assert.equal(item.artifact_version, PUBLISHING_ENGINE_VERSION);
    assert.equal(item.generated_from.knowledge_object_uuid, object.id);
    assert.deepEqual(item.generated_from.claim_ids, object.claims.map((claim) => claim.id));
    assert.deepEqual(item.generated_from.evidence_placeholders, object.evidence_placeholders);
    assert.deepEqual(item.publication, { mode: "draft", published: false, network_requests: false });
  }
  assert.equal(first["ghost-article"].payload.status, "draft");
  assert.equal(first["ghost-article"].payload.html.includes(object.claims[0].statement), true);
});

test("CLI writes exactly ten JSON draft artifacts for one object and does not publish", async () => {
  const output = await mkdtemp(join(tmpdir(), "bomsociety-publishing-"));
  try {
    const { stdout } = await run(process.execPath, ["automation/generate-publishing-artifacts.mjs", "--input", "knowledge/objects/employment-contracts/knowledge-object.json", "--output", output], { cwd: new URL("..", import.meta.url) });
    assert.match(stdout, /Generated 10 draft artifacts.*No publication occurred/);
    const files = await readdir(join(output, object.slug));
    assert.deepEqual(files.sort(), ARTIFACT_TYPES.map((type) => `${type}.json`).sort());
    for (const file of files) {
      const item = JSON.parse(await readFile(join(output, object.slug, file), "utf8"));
      assert.equal(item.publication.published, false);
    }
  } finally { await rm(output, { recursive: true, force: true }); }
});
