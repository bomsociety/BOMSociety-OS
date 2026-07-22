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

test("homepage provides the Sprint 7 decision-led hero and six canonical decision cards", async () => {
  const home = await readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8");
  const cards = [...home.matchAll(/data-decision-card/g)];
  const requiredTitles = [
    "Employment Contracts", "RVU Compensation", "Private Equity", "ASC Ownership",
    "Artificial Intelligence", "Physician Wealth"
  ];

  assert.match(home, /Make better business decisions in medicine\./);
  assert.match(home, /Clear, corroborated guidance for the decisions medical training never taught you to make\./);
  assert.match(home, />Join Free</);
  assert.match(home, />Explore Decisions</);
  assert.equal(cards.length, 6);
  requiredTitles.forEach(title => assert.match(home, new RegExp(`<h3>${title}</h3>`)));
  assert.doesNotMatch(home, /data-bomgraph/);
  assert.doesNotMatch(home, /BOMGraph preview/);
});

test("homepage cards reference canonical Knowledge Objects and canonical measurement events", async () => {
  const [home, main, layout, analytics] = await Promise.all([
    readFile(new URL("./ghost-theme/home.hbs", import.meta.url), "utf8"),
    readFile(new URL("./ghost-theme/assets/js/main.js", import.meta.url), "utf8"),
    readFile(new URL("./ghost-theme/default.hbs", import.meta.url), "utf8"),
    readFile(new URL("./ghost-theme/assets/js/analytics.js", import.meta.url), "utf8")
  ]);

  ["employment-contracts", "rvu-compensation", "private-equity", "asc-ownership", "artificial-intelligence", "physician-wealth"].forEach(id => {
    assert.match(home, new RegExp(`data-knowledge-object-id="topic:${id}"`));
    assert.match(home, new RegExp(`/topic/${id}/`));
  });
  assert.match(main, /'decision_path_started'/);
  assert.match(main, /'search_submitted'/);
  assert.match(main, /'search_no_results'/);
  assert.doesNotMatch(main, /decision_finder_used/);
  assert.doesNotMatch(main, /query\s*[:,]/);
  assert.ok(layout.indexOf('js/analytics.js') < layout.indexOf('js/main.js'));
  assert.equal((layout.match(/js\/analytics\.js/g) || []).length, 1);
  assert.match(analytics, /'decision_path_started'/);
  assert.doesNotMatch(analytics, /\binteraction\b/);
});
