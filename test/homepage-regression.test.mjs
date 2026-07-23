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
  assert.match(home, /data-bomsociety-home="BOMSOCIETY-HOMEPAGE-V2"/);
  assert.match(shell, /\{\{\{body\}\}\}/);
  assert.match(css, /\.sprint17-home\{/);
});

test("raw homepage HTML contains the physician decision operating system hero and diagnosis", () => {
  for (const phrase of [
    "Respect your time.", "Earn your trust.", "Improve your decisions.",
    "THE PHYSICIAN DECISION OPERATING SYSTEM", "What decision could change your career forever?",
    "Not another course.", "Your operating system for physician career and business decisions.",
    "What decision are you facing today?", "Compensation", "Contract", "Artificial Intelligence",
    "Practice Ownership", "Leadership", "describe my situation", "YOUR NEXT CAREER WIN"
  ]) assert.match(home, new RegExp(phrase));
});

test("the compensation episode, honest breadth, and enterprise philosophy are present without JavaScript", () => {
  for (const phrase of [
    "BIG PICTURE", "BRIEF OVERVIEW", "DEEP DIVE", "INTERACTIVE CALCULATOR", "CHECKLIST",
    "ACTION PLAN", "REFLECTION", "OUTCOME", "SHARE", "Guarantee", "Productivity", "Unseen conditions",
    "Same salary. Different economics.", "Illustrative total", "YOUR CAREER WIN", "Send to colleague",
    "CAREER MOMENTUM", "Recently Updated", "Evidence Reviewed", "Most Shared", "Trending Decision",
    "Physicians remain free forever.", "Enterprise funds the platform.", "not yet commercially available"
  ]) assert.match(home, new RegExp(phrase));
  assert.match(home, /data-compensation-pathway/);
  assert.match(home, /BOMSOCIETY-HOMEPAGE-V2/);
});

test("retired public homepage copy and obsolete client replacement code are removed", () => {
  for (const phrase of retiredHomepageCopy) {
    assert.doesNotMatch(home, new RegExp(phrase, "i"));
    assert.doesNotMatch(legacyJs, new RegExp(phrase, "i"));
  }
  assert.doesNotMatch(legacyJs, /innerHTML=.*(?:homepage|hero|decision)/i);
});
