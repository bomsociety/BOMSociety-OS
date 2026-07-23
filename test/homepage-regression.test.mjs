import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("../ghost-theme/home.hbs", import.meta.url), "utf8");
const analytics = await readFile(new URL("../ghost-theme/assets/js/analytics.js", import.meta.url), "utf8");
const main = await readFile(new URL("../ghost-theme/assets/js/main.js", import.meta.url), "utf8");
const layout = await readFile(new URL("../ghost-theme/default.hbs", import.meta.url), "utf8");
const header = await readFile(new URL("../ghost-theme/partials/site-header.hbs", import.meta.url), "utf8");
const depths = await readFile(new URL("../ghost-theme/partials/lesson-depths.hbs", import.meta.url), "utf8");
const post = await readFile(new URL("../ghost-theme/post.hbs", import.meta.url), "utf8");
const zipBuilder = await readFile(new URL("../automation/build-theme-zip.mjs", import.meta.url), "utf8");
const deploymentWorkflow = await readFile(new URL("../.github/workflows/deploy-ghost-theme.yml", import.meta.url), "utf8");
const deploymentScript = await readFile(new URL("../automation/deploy-ghost-theme.mjs", import.meta.url), "utf8");

test("homepage delivers the physician-first hierarchy and depth choices", () => {
  for (const label of ["Level up the business side of medicine.", "Everything medical training never taught you", "FIND MY BIGGEST OPPORTUNITY", "Find My Biggest Opportunity", "TOP <span data-ranking>18</span>%", "Decision Intelligence™", "Physician Decision API™", "BIG PICTURE", "BRIEF OVERVIEW", "DEEP DIVE", "30 sec", "2 min", "5 min"]) assert.match(home, new RegExp(label));
  assert.doesNotMatch(home, /BOMSOCIETY MISSION/);
  assert.match(home, /class="os-hero-grid"/); assert.match(home, /data-opportunity-depth="quick"/);
});
test("CTA integrity includes working routes, depth controls, and safe overlays", () => {
  assert.doesNotMatch(home, /href="#"/); assert.match(home, /data-start-decision/); assert.match(home, /data-enterprise-preview/);
  assert.match(main, /data-opportunity-depth/); assert.match(main, /modal-close/); assert.match(main, /event\.key === 'Escape'|dialog\.close\(\)/);
  assert.match(main, /bom-compensation-path-complete/); assert.match(main, /window\.setTimeout/); assert.match(main, /data-completion-close/);
});
test("header and footer carry the same physician tagline", async () => {
 const footer=await readFile(new URL("../ghost-theme/partials/site-footer.hbs",import.meta.url),"utf8"); const tagline="The free way for physicians to master the business of medicine.";
 assert.match(header,new RegExp(tagline)); assert.match(footer,new RegExp(tagline));
});
test("Decision Intelligence is homepage-only and remains the workspace sidebar", async () => {
 const css=await readFile(new URL("../ghost-theme/assets/css/screen.css",import.meta.url),"utf8"); const postPage=await readFile(new URL("../ghost-theme/post.hbs",import.meta.url),"utf8");
 assert.match(home,/class="os-intelligence" id="live-intelligence"/); assert.doesNotMatch(postPage,/os-intelligence/); assert.match(css,/grid-template-columns:minmax\(230px,\.72fr\) minmax\(420px,1\.52fr\) minmax\(240px,\.78fr\)/);
});
test("product behavior updates the ranking and retains intelligence instrumentation", () => {
  assert.match(main, /intelligence_action/); assert.match(main, /data-ranking/);
  assert.match(main, /compensation_lesson_advanced/); assert.match(main, /compensation_knowledge_check_answered/);
  assert.match(analytics, /intelligence_action/); assert.match(layout, /class="skip-link" href="#main"/);
  assert.match(post, /\{\{> level-up-components\}\}/);
});
test("version is synchronized and the theme ZIP builder packages from the theme root", async () => {
  const root = JSON.parse(await readFile(new URL("../package.json", import.meta.url))); const theme = JSON.parse(await readFile(new URL("../ghost-theme/package.json", import.meta.url)));
  const version = (await readFile(new URL("../VERSION", import.meta.url), "utf8")).trim();
  assert.equal(root.version, "1.3.0"); assert.equal(theme.version, root.version); assert.equal(version, root.version);
  assert.match(zipBuilder, /cwd: theme/); assert.match(zipBuilder, /UPLOAD-TO-GHOST-bomsociety-theme-v/); assert.match(zipBuilder, /rm\(output, \{ force: true \}\)/);
});
test("production deployment preflights, activates the upload response, and verifies both public URLs", () => {
  assert.match(deploymentWorkflow, /push:\s+branches:\s+- main/);
  assert.match(deploymentWorkflow, /npm test/);
  for (const validation of ["knowledge:validate", "validate:publishing", "validate:decision", "validate:measurement"]) {
    assert.match(deploymentWorkflow, new RegExp(`npm run ${validation}`));
  }
  assert.match(deploymentWorkflow, /npm run theme:zip/);
  assert.match(deploymentWorkflow, /deploy-ghost-theme\.mjs inspect/);
  assert.doesNotMatch(deploymentWorkflow, /download-artifact/);
  for (const secret of ["GHOST_ADMIN_URL", "GHOST_ADMIN_KEY", "GHOST_SITE_URL", "GHOST_API_VERSION"]) assert.match(deploymentWorkflow, new RegExp(`secrets\\.${secret}`));
  assert.match(deploymentWorkflow, /workflow_dispatch/);
  assert.match(deploymentWorkflow, /preflight/);
  assert.match(deploymentWorkflow, /verify-admin/);
  assert.match(deploymentWorkflow, /verify-site/);
  assert.doesNotMatch(deploymentWorkflow, /rollback|continue-on-error|Capture currently active theme/i);
  assert.match(deploymentWorkflow, /theme_name="\$\(node automation\/deploy-ghost-theme\.mjs upload/);
  assert.doesNotMatch(deploymentScript, /active-theme|restore/);
  assert.match(deploymentScript, /GET \/site\//);
  assert.match(deploymentScript, /GET PAID MORE/);
  assert.match(deploymentScript, /LIVE INTELLIGENCE/);
});
