import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const file = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage presents the physician decision operating system without unsupported public metrics", async () => {
  const home = await file("./ghost-theme/home.hbs");
  for (const phrase of ["What decision could change your career forever?", "Earn your trust.", "BIG PICTURE", "BRIEF OVERVIEW", "DEEP DIVE", "DECISION LIBRARY", "CAREER MOMENTUM", "What decision are you facing today?"]) assert.match(home, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(home, /TOP\s*\d+%|PHYSICIANS ONLINE|Readiness\s*42%/i);
});
test("Ghost theme routes the root to the dedicated home template", async () => { const routes = await file("./ghost-theme/routes.yaml"); assert.match(routes, /\/:\s*\n\s*template: home/); assert.match(routes, /\/methodology\/: custom-methodology/); assert.match(routes, /tag: \/topic\/\{slug\}\//); });
test("default layout loads analytics before interactions", async () => { const layout = await file("./ghost-theme/default.hbs"); assert.ok(layout.indexOf("js/analytics.js") < layout.indexOf("js/main.js")); });
test("homepage interactions retain browser-only decision progress and direct sharing", async () => { const js = await file("./ghost-theme/assets/js/sprint17.js"); for (const phrase of ["bom-decision-os-v2", "localStorage", "data-situation-form", "data-confidence-options", "navigator.share", "data-calculator-result"]) assert.match(js, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))); });
