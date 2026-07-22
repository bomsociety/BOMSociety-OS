import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ARTIFACT_TYPES, generatePublishingArtifacts } from "../lib/publishing-engine.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const value = (name) => { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; };
const input = value("--input");
const output = resolve(root, value("--output") ?? "publishing-artifacts");
if (args.includes("--help")) {
  console.log("Usage: node automation/generate-publishing-artifacts.mjs [--input knowledge/objects/<slug>/knowledge-object.json] [--output publishing-artifacts]");
  process.exit(0);
}
const files = input ? [resolve(root, input)] : (await readdir(join(root, "knowledge/objects"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => join(root, "knowledge/objects", entry.name, "knowledge-object.json")).sort();
const objects = await Promise.all(files.map(async (file) => JSON.parse(await readFile(file, "utf8"))));
await rm(output, { recursive: true, force: true });
for (const object of objects) {
  const artifacts = generatePublishingArtifacts(object, { knowledgeObjects: objects });
  const directory = join(output, object.slug);
  await mkdir(directory, { recursive: true });
  for (const type of ARTIFACT_TYPES) await writeFile(join(directory, `${type}.json`), `${JSON.stringify(artifacts[type], null, 2)}\n`);
}
console.log(`Generated ${objects.length * ARTIFACT_TYPES.length} draft artifacts for ${objects.length} canonical Knowledge Object(s) in ${output}. No publication occurred.`);
