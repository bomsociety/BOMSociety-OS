import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { assertProductionVerification, assessProductionVerification } from "../automation/deploy-ghost-theme.mjs";

const site = "https://www.bomsociety.com/";
const basePage = `<!doctype html><meta name="bomsociety-theme-version" content="1.3.1"><meta name="bomsociety-deployment-marker" content="BOMSOCIETY-BUILD-TEST-17"><main data-bomsociety-home="BOMSOCIETY-DECISION-OS"><aside data-decision-score></aside><aside data-decision-intelligence></aside></main>`;
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
    status: 200, finalUrl: site, themeVersionFound: true,
    deploymentMarkerFound: true, homepageRootFound: true, decisionScoreFound: true,
    decisionIntelligenceFound: true
  });
});

test("missing homepage structure fails while shared metadata remains", () => {
  expectFailure("ROUTE_BYPASSES_UPDATED_TEMPLATE", `<meta name="bomsociety-theme-version" content="1.3.1"><meta name="bomsociety-deployment-marker" content="BOMSOCIETY-BUILD-TEST-17">`);
  expectFailure("HOMEPAGE_STRUCTURE_MISSING", basePage.replace("data-decision-score", "data-removed-score"));
});

test("missing version and deployment metadata fail with specific codes", () => {
  expectFailure("WRONG_THEME_VERSION", basePage.replace('name="bomsociety-theme-version" content="1.3.1"', ""));
  expectFailure("DEPLOYMENT_MARKER_MISSING", basePage.replace('name="bomsociety-deployment-marker" content="BOMSOCIETY-BUILD-TEST-17"', ""));
});

test("volatile hero copy and the removed temporary banner do not affect deployment verification", () => {
  assert.doesNotThrow(() => assertProductionVerification(verify(currentHomepage.replace("Make the next physician decision clearer.", "A new hero headline"))));
  assert.doesNotThrow(() => assertProductionVerification(verify(currentHomepage.replace("BOMSOCIETY BUILD TEST 17", ""))));
});
