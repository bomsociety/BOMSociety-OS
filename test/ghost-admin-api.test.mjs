import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { spawn } from "node:child_process";
import test from "node:test";
import { ADMIN_API_VERSION, adminApiUrl, createAdminToken, ghostRequest } from "../automation/ghost-admin-api.mjs";

const adminKey = "0123456789abcdef:0123456789abcdef0123456789abcdef";

function tokenPayload(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
}

test("uses the Ghost 6 Admin API URL, audience, and version header", async () => {
  assert.equal(adminApiUrl("https://example.com/ghost/", "/themes/upload/"), "https://example.com/ghost/api/admin/themes/upload/");
  assert.equal(tokenPayload(createAdminToken(adminKey, 100)).aud, "/admin/");

  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ themes: [] }), { status: 200 });
  };
  try {
    await ghostRequest("https://example.com", adminKey, "/themes/");
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(request.url, "https://example.com/ghost/api/admin/themes/");
  assert.equal(request.options.headers["Accept-Version"], ADMIN_API_VERSION);
  assert.match(request.options.headers.Authorization, /^Ghost /);
});

test("uploads a ZIP to Ghost's themes upload endpoint as multipart form data", async () => {
  let request;
  const server = createServer(async (incoming, outgoing) => {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    request = { headers: incoming.headers, method: incoming.method, url: incoming.url, body: Buffer.concat(chunks).toString("latin1") };
    outgoing.setHeader("Content-Type", "application/json");
    outgoing.end(JSON.stringify({ themes: [{ name: "bomsociety" }] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const directory = await mkdtemp(join(tmpdir(), "ghost-theme-upload-"));
  const archive = join(directory, "bomsociety theme.zip");
  await writeFile(archive, "PK");
  try {
    const { port } = server.address();
    const child = spawn(process.execPath, ["automation/deploy-ghost-theme.mjs", "upload", archive], {
      cwd: process.cwd(),
      env: { ...process.env, GHOST_ADMIN_URL: `http://127.0.0.1:${port}/`, GHOST_ADMIN_KEY: adminKey, GHOST_SITE_URL: "https://example.com" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const [code] = await once(child, "close");
    assert.equal(code, 0, stderr);
    assert.equal(stdout.trim(), "bomsociety");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  }
  assert.equal(request.method, "POST");
  assert.equal(request.url, "/ghost/api/admin/themes/upload/");
  assert.equal(request.headers["accept-version"], ADMIN_API_VERSION);
  assert.match(request.headers["content-type"], /^multipart\/form-data; boundary=/);
  assert.match(request.body, /name="file"; filename="bomsociety theme\.zip"/);
  assert.match(request.headers.authorization, /^Ghost /);
});
