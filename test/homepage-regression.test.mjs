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

test("homepage has the Sprint 9 decision-first hero and user-centered navigation", () => {
  const hero = home.slice(0, home.indexOf('<section class="section for-you-section"'));
  assert.match(hero, /What decision needs your attention\?/);
  assert.equal((hero.match(/data-hero-decision=/g) ?? []).length, 6);
  assert.match(hero, /data-hero-decision-result/);
  assert.doesNotMatch(hero, /<p/);
  for (const label of ["For You", "Level Up", "Decisions", "Topics", "Briefs", "About"]) assert.match(header, new RegExp(`>${label}<`));
  assert.match(header, />Start</); assert.doesNotMatch(header, /BOMGraph/i);
});
test("homepage has all three depths, explicit membership value, and value before membership", () => {
  for (const depth of ["30 SECONDS", "2 MINUTES", "5 MINUTES"]) assert.match(depths, new RegExp(depth));
  assert.match(home, /Save your progress, personalize your learning path, and receive only the decisions and updates that matter to you\./);
  assert.ok(home.indexOf('id="for-you"') < home.indexOf('id="join"'));
});
test("homepage has exactly six primary decision paths and no public BOMGraph", () => {
  assert.equal((home.match(/data-decision-card/g) ?? []).length, 6);
  assert.doesNotMatch(home, /BOMGraph/i);
  assert.match(home, /\{\{#get "posts" limit="6" include="tags,authors"\}\}/);
});
test("analytics and accessibility hooks remain connected", () => {
  assert.match(home, /data-track-section="hero"/); assert.match(home, /data-for-you-topic/);
  assert.match(main, /topic_preference_selected/); assert.match(main, /depth_selected/); assert.match(home, /membership_cta_selected/);
  assert.match(analytics, /data-track-section/); assert.match(layout, /class="skip-link" href="#main"/);
  assert.match(post, /\{\{> level-up-components\}\}/);
});
test("version is synchronized and the theme ZIP builder packages from the theme root", async () => {
  const root = JSON.parse(await readFile(new URL("../package.json", import.meta.url))); const theme = JSON.parse(await readFile(new URL("../ghost-theme/package.json", import.meta.url)));
  const version = (await readFile(new URL("../VERSION", import.meta.url), "utf8")).trim();
  assert.equal(root.version, "1.3.0"); assert.equal(theme.version, root.version); assert.equal(version, root.version);
  assert.match(zipBuilder, /cwd: theme/); assert.match(zipBuilder, /UPLOAD-TO-GHOST-bomsociety-theme-v/); assert.match(zipBuilder, /rm\(output, \{ force: true \}\)/);
});
test("production deployment builds main in-run, protects secrets, and verifies the live homepage", () => {
  assert.match(deploymentWorkflow, /workflow_dispatch:/);
  assert.match(deploymentWorkflow, /ref: main/);
  assert.match(deploymentWorkflow, /npm test/);
  assert.match(deploymentWorkflow, /npm run theme:zip/);
  assert.match(deploymentWorkflow, /unzip -Z1.*package\.json/);
  assert.match(deploymentWorkflow, /sha256sum/);
  assert.doesNotMatch(deploymentWorkflow, /download-artifact/);
  for (const secret of ["GHOST_ADMIN_URL", "GHOST_ADMIN_KEY", "GHOST_SITE_URL"]) assert.match(deploymentWorkflow, new RegExp(`secrets\\.${secret}`));
  assert.match(deploymentScript, /verify/i);
});
