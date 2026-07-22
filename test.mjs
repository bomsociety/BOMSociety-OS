import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("homepage begins with a physician product instead of brand positioning", async () => {
  const home = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  assert.match(home, /BOM SCORE/);
  assert.match(home, /GET PAID MORE/);
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

test("homepage provides the Sprint 9 first product and enterprise previews", async () => {
  const home = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  for (const label of ["Quick Win", "Brief Overview", "Deep Dive", "Physician Decision Index™", "Compensation Intelligence™", "AI Adoption Intelligence™"]) assert.match(home, new RegExp(label));
  assert.doesNotMatch(home, /BOMGraph/i);
});

test("product interactions retain documented measurement hooks", async () => {
  const [home, main, layout, analytics] = await Promise.all([
    readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8"), readFile(new URL("./ghost-theme/assets/js/main.js", import.meta.url), "utf8"), readFile(new URL("./ghost-theme/default.hbs", import.meta.url), "utf8"), readFile(new URL("./ghost-theme/assets/js/analytics.js", import.meta.url), "utf8")
  ]);
  assert.match(home, /data-intelligence-action/); assert.match(main, /intelligence_action/); assert.match(main, /compensation_lesson_advanced/);
  assert.ok(layout.indexOf('js/analytics.js') < layout.indexOf('js/main.js'));
  assert.match(analytics, /'intelligence_action'/); assert.doesNotMatch(analytics, /\binteraction\b/);
});
