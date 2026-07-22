import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { spawn } from "node:child_process";
import test from "node:test";
import { DEFAULT_ADMIN_API_VERSION, adminApiUrl, adminApiVersion, createAdminToken, ghostRequest } from "../automation/ghost-admin-api.mjs";

const adminKey = "0123456789abcdef:0123456789abcdef0123456789abcdef";

function tokenPayload(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
}

test("uses the Ghost 6 Admin API URL, audience, and default version header for every request", async () => {
  assert.equal(adminApiUrl("https://example.com/ghost/", "/themes/upload/"), "https://example.com/ghost/api/admin/themes/upload/");
  assert.equal(tokenPayload(createAdminToken(adminKey, 100)).aud, "/admin/");

  const originalFetch = globalThis.fetch;
  const originalVersion = process.env.GHOST_API_VERSION;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ themes: [] }), { status: 200 });
  };
  delete process.env.GHOST_API_VERSION;
  try {
    await Promise.all([
      ghostRequest("https://example.com", adminKey, "/themes/", { method: "GET" }),
      ghostRequest("https://example.com", adminKey, "/themes/upload/", { method: "POST", headers: { "Accept-Version": "v0.0" } }),
      ghostRequest("https://example.com", adminKey, "/themes/bomsociety/", { method: "PUT" }),
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalVersion === undefined) delete process.env.GHOST_API_VERSION;
    else process.env.GHOST_API_VERSION = originalVersion;
  }
  assert.equal(requests[0].url, "https://example.com/ghost/api/admin/themes/");
  for (const request of requests) {
    assert.equal(request.options.headers["Accept-Version"], "v6.54");
    assert.match(request.options.headers.Authorization, /^Ghost /);
  }
  assert.equal(DEFAULT_ADMIN_API_VERSION, "v6.54");
});

test("uses GHOST_API_VERSION when it is configured", async () => {
  const originalFetch = globalThis.fetch;
  const originalVersion = process.env.GHOST_API_VERSION;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ themes: [] }), { status: 200 });
  };
  process.env.GHOST_API_VERSION = "v6.99";
  try {
    await ghostRequest("https://example.com", adminKey, "/themes/");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalVersion === undefined) delete process.env.GHOST_API_VERSION;
    else process.env.GHOST_API_VERSION = originalVersion;
  }
  assert.equal(request.options.headers["Accept-Version"], "v6.99");
});

test("rejects an invalid configured Ghost Admin API version before making a request", () => {
  const originalVersion = process.env.GHOST_API_VERSION;
  process.env.GHOST_API_VERSION = "6.54";
  try {
    assert.throws(() => adminApiVersion(), /v<major>.<minor>/);
  } finally {
    if (originalVersion === undefined) delete process.env.GHOST_API_VERSION;
    else process.env.GHOST_API_VERSION = originalVersion;
  }
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
      env: { ...process.env, GHOST_API_VERSION: "v6.54", GHOST_ADMIN_URL: `http://127.0.0.1:${port}/`, GHOST_ADMIN_KEY: adminKey, GHOST_SITE_URL: "https://example.com" },
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
  assert.equal(request.headers["accept-version"], "v6.54");
  assert.match(request.headers["content-type"], /^multipart\/form-data; boundary=/);
  assert.match(request.body, /name="file"; filename="bomsociety theme\.zip"/);
  assert.match(request.headers.authorization, /^Ghost /);
});

test("deployment commands upload, activate, verify, and can roll back with the configured API version", async () => {
  const activeThemes = new Set(["previous-theme"]);
  let activeTheme = "previous-theme";
  let homepageIsValid = true;
  const requests = [];
  const server = createServer(async (incoming, outgoing) => {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    requests.push({ headers: incoming.headers, method: incoming.method, url: incoming.url });

    if (incoming.url === "/") {
      outgoing.setHeader("Content-Type", "text/html");
      outgoing.end(homepageIsValid
        ? "<title>BOMSociety</title>What decision needs your attention?Create My Free Profile"
        : "<title>BOMSociety</title>");
      return;
    }
    outgoing.setHeader("Content-Type", "application/json");
    if (incoming.method === "GET" && incoming.url === "/ghost/api/admin/themes/") {
      outgoing.end(JSON.stringify({ themes: [...activeThemes].map((name) => ({ name, active: name === activeTheme })) }));
    } else if (incoming.method === "POST" && incoming.url === "/ghost/api/admin/themes/upload/") {
      activeThemes.add("uploaded-theme");
      outgoing.end(JSON.stringify({ themes: [{ name: "uploaded-theme" }] }));
    } else if (incoming.method === "PUT" && incoming.url?.startsWith("/ghost/api/admin/themes/")) {
      activeTheme = decodeURIComponent(incoming.url.split("/").at(-2));
      outgoing.end(JSON.stringify({ themes: [{ name: activeTheme, active: true }] }));
    } else {
      outgoing.statusCode = 404;
      outgoing.end(JSON.stringify({ errors: [{ message: "not found" }] }));
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const directory = await mkdtemp(join(tmpdir(), "ghost-theme-deploy-"));
  const archive = join(directory, "theme.zip");
  await writeFile(archive, "PK");
  const { port } = server.address();
  const env = {
    ...process.env,
    GHOST_API_VERSION: "v6.54",
    GHOST_ADMIN_URL: `http://127.0.0.1:${port}/`,
    GHOST_ADMIN_KEY: adminKey,
    GHOST_SITE_URL: `http://127.0.0.1:${port}/`,
  };
  const run = async (...args) => {
    const child = spawn(process.execPath, ["automation/deploy-ghost-theme.mjs", ...args], { cwd: process.cwd(), env });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const [code] = await once(child, "close");
    return { code, stderr, stdout };
  };
  try {
    assert.equal((await run("active-theme")).stdout.trim(), "previous-theme");
    assert.equal((await run("upload", archive)).stdout.trim(), "uploaded-theme");
    assert.equal((await run("activate", "uploaded-theme")).code, 0);
    assert.equal(activeTheme, "uploaded-theme");
    assert.equal((await run("verify")).code, 0);
    homepageIsValid = false;
    const verification = await run("verify");
    assert.notEqual(verification.code, 0);
    assert.match(verification.stderr, /required hero marker/);
    assert.equal((await run("activate", "previous-theme")).code, 0);
    assert.equal(activeTheme, "previous-theme");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  }
  for (const request of requests.filter(({ url }) => url !== "/")) {
    assert.equal(request.headers["accept-version"], "v6.54");
  }
});
