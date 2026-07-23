import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const file = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [home, routes, shell, css] = await Promise.all([
  file("ghost-theme/home.hbs"),
  file("ghost-theme/routes.yaml"),
  file("ghost-theme/default.hbs"),
  file("ghost-theme/assets/css/screen.css")
]);

test("the root route renders the dedicated homepage template", () => {
  assert.match(routes, /routes:\s*\n\s*\/:\s*\n\s*template:\s*home\b/);
  assert.match(home, /class="sprint16-home"/);
  assert.match(shell, /\{\{\{body\}\}\}/);
});

test("the Sprint 16 hero has its left, center, and right composition", () => {
  for (const phrase of [
    "Respect your time.", "Earn your trust.", "Improve your decisions.",
    "Start with today’s decision", "YOUR PROGRESS", "Your decision score",
    "PHYSICIAN DECISION INTELLIGENCE™"
  ]) assert.match(home, new RegExp(phrase));
  assert.match(css, /\.s16-hero-grid\{display:grid;grid-template-columns:/);
});

test("the homepage contains the Sprint 17A decision modules", () => {
  for (const phrase of [
    "FEATURED DECISION", "Are you getting paid what you’re worth?",
    "BIG PICTURE", "30 sec", "BRIEF OVERVIEW", "2 min", "DEEP DIVE", "5 min",
    "WHAT PHYSICIANS ARE DECIDING NEXT", "s17-carousel"
  ]) assert.match(home, new RegExp(phrase));
  for (const retired of ["BOMSOCIETY BUILD TEST", "formula-poster", "metric-board", "compensation-stream", "BOMBriefs", "enterprise-block"]) {
    assert.doesNotMatch(home, new RegExp(retired));
  }
});
