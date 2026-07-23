import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const file = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage presents the compensation decision path without unsupported public metrics", async () => {
  const home = await file("./ghost-theme/home.hbs");
  for (const phrase of ["Are you getting paid what you’re worth?", "Earn your trust.", "BIG PICTURE", "BRIEF OVERVIEW", "DEEP DIVE", "YOUR PROGRESS", "FEATURED DECISION", "What physicians are deciding next"]) assert.match(home, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(home, /TOP\s*\d+%|PHYSICIANS ONLINE/i);
});
test("Ghost theme routes homepage and methodology", async () => { const routes = await file("./ghost-theme/routes.yaml"); assert.match(routes, /\/:\s*\n\s*template: home/); assert.match(routes, /\/methodology\/: custom-methodology/); assert.match(routes, /tag: \/topic\/\{slug\}\//); });
test("default layout loads analytics before interactions", async () => { const layout = await file("./ghost-theme/default.hbs"); assert.ok(layout.indexOf("js/analytics.js") < layout.indexOf("js/main.js")); });
test("interaction implementation saves browser-only metrics and feedback", async () => { const main = await file("./ghost-theme/assets/js/main.js"); for (const phrase of ["bom-compensation-progress-v2", "localStorage.setItem", "data-close-feedback", "data-decision-modal", "Escape", "setTimeout(close,5000)"]) assert.match(main, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))); });
