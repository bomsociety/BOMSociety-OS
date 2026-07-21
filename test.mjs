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
