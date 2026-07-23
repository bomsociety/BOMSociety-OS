import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { assertProductionVerification, assessProductionVerification } from "../automation/deploy-ghost-theme.mjs";

const site = "https://www.bomsociety.com/";
const basePage = `<!doctype html><title>BOMSociety | Physician Decision Intelligence</title><link rel="canonical" href="https://www.bomsociety.com/"><meta name="bomsociety-theme-version" content="1.3.2"><meta name="bomsociety-deployment-marker" content="BOMSOCIETY-SPRINT-17B-CANONICAL"><main data-bomsociety-home="BOMSOCIETY-DECISION-OS" data-compensation-pathway><h1>Are you getting paid what you’re worth?</h1><aside data-decision-score></aside><aside data-decision-intelligence></aside></main>`;
const [defaultTemplate, homepage] = await Promise.all([
  readFile(new URL("../ghost-theme/default.hbs", import.meta.url), "utf8"),
  readFile(new URL("../ghost-theme/home.hbs", import.meta.url), "utf8")
]);
const currentHomepage = `${defaultTemplate}${homepage}`;
const verify = (html = basePage, options = {}) => assessProductionVerification({ status: 200, finalUrl: site, html, ...options });

function expectFailure(code, html, options) {
  assert.throws(() => assertProductionVerification(verify(html, options)), new RegExp(`^Error: ${code}$`));
}

test("current homepage passes production verification without the temporary red banner", () => {
  assert.doesNotMatch(currentHomepage, /BOMSOCIETY BUILD TEST 17/);
  const result = verify(currentHomepage);
  assertProductionVerification(result);
  assert.deepEqual(result, {
    status: 200, finalUrl: site, title: "", firstH1: "Are you getting paid what you’re worth?",
    contentLength: Buffer.byteLength(currentHomepage), cacheControl: "", vary: "", cacheVarySafe: true,
    canonicalUrlFound: true, themeVersionFound: true, deploymentMarkerFound: true,
    homepageRootFound: true, decisionScoreFound: true, decisionIntelligenceFound: true,
    compensationPathwayFound: true, compensationHeroFound: true, retiredHomepageFound: false
  });
});

test("missing homepage structure fails while shared metadata remains", () => {
  expectFailure("ROUTE_BYPASSES_UPDATED_TEMPLATE", `<link rel="canonical" href="https://www.bomsociety.com/"><meta name="bomsociety-theme-version" content="1.3.2"><meta name="bomsociety-deployment-marker" content="BOMSOCIETY-SPRINT-17B-CANONICAL">`);
  expectFailure("HOMEPAGE_STRUCTURE_MISSING", basePage.replace("data-decision-score", "data-removed-score"));
});

test("missing version and deployment metadata fail with specific codes", () => {
  expectFailure("WRONG_THEME_VERSION", basePage.replace('name="bomsociety-theme-version" content="1.3.2"', ""));
  expectFailure("DEPLOYMENT_MARKER_MISSING", basePage.replace('name="bomsociety-deployment-marker" content="BOMSOCIETY-SPRINT-17B-CANONICAL"', ""));
});

test("volatile hero copy and the removed temporary banner do not affect deployment verification", () => {
  assert.doesNotThrow(() => assertProductionVerification(verify(currentHomepage.replace("Make the next physician decision clearer.", "A new hero headline"))));
  assert.doesNotThrow(() => assertProductionVerification(verify(currentHomepage.replace("BOMSOCIETY BUILD TEST 17", ""))));
});


test("canonical, cache-vary, compensation-hero, and retired-homepage checks fail independently", () => {
  expectFailure("CANONICAL_URL_MISSING", basePage.replace(/<link rel="canonical"[^>]*>/, ""));
  expectFailure("UNSAFE_CACHE_VARY", basePage, { headers: new Headers({ vary: "Cookie, User-Agent" }) });
  expectFailure("HOMEPAGE_STRUCTURE_MISSING", basePage.replace("Are you getting paid what you’re worth?", "Different hero"));
  expectFailure("RETIRED_HOMEPAGE_DELIVERED", `${basePage} Explore BOMBriefs`);
});
