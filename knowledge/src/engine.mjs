import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateJsonSchema } from "./json-schema-validator.mjs";

const schemaDirectory = new URL("../schemas/", import.meta.url);

/** Creates an empty, versioned knowledge object with a stable UUID for persistence. */
export function createKnowledgeObject({ kind, title, slug, summary, now = new Date().toISOString() }) {
  return {
    id: randomUUID(), kind, title, slug, summary, status: "draft",
    claimIds: [], decisionIds: [], evidenceIds: [], sourceIds: [], relationshipIds: [],
    version: 1, createdAt: now, updatedAt: now
  };
}

export async function loadKnowledgeSchemas() {
  const catalog = JSON.parse(await readFile(new URL("index.json", schemaDirectory), "utf8"));
  const schemas = new Map();
  const common = JSON.parse(await readFile(new URL("common.schema.json", schemaDirectory), "utf8"));
  schemas.set("common.schema.json", common);
  await Promise.all(Object.entries(catalog.schemas).map(async ([name, file]) => {
    schemas.set(file, JSON.parse(await readFile(new URL(file, schemaDirectory), "utf8")));
  }));
  return { catalog, schemas };
}

export async function validateKnowledgeRecord(type, record) {
  const { catalog, schemas } = await loadKnowledgeSchemas();
  const filename = catalog.schemas[type];
  if (!filename) throw new Error(`Unknown knowledge schema type: ${type}`);
  return validateJsonSchema(record, schemas.get(filename), schemas);
}

export function assertValidKnowledgeRecord(type, record, schemas) {
  const errors = validateJsonSchema(record, schemas.get(type), schemas);
  if (errors.length) throw new Error(`Invalid knowledge record:\n${errors.join("\n")}`);
}

export { fileURLToPath };
