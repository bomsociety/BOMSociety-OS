import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { DEFAULT_ADMIN_API_VERSION, adminApiUrl, createAdminToken } from "../automation/ghost-admin-api.mjs";

const deployment = await readFile(new URL("../automation/deploy-ghost-theme.mjs", import.meta.url), "utf8");
const workflow = await readFile(new URL("../.github/workflows/deploy-ghost-theme.yml", import.meta.url), "utf8");

test("admin API keeps the documented Ghost endpoint shape", () => {
  assert.equal(adminApiUrl("https://example.com/ghost/", "/site/"), "https://example.com/ghost/api/admin/site/");
  assert.match(createAdminToken("0123456789abcdef:0123456789abcdef", 100), /^[^.]+\.[^.]+\.[^.]+$/);
  assert.equal(DEFAULT_ADMIN_API_VERSION, "v6.54");
});
test("deployment never browses themes and preflights through site", () => {
  assert.doesNotMatch(deployment, /\/themes\/", \{ method: "GET"/);
  assert.match(deployment, /ghostRequest\(env\.adminUrl, env\.adminKey, "\/site\/", \{ method: "GET" \}\)/);
  assert.doesNotMatch(deployment, /active-theme|restore|rollback/i);
});
test("preflight validates identity and reports a clear inaccessible-site failure", () => {
  for (const fragment of ["exactly one colon", "hexadecimal strings", "must use HTTPS", "PREFLIGHT_SITE_REQUEST_FAILED", "PREFLIGHT_PUBLICATION_IDENTITY_MISMATCH", "custom domain/publication association"]) assert.match(deployment, new RegExp(fragment));
});
test("ZIP inspection rejects a filename/package version mismatch before upload", async () => {
  const directory = await mkdtemp(join(tmpdir(), "zip-inspection-")); const theme = join(directory, "theme"); const zip = join(directory, "UPLOAD-TO-GHOST-bomsociety-theme-v1.3.0.zip");
  await writeFile(join(directory, ".placeholder"), "");
  execFileSync("mkdir", ["-p", join(theme, "assets/css"), join(theme, "assets/js")]);
  await writeFile(join(theme, "package.json"), '{"version":"9.9.9"}'); await writeFile(join(theme, "index.hbs"), "x"); await writeFile(join(theme, "home.hbs"), "GET PAID MORE"); await writeFile(join(theme, "assets/css/s.css"), ""); await writeFile(join(theme, "assets/js/s.js"), "");
  execFileSync("zip", ["-qr", zip, "."], { cwd: theme });
  assert.throws(() => execFileSync(process.execPath, ["automation/deploy-ghost-theme.mjs", "inspect", zip], { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" }), /ZIP_INSPECTION_FAILED/);
  await rm(directory, { recursive: true, force: true });
});
test("upload response controls activation and diagnostics cover both public URLs", () => {
  assert.match(deployment, /response\.themes\?\.\[0\]\?\.name/);
  assert.match(deployment, /`\/themes\/\$\{encodeURIComponent\(name\)\}\/activate\/`/);
  assert.doesNotMatch(deployment, /basename\(path\).*activate/);
  assert.match(deployment, /verify-admin/); assert.match(deployment, /verify-site/);
  assert.match(deployment, /bom_deploy/); assert.match(deployment, /Cache-Control/);
  for (const code of ["ADMIN_PUBLIC_SITE_UPDATED_BUT_CUSTOM_DOMAIN_NOT_UPDATED", "CUSTOM_DOMAIN_POINTS_TO_DIFFERENT_PUBLICATION", "THEME_ACTIVATED_BUT_ROUTE_BYPASSES_THEME_MARKER", "UPLOAD_FAILED", "ACTIVATION_FAILED"]) assert.match(deployment, new RegExp(code));
});
test("workflow has manual dispatch and the required non-rollback order", () => {
  assert.match(workflow, /workflow_dispatch/); assert.doesNotMatch(workflow, /continue-on-error|rollback|Capture currently active theme/i);
  const names = ["checkout", "setup Node", "validate secrets", "preflight publication identity", "run tests", "build ZIP", "inspect ZIP", "upload", "activate", "verify Ghost publication URL", "verify custom production URL", "report complete diagnostics"];
  let previous = -1; for (const name of names) { const position = workflow.indexOf(`name: ${name}`); assert.ok(position > previous, `${name} is out of order`); previous = position; }
});
