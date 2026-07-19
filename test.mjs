import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("brand is BOMSociety", async () => {
  const html = await readFile(new URL("./homepage/index.html", import.meta.url), "utf8");
  assert.match(html, /BOMSociety/);
});
