import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { createServer } from "node:https";
import { promisify } from "node:util";
import { DEFAULT_ADMIN_API_VERSION, adminApiUrl, createAdminToken } from "../automation/ghost-admin-api.mjs";

const deployment = await readFile(new URL("../automation/deploy-ghost-theme.mjs", import.meta.url), "utf8");
const workflow = await readFile(new URL("../.github/workflows/deploy-ghost-theme.yml", import.meta.url), "utf8");
const execFileAsync = promisify(execFile);

async function createUploadFixture() {
  const directory = await mkdtemp(join(tmpdir(), "ghost-upload-output-"));
  const theme = join(directory, "theme");
  const zip = join(directory, "UPLOAD-TO-GHOST-bomsociety-theme-v1.3.0.zip");
  const key = join(directory, "key.pem"); const certificate = join(directory, "certificate.pem");
  execFileSync("mkdir", ["-p", join(theme, "assets/css"), join(theme, "assets/js")]);
  await writeFile(join(theme, "package.json"), '{"name":"package-name-must-not-be-used","version":"1.3.0"}');
  await writeFile(join(theme, "index.hbs"), "x"); await writeFile(join(theme, "home.hbs"), "GET PAID MORE");
  await writeFile(join(theme, "assets/css/s.css"), ""); await writeFile(join(theme, "assets/js/s.js"), "");
  execFileSync("zip", ["-qr", zip, "."], { cwd: theme });
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key, "-out", certificate, "-subj", "/CN=localhost", "-days", "1"], { stdio: "ignore" });
  const requests = [];
  const server = createServer({ key: await readFile(key), cert: await readFile(certificate) }, async (request, response) => {
    for await (const _chunk of request) { /* consume multipart uploads */ }
    requests.push(request.url);
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/ghost/api/admin/themes/upload/") response.end('{"themes":[{"name":"UPLOAD-TO-GHOST-bomsociety-theme-v1.3.0"}]}');
    else if (request.url === "/ghost/api/admin/themes/UPLOAD-TO-GHOST-bomsociety-theme-v1.3.0/activate/") response.end('{"themes":[{"active":true}]}');
    else { response.statusCode = 404; response.end("{}"); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    directory, zip, requests,
    environment: {
      ...process.env, GHOST_ADMIN_URL: `https://localhost:${port}/ghost/`, GHOST_SITE_URL: `https://localhost:${port}/`,
      GHOST_ADMIN_KEY: "0123456789abcdef:0123456789abcdef", NODE_TLS_REJECT_UNAUTHORIZED: "0", NODE_NO_WARNINGS: "1",
    },
    async close() { await new Promise((resolve) => server.close(resolve)); await rm(directory, { recursive: true, force: true }); },
  };
}

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
test("upload keeps diagnostics off stdout and passes Ghost's installed theme name through GitHub output", async () => {
  const fixture = await createUploadFixture();
  try {
    const uploaded = await execFileAsync(process.execPath, ["automation/deploy-ghost-theme.mjs", "upload", fixture.zip], { cwd: process.cwd(), env: fixture.environment });
    assert.equal(uploaded.stdout, "UPLOAD-TO-GHOST-bomsociety-theme-v1.3.0\n");
    assert.match(uploaded.stderr, /ZIP_INSPECTION_RESULT/);
    assert.match(uploaded.stderr, /UPLOAD_RESULT/);

    const output = join(fixture.directory, "github-output");
    const command = 'theme_name="$(node automation/deploy-ghost-theme.mjs upload "$1")"; test -n "$theme_name"; ! [[ "$theme_name" == *$\'\\r\'* || "$theme_name" == *$\'\\n\'* ]]; printf \'theme_name=%s\\n\' "$theme_name" >> "$GITHUB_OUTPUT"';
    const substituted = await execFileAsync("bash", ["-c", command, "bash", fixture.zip], { cwd: process.cwd(), env: { ...fixture.environment, GITHUB_OUTPUT: output } });
    assert.equal(substituted.stdout, "");
    assert.match(substituted.stderr, /UPLOAD_RESULT/);
    assert.equal(await readFile(output, "utf8"), "theme_name=UPLOAD-TO-GHOST-bomsociety-theme-v1.3.0\n");

    await execFileAsync(process.execPath, ["automation/deploy-ghost-theme.mjs", "activate", "UPLOAD-TO-GHOST-bomsociety-theme-v1.3.0"], { cwd: process.cwd(), env: fixture.environment });
    assert.deepEqual(fixture.requests, [
      "/ghost/api/admin/themes/upload/",
      "/ghost/api/admin/themes/upload/",
      "/ghost/api/admin/themes/UPLOAD-TO-GHOST-bomsociety-theme-v1.3.0/activate/",
    ]);
  } finally { await fixture.close(); }
});
test("workflow has manual dispatch and the required non-rollback order", () => {
  assert.match(workflow, /workflow_dispatch/); assert.doesNotMatch(workflow, /continue-on-error|rollback|Capture currently active theme/i);
  const names = ["checkout", "setup Node", "validate secrets", "preflight publication identity", "run tests", "build ZIP", "inspect ZIP", "upload", "activate", "verify Ghost publication URL", "verify custom production URL", "report complete diagnostics"];
  let previous = -1; for (const name of names) { const position = workflow.indexOf(`name: ${name}`); assert.ok(position > previous, `${name} is out of order`); previous = position; }
  assert.match(workflow, /theme_name="\$\(node automation\/deploy-ghost-theme\.mjs upload "\$\{\{ steps\.build\.outputs\.zip_path \}\}"\)"/);
  assert.match(workflow, /! \[\[ "\$theme_name" == \*\$'\\r'\* \|\| "\$theme_name" == \*\$'\\n'\* \]\]/);
  assert.match(workflow, /printf 'theme_name=%s\\n' "\$theme_name" >> "\$GITHUB_OUTPUT"/);
  assert.doesNotMatch(workflow, /echo "theme_name=/);
});
