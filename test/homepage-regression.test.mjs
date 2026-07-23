import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const file = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [home, header, footer, main, css, routes, methodology] = await Promise.all([
  file("ghost-theme/home.hbs"), file("ghost-theme/partials/site-header.hbs"), file("ghost-theme/partials/site-footer.hbs"), file("ghost-theme/assets/js/main.js"), file("ghost-theme/assets/css/screen.css"), file("ghost-theme/routes.yaml"), file("ghost-theme/custom-methodology.hbs")
]);

test("unsupported placeholder metrics and product claims are absent", () => {
  for (const claim of [/TOP\s*18%/i, /PHYSICIANS ONLINE/i, /21,487/, /READINESS/i, /LIVE INTELLIGENCE/i, /Physician Decision API/i, /highest rated/i]) assert.doesNotMatch(`${home}\n${main}`, claim);
  assert.match(home, /Enterprise data is not yet commercially available\./);
});
test("navigation and visible internal links have destinations", () => {
  assert.doesNotMatch(`${home}\n${header}\n${footer}`, /href="#"/);
  for (const link of ["#start-here", "#questions", "#how-it-works", "/about/", "/privacy/", "/membership/"]) assert.match(header, new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const link of ["/about/", "/privacy/", "/terms/", "/methodology/", "/contact/"]) assert.match(footer, new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(header, /data-portal="signup"/);
});
test("the first decision stream provides all three depths and source metadata", () => {
  for (const label of ["BIG PICTURE · 30 SECONDS", "BRIEF OVERVIEW · 2 MINUTES", "DEEP DIVE · 5 MINUTES", "Illustrative calculator", "Editable action checklist", "Knowledge check", "Educational information only"]) assert.match(home, new RegExp(label));
  assert.match(home, /Centers for Medicare &amp; Medicaid Services · Date not listed · Last reviewed:/);
  assert.match(home, /American Medical Association · 2023 · Last reviewed:/);
});
test("progress is local and can be awarded once, feedback closes", () => {
  assert.match(main, /const mark=name=>\{const state=read\(\); if\(state\[name\]\)return false/);
  assert.match(main, /localStorage\.setItem\(key/);
  assert.match(main, /data-close-feedback/);
  assert.match(main, /panel\.hidden=true/);
});
test("methodology page and responsive one-column layout exist", () => {
  assert.match(routes, /\/methodology\/: custom-methodology/);
  for (const label of ["Information collected", "Information not collected", "Anonymity and aggregation", "Minimum sample thresholds", "will not sell personally identifiable information", "not yet commercially available"]) assert.match(methodology, new RegExp(label));
  assert.match(css, /body\{overflow-x:hidden\}/);
  assert.match(css, /@media\(max-width:800px\).*grid-template-columns:1fr/s);
});
