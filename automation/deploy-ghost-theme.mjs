import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { execFileSync } from "node:child_process";
import { ghostRequest } from "./ghost-admin-api.mjs";

const VERSION = "1.3.1";
const BUILD_MARKER = "BOMSOCIETY BUILD TEST 17 — VERSION 1.3.1";
const DEPLOYMENT_MARKER = "BOMSOCIETY-BUILD-TEST-17";
const ORIGIN_URL = "https://bomsociety.ghost.io/";
const CUSTOM_URL = "https://www.bomsociety.com/";
const HOME_TEMPLATE_CANDIDATES = ["index.hbs", "home.hbs", "custom-home.hbs", "page-home.hbs"];

function homepageTemplates(entries, path) {
  const templates = new Set(HOME_TEMPLATE_CANDIDATES.filter((template) => entries.includes(template)));
  if (entries.includes("routes.yaml")) {
    const rootRoute = /^  \/:\s*\n(?:    [^\n]*\n)*?    template:\s*([^\s#]+)\s*$/m.exec(zipText(path, "routes.yaml"));
    const routeTemplate = rootRoute?.[1] && `${rootRoute[1]}.hbs`;
    if (routeTemplate && entries.includes(routeTemplate)) templates.add(routeTemplate);
  }
  return [...templates].sort();
}

function fail(code, message = "") { throw new Error(message ? `${code}: ${message}` : code); }
function environment() {
  const { GHOST_ADMIN_URL: adminUrl, GHOST_ADMIN_KEY: adminKey } = process.env;
  for (const [name, value] of Object.entries({ GHOST_ADMIN_URL: adminUrl, GHOST_ADMIN_KEY: adminKey })) if (!value) fail("ACTIVATION_FAILED", `${name} is required.`);
  return { adminUrl, adminKey };
}
function sanitized(value) { return JSON.stringify(value, (key, nested) => /authorization|cookie|key|password|secret|token/i.test(key) ? "[REDACTED]" : nested); }
function zipEntries(path) { return execFileSync("unzip", ["-Z1", path], { encoding: "utf8" }).split("\n").filter(Boolean); }
function zipText(path, entry) { return execFileSync("unzip", ["-p", path, entry], { encoding: "utf8" }); }
function sha256(path) { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function readFileSync(path) { return execFileSync("cat", [path]); }

function inspectZip(path) {
  const entries = zipEntries(path);
  if (basename(path) !== `UPLOAD-TO-GHOST-bomsociety-theme-v${VERSION}.zip`) fail("WRONG_ZIP_DEPLOYED", "unexpected ZIP filename");
  if (!entries.includes("package.json") || !entries.includes("index.hbs")) fail("WRONG_ZIP_DEPLOYED", "package.json at root and index.hbs are required");
  if (!entries.some((entry) => /^assets\/css\/.*\.css$/i.test(entry)) || !entries.some((entry) => /^assets\/js\/.*\.js$/i.test(entry))) fail("WRONG_ZIP_DEPLOYED", "CSS and JavaScript assets are required");
  const pkg = JSON.parse(zipText(path, "package.json"));
  if (pkg.version !== VERSION) fail("WRONG_ZIP_DEPLOYED", `package version is ${pkg.version}`);
  const requiredHomepageTemplates = homepageTemplates(entries, path);
  const markerAudit = requiredHomepageTemplates.map((template) => ({ template, markerPresent: zipText(path, template).includes(DEPLOYMENT_MARKER) }));
  for (const { template, markerPresent } of markerAudit) if (!markerPresent) fail("WRONG_ZIP_DEPLOYED", `${template} lacks build marker`);
  const defaultTemplate = zipText(path, "default.hbs");
  if (!defaultTemplate.includes("bomsociety-theme-version") || !defaultTemplate.includes("bomsociety-commit") || !defaultTemplate.includes(DEPLOYMENT_MARKER)) fail("WRONG_ZIP_DEPLOYED", "stable metadata is missing");
  const result = { zipPath: path, requiredHomepageTemplates, markerAudit, packageVersion: pkg.version, sha256: sha256(path) };
  console.error(`ZIP_INSPECTION_RESULT ${sanitized(result)}`);
  return result;
}
async function upload(path) {
  const env = environment(); inspectZip(path);
  const form = new FormData(); form.append("file", new Blob([await readFile(path)], { type: "application/zip" }), basename(path));
  let status; let response;
  try { response = await ghostRequest(env.adminUrl, env.adminKey, "/themes/upload/", { method: "POST", body: form, onResponse: ({ status: value }) => { status = value; } }); }
  catch (error) { console.error(`UPLOAD_RESULT ${sanitized({ status, error: error.message })}`); fail("WRONG_ZIP_DEPLOYED", error.message); }
  const name = response.themes?.[0]?.name;
  console.error(`UPLOAD_RESULT ${sanitized({ status, response, installedThemeName: name })}`);
  if (typeof name !== "string" || !name.trim()) fail("WRONG_ZIP_DEPLOYED", "upload response did not include themes[0].name");
  console.log(name);
}
async function activate(name) {
  const { adminUrl, adminKey } = environment(); const path = `/themes/${encodeURIComponent(name)}/activate/`; let status;
  try { await ghostRequest(adminUrl, adminKey, path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ themes: [{ active: true }] }), onResponse: ({ status: value }) => { status = value; } }); }
  catch (error) { console.error(`ACTIVATION_RESULT ${sanitized({ path, status, installedThemeName: name })}`); fail("ACTIVATION_FAILED", error.message); }
  console.error(`ACTIVATION_RESULT ${sanitized({ path, status, installedThemeName: name })}`);
}
async function verify(label, baseUrl) {
  const request = new URL(baseUrl); request.searchParams.set("build_test", "17"); request.searchParams.set("ts", String(Date.now()));
  const response = await fetch(request, { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }, redirect: "follow" }); const html = await response.text();
  const result = { label, requestedUrl: request.toString(), finalUrl: response.url, status: response.status, title: html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "", visibleMarker: html.includes(BUILD_MARKER), themeVersion: html.includes('name="bomsociety-theme-version" content="1.3.1"'), deploymentMarker: html.includes(DEPLOYMENT_MARKER), server: response.headers.get("server"), cacheControl: response.headers.get("cache-control"), age: response.headers.get("age"), via: response.headers.get("via") };
  console.error(`VERIFICATION_RESULT ${sanitized(result)}`); return result;
}
function verificationFailure(result, code) {
  if (!result.themeVersion || !result.deploymentMarker) fail(code);
  if (!result.visibleMarker) fail("ROUTE_BYPASSES_UPDATED_TEMPLATE");
}
async function verifyOrigin() { verificationFailure(await verify("Ghost origin", ORIGIN_URL), "GHOST_ORIGIN_NOT_UPDATED"); }
async function verifySite() { verificationFailure(await verify("Custom domain", CUSTOM_URL), "CUSTOM_DOMAIN_NOT_UPDATED"); }

const [command, value] = process.argv.slice(2);
if (command === "validate-secrets") { environment(); console.error("SECRET_VALIDATION_RESULT configuration is valid."); }
else if (command === "inspect") { if (!value) fail("WRONG_ZIP_DEPLOYED", "ZIP path is required"); inspectZip(value); }
else if (command === "upload") { if (!value) fail("WRONG_ZIP_DEPLOYED", "ZIP path is required"); await upload(value); }
else if (command === "activate") { if (!value) fail("ACTIVATION_FAILED", "theme name is required"); await activate(value); }
else if (command === "verify-origin") await verifyOrigin();
else if (command === "verify-site") await verifySite();
else fail("ACTIVATION_FAILED", "Command must be validate-secrets, inspect, upload, activate, verify-origin, or verify-site.");
