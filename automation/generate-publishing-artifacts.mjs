import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generatePublishingBundle } from "../lib/publishing-engine.mjs";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: node automation/generate-publishing-artifacts.mjs <knowledge-object.json> <output.json>");
const object = JSON.parse(await readFile(resolve(input), "utf8"));
const bundle = generatePublishingBundle(object);
await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(resolve(output), `${JSON.stringify(bundle, null, 2)}\n`);
console.log(`Generated ${Object.keys(bundle).length} draft artifacts; nothing was published.`);
