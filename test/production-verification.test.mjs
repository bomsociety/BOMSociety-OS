import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { assertConsistentVariants, assertProductionVerification, assessProductionVerification, canonicalIdentityHash } from "../automation/deploy-ghost-theme.mjs";

const site = "https://www.bomsociety.com/";
const basePage = `<!doctype html><title>BOMSociety | Physician Decision Intelligence</title><link rel="canonical" href="https://www.bomsociety.com/"><meta name="bomsociety-theme-version" content="1.3.2"><meta name="bomsociety-deployment-marker" content="BOMSOCIETY-SPRINT-17B-CANONICAL"><main data-bomsociety-home="BOMSOCIETY-HOMEPAGE-V2" data-compensation-pathway><h1>What decision could change your career forever?</h1><aside data-win-reveal></aside><form data-situation-form></form></main>`;
const [defaultTemplate, homepage] = await Promise.all([
  readFile(new URL("../ghost-theme/default.hbs", import.meta.url), "utf8"),
  readFile(new URL("../ghost-theme/home.hbs", import.meta.url), "utf8")
]);
const currentHomepage = `${defaultTemplate}${homepage}`;
const verify = (html = basePage, options = {}) => assessProductionVerification({ status: 200, finalUrl: site, html, ...options });
const variants = (pages) => pages.map(({ label, html = basePage, options = {} }) => ({ client: { label }, result: verify(html, options) }));

function expectFailure(code, html, options) {
  assert.throws(() => assertProductionVerification(verify(html, options)), new RegExp(`^Error: ${code}$`));
}

test("current homepage passes production verification without the temporary red banner", () => {
  assert.doesNotMatch(currentHomepage, /BOMSOCIETY BUILD TEST 17/);
  const result = verify(currentHomepage);
  assertProductionVerification(result);
  assert.deepEqual(result, {
    status: 200, finalUrl: site, title: "", firstH1: "What decision could change your career forever?",
    contentLength: Buffer.byteLength(currentHomepage), cacheControl: "", vary: "", varyTokens: [], allowedVaryTokens: ["accept-encoding", "cookie"], cacheVarySafe: true, finalHostname: "www.bomsociety.com",
    canonicalUrlFound: true, themeVersionFound: true, deploymentMarkerFound: true,
    homepageRootFound: true, decisionScoreFound: true, decisionIntelligenceFound: true,
    compensationPathwayFound: true, compensationHeroFound: true, retiredHomepageFound: false
  });
});

test("missing homepage structure fails while shared metadata remains", () => {
  expectFailure("ROUTE_BYPASSES_UPDATED_TEMPLATE", `<link rel="canonical" href="https://www.bomsociety.com/"><meta name="bomsociety-theme-version" content="1.3.2"><meta name="bomsociety-deployment-marker" content="BOMSOCIETY-SPRINT-17B-CANONICAL">`);
  expectFailure("HOMEPAGE_STRUCTURE_MISSING", basePage.replace("data-win-reveal", "data-removed-win"));
});

test("missing version and deployment metadata fail with specific codes", () => {
  expectFailure("WRONG_THEME_VERSION", basePage.replace('name="bomsociety-theme-version" content="1.3.2"', ""));
  expectFailure("DEPLOYMENT_MARKER_MISSING", basePage.replace('name="bomsociety-deployment-marker" content="BOMSOCIETY-SPRINT-17B-CANONICAL"', ""));
});

test("volatile hero copy and the removed temporary banner do not affect deployment verification", () => {
  assert.doesNotThrow(() => assertProductionVerification(verify(currentHomepage.replace("Make the next physician decision clearer.", "A new hero headline"))));
  assert.doesNotThrow(() => assertProductionVerification(verify(currentHomepage.replace("BOMSOCIETY BUILD TEST 17", ""))));
});


test("canonical, unusual cache-vary, compensation-hero, and retired-homepage checks fail independently", () => {
  expectFailure("CANONICAL_URL_MISSING", basePage.replace(/<link rel="canonical"[^>]*>/, ""));
  expectFailure("UNSAFE_CACHE_VARY", basePage, { headers: new Headers({ vary: "Cookie, User-Agent" }) });
  expectFailure("HOMEPAGE_STRUCTURE_MISSING", basePage.replace("What decision could change your career forever?", "Different hero"));
  expectFailure("RETIRED_HOMEPAGE_DELIVERED", `${basePage} Explore BOMBriefs`);
});

test("Vary: Cookie, Accept-Encoding passes when every tested variant has the canonical identity", () => {
  const headers = new Headers({ vary: "Cookie, Accept-Encoding" });
  const matrix = variants([
    { label: "No cookies", options: { headers } },
    { label: "Existing cookies", options: { headers } },
    { label: "Chrome desktop", options: { headers } },
    { label: "Safari mobile", options: { headers } },
    { label: "Googlebot", options: { headers } }
  ]);
  const comparison = assertConsistentVariants(matrix);
  assert.equal(comparison.allHashesMatch, true);
  assert.equal(matrix[0].result.cacheVarySafe, true);
  assert.equal(canonicalIdentityHash(matrix[0].result), canonicalIdentityHash(matrix[1].result));
});

test("the Ghost-safe Vary token combinations are accepted", () => {
  for (const vary of ["Accept-Encoding", "Cookie", "Accept-Encoding, Cookie", "Cookie, Accept-Encoding"]) {
    assert.equal(verify(basePage, { headers: new Headers({ vary }) }).cacheVarySafe, true, vary);
  }
});

test("cookie and user-agent identity mismatches have precise failure codes", () => {
  assert.throws(() => assertConsistentVariants(variants([
    { label: "No cookies" },
    { label: "Existing cookies", html: basePage.replace("data-win-reveal", "data-removed-win") },
    { label: "Chrome desktop" },
    { label: "Safari mobile" }
  ])), /^Error: COOKIE_VARIANT_MISMATCH$/);
  assert.throws(() => assertConsistentVariants(variants([
    { label: "No cookies" }, { label: "Existing cookies" },
    { label: "Chrome desktop" },
    { label: "Safari mobile", html: basePage.replace("data-situation-form", "data-removed-diagnosis") }
  ])), /^Error: USER_AGENT_VARIANT_MISMATCH$/);
});

test("retired homepage content fails even when every variant matches", () => {
  expectFailure("RETIRED_HOMEPAGE_DELIVERED", `${basePage} Explore BOMBriefs`);
});
