import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";
import { ghostRequest } from "./ghost-admin-api.mjs";

const DEPLOYMENT_MARKER = "GET PAID MORE";
const INTELLIGENCE_MARKER = "LIVE INTELLIGENCE";
const SCORE_MARKER = "BOM SCORE";
const verificationState = join("releases", ".ghost-admin-verification.json");

function fail(code, message) { throw new Error(`${code}: ${message}`); }
function environment() {
  const { GHOST_ADMIN_URL: adminUrl, GHOST_ADMIN_KEY: adminKey, GHOST_SITE_URL: siteUrl } = process.env;
  for (const [name, value] of Object.entries({ GHOST_ADMIN_URL: adminUrl, GHOST_ADMIN_KEY: adminKey, GHOST_SITE_URL: siteUrl })) {
    if (!value) fail("PREFLIGHT_CONFIGURATION_INVALID", `${name} is required.`);
  }
  if ((adminKey.match(/:/g) || []).length !== 1) fail("PREFLIGHT_CONFIGURATION_INVALID", "GHOST_ADMIN_KEY must contain exactly one colon.");
  const [id, secret] = adminKey.split(":");
  if (!/^[a-f0-9]+$/i.test(id) || !/^[a-f0-9]+$/i.test(secret)) fail("PREFLIGHT_CONFIGURATION_INVALID", "GHOST_ADMIN_KEY ID and secret must be hexadecimal strings.");
  let admin; let site;
  try { admin = new URL(adminUrl); site = new URL(siteUrl); } catch { fail("PREFLIGHT_CONFIGURATION_INVALID", "GHOST_ADMIN_URL and GHOST_SITE_URL must be valid URLs."); }
  if (admin.protocol !== "https:" || site.protocol !== "https:") fail("PREFLIGHT_CONFIGURATION_INVALID", "GHOST_ADMIN_URL and GHOST_SITE_URL must use HTTPS.");
  return { adminUrl, adminKey, siteUrl, admin, site };
}
function sanitized(value) { return JSON.stringify(value, (key, nested) => /authorization|cookie|key|password|secret|token/i.test(key) ? "[REDACTED]" : nested); }

async function preflight() {
  const env = environment();
  let site;
  try { site = await ghostRequest(env.adminUrl, env.adminKey, "/site/", { method: "GET" }); }
  catch (error) { fail("PREFLIGHT_SITE_REQUEST_FAILED", `GET /site/ failed. ${error.message}`); }
  const publication = site.site ?? site;
  const returnedUrl = publication.url;
  let returned;
  try { returned = new URL(returnedUrl); } catch { fail("PREFLIGHT_PUBLICATION_IDENTITY_MISMATCH", "GET /site/ did not return a valid publication URL."); }
  const result = { title: publication.title, siteUrl: returnedUrl, adminHostname: env.admin.hostname, configuredSiteHostname: env.site.hostname, ghostVersion: publication.version ?? site.meta?.version };
  console.error(`PREFLIGHT_RESULT ${sanitized(result)}`);
  if (!String(publication.title || "").includes("BOMSociety")) fail("PREFLIGHT_PUBLICATION_IDENTITY_MISMATCH", "GET /site/ title must contain BOMSociety.");
  if (returned.hostname !== env.site.hostname) fail("PREFLIGHT_PUBLICATION_IDENTITY_MISMATCH", `GET /site/ returned ${returned.hostname}, not ${env.site.hostname}. If this is bomsociety.ghost.io, verify and explicitly establish the custom domain/publication association before deploying.`);
}

function inspectZip(path) {
  const entries = execFileSync("unzip", ["-Z1", path], { encoding: "utf8" }).split("\n").filter(Boolean);
  if (!entries.includes("package.json")) fail("ZIP_INSPECTION_FAILED", "package.json must be at ZIP root.");
  if (!entries.includes("index.hbs")) fail("ZIP_INSPECTION_FAILED", "index.hbs must exist in the ZIP.");
  if (!entries.some((entry) => /^assets\/css\/.*\.css$/i.test(entry)) || !entries.some((entry) => /^assets\/js\/.*\.js$/i.test(entry))) fail("ZIP_INSPECTION_FAILED", "ZIP must contain CSS and JavaScript assets.");
  const packageJson = JSON.parse(execFileSync("unzip", ["-p", path, "package.json"], { encoding: "utf8" }));
  const match = basename(path).match(/-v(\d+\.\d+\.\d+)\.zip$/);
  if (!match || packageJson.version !== match[1]) fail("ZIP_INSPECTION_FAILED", "package.json version must equal the ZIP filename version.");
  const homepage = execFileSync("unzip", ["-p", path, "home.hbs"], { encoding: "utf8" });
  if (!homepage.includes(DEPLOYMENT_MARKER)) fail("ZIP_INSPECTION_FAILED", `ZIP homepage is missing deployment marker: ${DEPLOYMENT_MARKER}.`);
  console.error(`ZIP_INSPECTION_RESULT ${sanitized({ path, version: packageJson.version, marker: DEPLOYMENT_MARKER, css: true, javascript: true })}`);
}

