import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [themePackage, home, index, footer, deploy, workflow, build] = await Promise.all([read("ghost-theme/package.json"), read("ghost-theme/home.hbs"), read("ghost-theme/index.hbs"), read("ghost-theme/partials/site-footer.hbs"), read("automation/deploy-ghost-theme.mjs"), read(".github/workflows/deploy-ghost-theme.yml"), read("automation/build-theme-zip.mjs")]);
const deploymentMarker = "BOMSOCIETY-SPRINT-17B-CANONICAL";
const zipName = "UPLOAD-TO-GHOST-bomsociety-theme-v2.0.0.zip";

async function createInspectableTheme({ homeMarker = true } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "ghost-marker-"));
  const theme = join(dir, "theme"); const zip = join(dir, zipName);
  execFileSync("mkdir", ["-p", join(theme, "assets/css"), join(theme, "assets/js")]);
  await writeFile(join(theme, "package.json"), '{"version":"2.0.0"}');
  await writeFile(join(theme, "routes.yaml"), "routes:\n  /:\n    template: home\n");
  await writeFile(join(theme, "index.hbs"), "index");
  await writeFile(join(theme, "home.hbs"), homeMarker ? `<!-- ${deploymentMarker} -->` : "homepage");
  await writeFile(join(theme, "default.hbs"), "bomsociety-theme-version bomsociety-commit BOMSOCIETY-SPRINT-17B-CANONICAL");
  await writeFile(join(theme, "assets/css/a.css"), ""); await writeFile(join(theme, "assets/js/a.js"), "");
  execFileSync("zip", ["-qr", zip, "."], { cwd: theme });
  return { dir, zip };
}

test("version 2.0.0 controls the exact upload ZIP filename", () => {
  assert.equal(JSON.parse(themePackage).version, "2.0.0");
  assert.match(build, /UPLOAD-TO-GHOST-bomsociety-theme-v\$\{themePackage\.version\}\.zip/);
  assert.match(workflow, /UPLOAD-TO-GHOST-bomsociety-theme-v2\.0\.0\.zip/);
});
test("existing homepage-capable templates contain the stable nonvisual marker", () => {
  assert.match(footer, /Theme 2\.0\.0 · Commit/);
  assert.doesNotMatch(footer, /Build Test 17/);
  assert.match(home, new RegExp(deploymentMarker));
  assert.doesNotMatch(index, new RegExp(deploymentMarker));
});
test("ZIP inspection passes when every existing homepage template has the marker", async () => {
  const { dir, zip } = await createInspectableTheme();
  try {
    const output = execFileSync(process.execPath, ["automation/deploy-ghost-theme.mjs", "inspect", zip], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    assert.equal(output, "");
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test("ZIP inspection reports home.hbs when its marker is missing", async () => {
  const { dir, zip } = await createInspectableTheme({ homeMarker: false });
  try {
    assert.throws(() => execFileSync(process.execPath, ["automation/deploy-ghost-theme.mjs", "inspect", zip], { encoding: "utf8", stdio: "pipe" }), /WRONG_ZIP_DEPLOYED: home\.hbs lacks build marker/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test("nonexistent optional homepage templates do not fail ZIP inspection", async () => {
  const { dir, zip } = await createInspectableTheme();
  try {
    assert.doesNotThrow(() => execFileSync(process.execPath, ["automation/deploy-ghost-theme.mjs", "inspect", zip], { stdio: "pipe" }));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test("the built ZIP contains markers in every required homepage template", () => {
  execFileSync(process.execPath, ["automation/build-theme-zip.mjs"], { stdio: "pipe" });
  const zip = "releases/UPLOAD-TO-GHOST-bomsociety-theme-v2.0.0.zip";
  const inspection = execFileSync(process.execPath, ["automation/deploy-ghost-theme.mjs", "inspect", zip], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(inspection, "");
  assert.ok(execFileSync("unzip", ["-p", zip, "home.hbs"], { encoding: "utf8" }).includes(deploymentMarker));
  assert.ok(!execFileSync("unzip", ["-p", zip, "index.hbs"], { encoding: "utf8" }).includes(deploymentMarker));
});
test("upload and activation use the inspected v2.0.0 ZIP and returned Ghost name", () => {
  assert.match(workflow, /upload '\$\{\{ steps\.build\.outputs\.zip_path \}\}'/);
  assert.match(deploy, /response\.themes\?\.\[0\]\?\.name/);
  assert.match(deploy, /themes\/\$\{encodeURIComponent\(name\)\}\/activate/);
});
test("both public URLs are cache-busted and reject an absent marker", () => {
  for (const url of ["https://bomsociety.ghost.io/", "https://www.bomsociety.com/"]) assert.ok(deploy.includes(url));
  for (const value of ["cache_test", "build_test", "Cache-Control", "Pragma", "CLIENT_MATRIX", "verifyMatrix", "RETIRED_HOMEPAGE_DELIVERED"]) assert.ok(deploy.includes(value));
});
