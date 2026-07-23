import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("../ghost-theme/home.hbs", import.meta.url), "utf8");

test("Sprint 16 homepage removes the retired confidence-modal experience", () => {
  for (const retired of ["data-decision-modal", "data-confidence-trigger", "data-preview-modal", "metric-board", "return-loop"]) assert.doesNotMatch(home, new RegExp(retired));
});
