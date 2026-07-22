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

test("homepage ships one complete physician product module", () => {
  assert.match(home, /BOM SCORE/);
  assert.match(home, /GET PAID MORE/);
  for (const depth of ["Quick Win", "Brief Overview", "Deep Dive"]) assert.match(home, new RegExp(depth));
  assert.doesNotMatch(home, /Decision Brief/);
  for (const step of ["REAL CASE", "KNOWLEDGE CHECK", "NEXT RECOMMENDED MODULE"]) assert.match(home, new RegExp(step));
  assert.match(home, /LIVE PHYSICIAN INTELLIGENCE/);
  for (const product of ["Physician Decision Index™", "Compensation Intelligence™", "AI Adoption Intelligence™"]) assert.match(home, new RegExp(product));
  assert.match(home, /data-intelligence-action/);
});
test("product behavior keeps score and intelligence instrumentation connected", () => {
  assert.match(main, /intelligence_action/); assert.match(main, /data-bom-score/);
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
test("production deployment runs after main changes, validates, verifies, and rolls back automatically", () => {
  assert.match(deploymentWorkflow, /push:\s+branches:\s+- main/);
  assert.match(deploymentWorkflow, /npm test/);
  for (const validation of ["knowledge:validate", "validate:publishing", "validate:decision", "validate:measurement"]) {
    assert.match(deploymentWorkflow, new RegExp(`npm run ${validation}`));
  }
  assert.match(deploymentWorkflow, /npm run theme:zip/);
  assert.match(deploymentWorkflow, /unzip -Z1.*package\.json/);
  assert.match(deploymentWorkflow, /sha256sum/);
  assert.doesNotMatch(deploymentWorkflow, /download-artifact/);
  for (const secret of ["GHOST_ADMIN_URL", "GHOST_ADMIN_KEY", "GHOST_SITE_URL", "GHOST_API_VERSION"]) assert.match(deploymentWorkflow, new RegExp(`secrets\\.${secret}`));
  for (const result of ["BUILD SUCCESS", "UPLOAD SUCCESS", "ACTIVATION SUCCESS", "VERIFICATION SUCCESS", "ROLLBACK SUCCESS"]) {
    assert.match(deploymentWorkflow, new RegExp(result));
  }
  assert.match(deploymentWorkflow, /steps\.activate\.outcome == 'success'/);
  assert.match(deploymentWorkflow, /steps\.previous\.outputs\.theme_name != ''/);
  assert.match(deploymentWorkflow, /steps\.previous\.outputs\.theme_name != steps\.activate\.outputs\.theme_name/);
  assert.match(deploymentWorkflow, /ROLLBACK SKIPPED — previous theme unavailable/);
  assert.match(deploymentWorkflow, /continue-on-error: true/);
  assert.match(deploymentWorkflow, /theme_name="\$\(node automation\/deploy-ghost-theme\.mjs upload/);
  assert.match(deploymentWorkflow, /PREVIOUS THEME CAPTURED/);
  assert.match(deploymentScript, /active-theme/);
  assert.match(deploymentScript, /GHOST_VERIFY_TITLE/);
  assert.match(deploymentScript, /GET PAID MORE/);
  assert.match(deploymentScript, /How intelligence is built/);
});
