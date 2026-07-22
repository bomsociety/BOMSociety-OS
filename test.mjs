import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("brand is BOMSociety", async () => {
  const html = await readFile(new URL("./homepage/index.html", import.meta.url), "utf8");
  assert.match(html, /BOMSociety/);
});

test("Ghost homepage is decision-led and exposes the six product decisions", async () => {
  const template = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  assert.match(template, /Make better business decisions in medicine\./);
  assert.match(template, /Clear, corroborated guidance for the decisions medical training never taught you to make\./);
  assert.match(template, />Join Free</);
  assert.match(template, />Explore Decisions</);
  [
    "Employment Contracts",
    "RVU Compensation",
    "Private Equity",
    "ASC Ownership",
    "Artificial Intelligence",
    "Physician Wealth"
  ].forEach(decision => assert.match(template, new RegExp(`>${decision}<`)));
  assert.equal((template.match(/data-decision-card/g) || []).length, 6);
});

test("homepage analytics loads before decision interactions", async () => {
  const layout = await readFile(new URL("./ghost-theme/default.hbs", import.meta.url), "utf8");
  const template = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  const script = await readFile(new URL("./ghost-theme/assets/js/main.js", import.meta.url), "utf8");
  assert.ok(layout.indexOf('js/analytics.js') < layout.indexOf('js/main.js'));
  assert.match(template, /hero_cta_selected/);
  assert.match(script, /decision_card_selected/);
  assert.match(script, /decision_finder_used/);
});
