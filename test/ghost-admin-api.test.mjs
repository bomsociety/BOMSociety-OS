import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [themePackage, home, index, deploy, workflow, build] = await Promise.all([read("ghost-theme/package.json"), read("ghost-theme/home.hbs"), read("ghost-theme/index.hbs"), read("automation/deploy-ghost-theme.mjs"), read(".github/workflows/deploy-ghost-theme.yml"), read("automation/build-theme-zip.mjs")]);
const marker = "BOMSOCIETY BUILD TEST 17 — VERSION 1.3.1";

test("version 1.3.1 controls the exact upload ZIP filename", () => {
  assert.equal(JSON.parse(themePackage).version, "1.3.1");
  assert.match(build, /UPLOAD-TO-GHOST-bomsociety-theme-v\$\{themePackage\.version\}\.zip/);
  assert.match(workflow, /UPLOAD-TO-GHOST-bomsociety-theme-v1\.3\.1\.zip/);
});
test("every homepage-capable template contains the unmissable marker", () => {
  for (const template of [home, index]) assert.ok(template.includes(marker));
});
test("ZIP inspection fails without the marker", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ghost-marker-"));
  try {
    const theme = join(dir, "theme"); const zip = join(dir, "UPLOAD-TO-GHOST-bomsociety-theme-v1.3.1.zip");
    execFileSync("mkdir", ["-p", join(theme, "assets/css"), join(theme, "assets/js")]);
    await writeFile(join(theme, "package.json"), '{"version":"1.3.1"}'); await writeFile(join(theme, "index.hbs"), "x"); await writeFile(join(theme, "home.hbs"), "x"); await writeFile(join(theme, "default.hbs"), 'bomsociety-theme-version BOMSOCIETY-BUILD-TEST-17'); await writeFile(join(theme, "assets/css/a.css"), ""); await writeFile(join(theme, "assets/js/a.js"), "");
    execFileSync("zip", ["-qr", zip, "."], { cwd: theme });
    assert.throws(() => execFileSync(process.execPath, ["automation/deploy-ghost-theme.mjs", "inspect", zip], { stdio: "pipe" }), /WRONG_ZIP_DEPLOYED/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test("upload and activation use the inspected v1.3.1 ZIP and returned Ghost name", () => {
  assert.match(workflow, /upload '\$\{\{ steps\.build\.outputs\.zip_path \}\}'/);
  assert.match(deploy, /response\.themes\?\.\[0\]\?\.name/);
  assert.match(deploy, /themes\/\$\{encodeURIComponent\(name\)\}\/activate/);
});
test("both public URLs are cache-busted and reject an absent marker", () => {
  for (const url of ["https://bomsociety.ghost.io/", "https://www.bomsociety.com/"]) assert.ok(deploy.includes(url));
  for (const value of ["build_test", "ts", "Cache-Control", "Pragma", "GHOST_ORIGIN_NOT_UPDATED", "CUSTOM_DOMAIN_NOT_UPDATED"]) assert.ok(deploy.includes(value));
});
