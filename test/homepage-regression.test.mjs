import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const file = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [home, routes, shell, css, homeJs, analytics] = await Promise.all([
  file("ghost-theme/home.hbs"), file("ghost-theme/routes.yaml"), file("ghost-theme/default.hbs"),
  file("ghost-theme/assets/css/sprint17.css"), file("ghost-theme/assets/js/sprint17.js"), file("ghost-theme/assets/js/analytics.js")
]);

test("only the dedicated server-rendered home template owns the root route", () => {
  assert.match(routes, /^routes:\s*\n\s*\/:\s*\n\s*template:\s*home\b/m);
  assert.match(home, /data-bomsociety-home="BOMSOCIETY-HOMEPAGE-V3"/);
  assert.match(shell, /\{\{\{body\}\}\}/);
  assert.match(css, /action-first physician decision interface/);
});

test("the action-first hero has its mission, question, chooser, and no retired passive hero copy", () => {
  for (const phrase of [
    "Make your next Business of Medicine decision clearer.", "SOLVE A DECISION", "What business decision do you need to make?",
    "Compensation", "Employment Contracts", "Artificial Intelligence", "Practice Ownership", "Physician Wealth", "Leadership &amp; Operations",
    "Or describe my situation", "Show my next step", "Solve compensation now", "A compensation number is not a compensation formula."
  ]) assert.match(home, new RegExp(phrase));
  for (const retired of ["THE PHYSICIAN DECISION OPERATING SYSTEM", "One consequential decision.", "Start with your decision", "Respect your time."]) assert.doesNotMatch(home, new RegExp(retired));
});

test("coming-next actions, natural language routing, share, and anonymous event interface are present", () => {
  for (const phrase of ["What would you most want help deciding?", "Submit my question", "DECISION LIBRARY", "Send to a colleague"]) assert.match(home, new RegExp(phrase));
  for (const event of ["homepage_decision_selected", "homepage_situation_submitted", "unmet_decision_requested", "compensation_episode_started", "decision_library_cta_clicked", "colleague_share_started", "colleague_share_completed", "decision_outcome_captured"]) {
    assert.match(homeJs, new RegExp(event)); assert.match(analytics, new RegExp(event));
  }
  assert.match(homeJs, /navigator\.share/);
  assert.match(homeJs, /navigator\.clipboard\.writeText/);
  assert.match(homeJs, /localStorage\.setItem\('bom-compensation-situation'/);
  assert.match(homeJs, /modal\.showModal\(\)/);
});

test("the compensation episode and honest enterprise philosophy remain server-rendered", () => {
  for (const phrase of ["PROBLEM", "CONTEXT", "BIG PICTURE", "INTERACTIVE CALCULATOR", "ACTION PLAN", "KNOW · DO · SHARE", "Physicians remain free", "individual physician data is never sold", "BUSINESS OF MEDICINE INTELLIGENCE", "Explore the Business of Medicine Intelligence platform"]) assert.match(home, new RegExp(phrase));
  assert.match(home, /data-compensation-pathway/);
});
