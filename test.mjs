import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("homepage begins with an evidence-first physician decision path", async () => {
  const home = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  assert.match(home, /Make the business side of medicine easier\./);
  assert.match(home, /Are you getting paid what you’re worth\?/);
  assert.doesNotMatch(home, /TOP <span data-ranking>/);
});

test("Ghost theme is the canonical homepage and uses topic routes", async () => {
  const [routes, home] = await Promise.all([
    readFile(new URL("./ghost-theme/routes.yaml", import.meta.url), "utf8"),
    readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8")
  ]);

  assert.match(routes, /\/: home/);
  assert.match(routes, /tag: \/topic\/\{slug\}\//);
  assert.doesNotMatch(home, /\/tag\//);
});

test("default layout loads the shared analytics implementation", async () => {
  const layout = await readFile(new URL("./ghost-theme/default.hbs", import.meta.url), "utf8");
  assert.match(layout, /js\/analytics\.js/);
});

test("homepage provides the complete compensation learning path and honest enterprise status", async () => {
  const home = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  for (const label of ["BIG PICTURE", "BRIEF OVERVIEW", "DEEP DIVE", "Knowledge check", "Illustrative calculator", "not yet commercially available"]) assert.match(home, new RegExp(label));
  assert.doesNotMatch(home, /BOMGraph/i);
});

test("product interactions retain the shared analytics load order and local pathway behavior", async () => {
  const [home, main, layout, analytics] = await Promise.all([
    readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8"), readFile(new URL("./ghost-theme/assets/js/main.js", import.meta.url), "utf8"), readFile(new URL("./ghost-theme/default.hbs", import.meta.url), "utf8"), readFile(new URL("./ghost-theme/assets/js/analytics.js", import.meta.url), "utf8")
  ]);
  assert.match(home, /data-calc/); assert.match(main, /bom-compensation-progress-v1/); assert.match(main, /data-close-feedback/);
  assert.ok(layout.indexOf('js/analytics.js') < layout.indexOf('js/main.js'));
  assert.match(analytics, /'intelligence_action'/); assert.doesNotMatch(analytics, /\binteraction\b/);
});