async function upload(path) {
  const env = environment(); inspectZip(path);
  const form = new FormData(); form.append("file", new Blob([await readFile(path)], { type: "application/zip" }), basename(path));
  let status;
  let response;
  try { response = await ghostRequest(env.adminUrl, env.adminKey, "/themes/upload/", { method: "POST", body: form, onResponse: ({ status: value }) => { status = value; } }); }
  catch (error) { console.error(`UPLOAD_RESULT ${sanitized({ status, error: error.message })}`); fail("UPLOAD_FAILED", error.message); }
  const name = response.themes?.[0]?.name;
  console.error(`UPLOAD_RESULT ${sanitized({ status, response, installedThemeName: name })}`);
  if (typeof name !== "string" || !name.trim()) fail("UPLOAD_FAILED", "Upload response did not include themes[0].name.");
  console.log(name);
}
async function activate(name) {
  const { adminUrl, adminKey } = environment();
  const path = `/themes/${encodeURIComponent(name)}/activate/`; let status;
  try { await ghostRequest(adminUrl, adminKey, path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ themes: [{ active: true }] }), onResponse: ({ status: value }) => { status = value; } }); }
  catch (error) { console.error(`ACTIVATION_RESULT ${sanitized({ path, status, installedThemeName: name })}`); fail("ACTIVATION_FAILED", error.message); }
  console.error(`ACTIVATION_RESULT ${sanitized({ path, status, installedThemeName: name })}`);
}
async function fetchPublic(label, url) {
  const request = new URL("/", url); request.searchParams.set("bom_deploy", String(Date.now()));
  const response = await fetch(request, { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }, redirect: "follow" }); const html = await response.text();
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const result = { label, requestedUrl: request.toString(), finalUrl: response.url, status: response.status, title, deploymentMarker: html.includes(DEPLOYMENT_MARKER), bomScore: html.includes(SCORE_MARKER), livePhysicianIntelligence: html.includes(INTELLIGENCE_MARKER), server: response.headers.get("server"), cacheControl: response.headers.get("cache-control"), age: response.headers.get("age"), via: response.headers.get("via") };
  console.error(`VERIFICATION_RESULT ${sanitized(result)}`); return result;
}
async function verifyAdmin() { const { admin } = environment(); await writeFile(verificationState, JSON.stringify(await fetchPublic("Ghost publication URL", admin.origin))); }
async function verifySite() { const { site } = environment(); const custom = await fetchPublic("Custom production URL", site.origin); const admin = JSON.parse(await readFile(verificationState, "utf8")); if (admin.deploymentMarker && !custom.deploymentMarker) fail("ADMIN_PUBLIC_SITE_UPDATED_BUT_CUSTOM_DOMAIN_NOT_UPDATED", "Ghost publication URL has the marker but the custom domain does not."); if (!admin.deploymentMarker && !custom.deploymentMarker) fail("THEME_ACTIVATED_BUT_ROUTE_BYPASSES_THEME_MARKER", "Neither public URL contains the deployment marker."); if (!custom.deploymentMarker) fail("CUSTOM_DOMAIN_POINTS_TO_DIFFERENT_PUBLICATION", "Custom domain does not serve the activated BOMSociety publication."); }

const [command, value] = process.argv.slice(2);
if (command === "preflight") await preflight();
else if (command === "validate-secrets") { environment(); console.error("SECRET_VALIDATION_RESULT configuration is valid."); }
else if (command === "inspect") { if (!value) fail("ZIP_INSPECTION_FAILED", "Usage: deploy-ghost-theme.mjs inspect <zip-path>"); inspectZip(value); }
else if (command === "upload") { if (!value) fail("UPLOAD_FAILED", "Usage: deploy-ghost-theme.mjs upload <zip-path>"); await upload(value); }
else if (command === "activate") { if (!value) fail("ACTIVATION_FAILED", "Usage: deploy-ghost-theme.mjs activate <uploaded-theme-name>"); await activate(value); }
else if (command === "verify-admin") await verifyAdmin();
else if (command === "verify-site") await verifySite();
else fail("USAGE", "Command must be validate-secrets, preflight, inspect, upload, activate, verify-admin, or verify-site.");
