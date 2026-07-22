import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("brand is BOMSociety", async () => {
  const home = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  assert.match(home, /BOMSociety/);
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

test("homepage provides the Sprint 8 mastery positioning and six decision paths", async () => {
  const home = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  const cards = [...home.matchAll(/data-decision-card/g)];
  assert.match(home, /Level up the business side of medicine\./);
  assert.match(home, /Everything medical training never taught you—made clear, practical, and free\./);
  assert.match(home, />Start Leveling Up</);
  assert.match(home, />Explore For You</);
  assert.equal(cards.length, 6);
  assert.doesNotMatch(home, /BOMGraph/i);
});

test("homepage cards retain topic routes and measurement hooks", async () => {
  const [home, main, layout, analytics] = await Promise.all([
    readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8"),
    readFile(new URL("./ghost-theme/assets/js/main.js", import.meta.url), "utf8"),
    readFile(new URL("./ghost-theme/default.hbs", import.meta.url), "utf8"),
    readFile(new URL("./ghost-theme/assets/js/analytics.js", import.meta.url), "utf8")
  ]);
  ["rvu-compensation", "employment-contracts", "private-equity", "physician-wealth", "artificial-intelligence", "practice-management"].forEach(id => {
    assert.match(home, new RegExp(`data-knowledge-object-id="topic:${id}"`));
    assert.match(home, new RegExp(`/topic/${id}/`));
  });
  assert.match(main, /'decision_started'/);
  assert.match(main, /'topic_preference_selected'/);
  assert.match(main, /'depth_selected'/);
  assert.doesNotMatch(main, /query\s*[:,]/);
  assert.ok(layout.indexOf('js/analytics.js') < layout.indexOf('js/main.js'));
  assert.equal((layout.match(/js\/analytics\.js/g) || []).length, 1);
  assert.match(analytics, /'decision_started'/);
  assert.doesNotMatch(analytics, /\binteraction\b/);
});
