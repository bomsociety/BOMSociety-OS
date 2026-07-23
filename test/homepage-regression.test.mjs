import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const file = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [home, routes, shell, css, legacyJs] = await Promise.all([
  file("ghost-theme/home.hbs"), file("ghost-theme/routes.yaml"), file("ghost-theme/default.hbs"),
  file("ghost-theme/assets/css/screen.css"), file("ghost-theme/assets/js/main.js")
]);

const retiredHomepageCopy = [
  "Better decisions in the business of medicine.", "Explore BOMBriefs", "What is a BOMBrief?",
  "Top 18%", "Readiness 42%", "fake online", "community counts"
];

test("only the dedicated server-rendered home template owns the root route", () => {
  assert.match(routes, /^routes:\s*\n\s*\/:\s*\n\s*template:\s*home\b/m);
  assert.doesNotMatch(routes.split("collections:")[0], /template:\s*(?:index|custom-home|page-home)\b/);
  assert.match(home, /data-bomsociety-home="BOMSOCIETY-SPRINT-17B-CANONICAL"/);
  assert.match(shell, /\{\{\{body\}\}\}/);
  assert.match(css, /\.sprint17-home\{/);
});

test("raw homepage HTML contains the full final MVP hero and entry cards", () => {
  for (const phrase of [
    "Respect your time.", "Earn your trust.", "Improve your decisions.",
    "Are you getting paid what you’re worth?", "Show me the 30-second answer",
    "Private Decision Score.", "0<span> / 100</span>", "No public peer percentile",
    "Physician Decision Intelligence™", "Building anonymous, aggregate insight",
    "BIG PICTURE", "30 seconds", "See what matters", "BRIEF OVERVIEW", "2 minutes",
    "Understand the formula", "DEEP DIVE", "5 minutes", "Apply it to your situation"
  ]) assert.match(home, new RegExp(phrase));
});

test("the compensation stream, honest breadth, and marker are present without JavaScript", () => {
  for (const phrase of [
    "COMPENSATION =", "GUARANTEE", "PRODUCTIVITY", "QUALITY", "CALL / LEADERSHIP", "UNSEEN CONDITIONS",
    "What threshold must you clear?", "What is the conversion factor?", "What work is attributed to you?",
    "complete written compensation formula", "Same salary can mean very different economics.",
    "Illustrative calculator", "Educational sample contract language", "Download checklist", "References:",
    "WHAT PHYSICIANS ARE DECIDING NEXT", "Would you sign your contract again today?",
    "Could AI give you one clinic back every week?", "Should you own your practice—or stay employed?",
    "Are you building wealth—or only earning income?", "Is private equity improving physician careers?",
    "In development", "Coming next", "data-carousel-position"
  ]) assert.match(home, new RegExp(phrase));
  assert.match(home, /data-compensation-pathway/);
  assert.match(home, /BOMSOCIETY-SPRINT-17B-CANONICAL/);
});

test("retired public homepage copy and obsolete client replacement code are removed", () => {
  for (const phrase of retiredHomepageCopy) {
    assert.doesNotMatch(home, new RegExp(phrase, "i"));
    assert.doesNotMatch(legacyJs, new RegExp(phrase, "i"));
  }
  assert.doesNotMatch(legacyJs, /innerHTML=.*(?:homepage|hero|decision)/i);
});
