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

test("the compensation episode and concise enterprise platform grid remain server-rendered", () => {
  for (const phrase of ["PROBLEM", "CONTEXT", "BIG PICTURE", "INTERACTIVE CALCULATOR", "ACTION PLAN", "KNOW · DO · SHARE", "YOUR BUSINESS OF MEDICINE PROGRESS", "1 of 6 Foundations Completed", "Continue", "BUSINESS OF MEDICINE INTELLIGENCE", "IN DEVELOPMENT", "Explore"]) assert.match(home, new RegExp(phrase));
  for (const removed of ["Every Decision Episode contributes anonymously", "These platforms are currently being built.", "They will never expose individual physicians."]) assert.doesNotMatch(home, new RegExp(removed));
  assert.match(css, /\.os-intelligence-card\{width:100%;min-height:210px/);
  assert.match(home, /data-compensation-pathway/);
});

test("enterprise intelligence architecture declares all domains, buyers, and safeguards", async () => {
  const enterprise = await file("ghost-theme/custom-enterprise.hbs");
  for (const domain of [
    "Compensation Intelligence™", "Contract Intelligence™", "AI Adoption Intelligence™", "Revenue Cycle Intelligence™",
    "Practice Economics Intelligence™", "Practice Ownership Intelligence™", "Leadership &amp; Operations Intelligence™", "Technology Adoption Intelligence™", "Physician Wealth Intelligence™"
  ]) assert.match(enterprise, new RegExp(domain));
  for (const requirement of ["Primary Business of Medicine domain:", "Primary enterprise buyer:", "Primary enterprise deliverable:", "Primary physician value:", "Decision Episodes feeding the platform:", "Minimum aggregation requirements:", "Minimum validation requirements:", "Privacy safeguards:", "Development status:"]) assert.match(enterprise, new RegExp(requirement));
  assert.match(enterprise, /Decision Episode[\s\S]*One Intelligence Platform[\s\S]*Enterprise deliverable/);
  assert.match(enterprise, /No individual physician data sales/);
});
