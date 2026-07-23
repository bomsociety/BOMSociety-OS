import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { execFileSync } from "node:child_process";
import { ghostRequest } from "./ghost-admin-api.mjs";

const VERSION = "1.3.2";
const DEPLOYMENT_MARKER = "BOMSOCIETY-SPRINT-17B-CANONICAL";
const RETIRED_HOMEPAGE_MARKERS = ["Better decisions in the business of medicine.", "Explore BOMBriefs", "What is a BOMBrief?"];
const CLIENT_MATRIX = [
  { label: "Chrome desktop", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36" },
  { label: "Googlebot", userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)" },
  { label: "Bingbot", userAgent: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" },
  { label: "curl", userAgent: "curl/8.7.1" },
  { label: "Safari mobile", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1" },
  // A raw fetch is the JavaScript-disabled result: no browser code can replace server markup.
  { label: "JavaScript disabled", userAgent: "BOMSociety verification; JavaScript disabled" },
  { label: "No cookies", userAgent: "BOMSociety verification" },
  { label: "Existing cookies", userAgent: "BOMSociety verification", cookie: "bom_verification=browser" }
];
const ORIGIN_URL = "https://bomsociety.ghost.io/";
const CUSTOM_URL = "https://www.bomsociety.com/";
const ALLOWED_VARY_TOKENS = ["accept-encoding", "cookie"];
function homepageTemplates(entries, path) {
  if (!entries.includes("routes.yaml")) fail("WRONG_ZIP_DEPLOYED", "routes.yaml is required");
  const rootRoute = /^  \/:\s*\n(?:    [^\n]*\n)*?    template:\s*([^\s#]+)\s*$/m.exec(zipText(path, "routes.yaml"));
  const routeTemplate = rootRoute?.[1] && `${rootRoute[1]}.hbs`;
  if (!routeTemplate || !entries.includes(routeTemplate)) fail("WRONG_ZIP_DEPLOYED", "root route must select an included template");
  return [routeTemplate];
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
function pageTitle(html) {
  return /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "";
}
function firstH1(html) {
  return /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "";
}
function canonicalUrlFound(html) {
  return /<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']https:\/\/www\.bomsociety\.com\/["'][^>]*>/i.test(html);
}
function varyTokens(headers) {
  return (headers.get("vary") || "").split(",").map((token) => token.trim().toLowerCase()).filter(Boolean);
}
function cacheVaryIsSafe(headers) {
  return varyTokens(headers).every((token) => ALLOWED_VARY_TOKENS.includes(token));
}
function hasMeta(html, name, expectedContent, exact = true) {
  const tag = new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*>`, "gi");
  return [...html.matchAll(tag)].some(([match]) => {
    const content = /\bcontent=["']([^"']*)["']/i.exec(match)?.[1];
    return content !== undefined && (exact ? content === expectedContent : content.includes(expectedContent));
  });
}

export function assessProductionVerification({ status, finalUrl, html, headers = new Headers() }) {
  const finalHostname = new URL(finalUrl).hostname;
  return {
    status,
    finalUrl,
    title: pageTitle(html),
    firstH1: firstH1(html),
    contentLength: Buffer.byteLength(html),
    cacheControl: headers.get("cache-control") || "",
    vary: headers.get("vary") || "",
    varyTokens: varyTokens(headers),
    allowedVaryTokens: ALLOWED_VARY_TOKENS,
    cacheVarySafe: cacheVaryIsSafe(headers),
    finalHostname,
    canonicalUrlFound: canonicalUrlFound(html),
    themeVersionFound: hasMeta(html, "bomsociety-theme-version", VERSION),
    deploymentMarkerFound: hasMeta(html, "bomsociety-deployment-marker", DEPLOYMENT_MARKER, false),
    homepageRootFound: html.includes("data-bomsociety-home"),
    decisionScoreFound: html.includes("data-decision-score"),
    decisionIntelligenceFound: html.includes("data-decision-intelligence"),
    compensationPathwayFound: html.includes("data-compensation-pathway"),
    compensationHeroFound: html.includes("Are you getting paid what you’re worth?"),
    retiredHomepageFound: RETIRED_HOMEPAGE_MARKERS.some((marker) => html.includes(marker))
  };
}
function isConfiguredProductionUrl(finalUrl, configuredUrl) {
  const configured = new URL(configuredUrl);
  const actual = new URL(finalUrl);
  return actual.origin === configured.origin && actual.pathname === configured.pathname;
}

async function verify(label, baseUrl, client = {}) {
  const request = new URL(baseUrl); request.searchParams.set("cache_test", String(Date.now())); request.searchParams.set("build_test", "17b");
  const headers = { "Cache-Control": "no-cache", Pragma: "no-cache", "User-Agent": client.userAgent || "BOMSociety verification" };
  if (client.cookie) headers.Cookie = client.cookie;
  const response = await fetch(request, { headers, redirect: "follow" }); const html = await response.text();
  const result = assessProductionVerification({ status: response.status, finalUrl: response.url, html, headers: response.headers });
  console.error(`VERIFICATION_RESULT ${sanitized({ label, requestedUrl: request.toString(), userAgent: headers["User-Agent"], cookieMode: client.cookie ? "benign test cookie" : "no cookies", ...result })}`); return result;
}
export function canonicalIdentity(result) {
  return {
    status: result.status,
    finalHostname: result.finalHostname || new URL(result.finalUrl).hostname,
    firstH1: result.firstH1,
    themeVersionFound: result.themeVersionFound,
    deploymentMarkerFound: result.deploymentMarkerFound,
    homepageRootFound: result.homepageRootFound,
    decisionScoreFound: result.decisionScoreFound,
    decisionIntelligenceFound: result.decisionIntelligenceFound,
    compensationPathwayFound: result.compensationPathwayFound,
    retiredHomepageAbsent: !result.retiredHomepageFound
  };
}
export function canonicalIdentityHash(result) {
  return createHash("sha256").update(JSON.stringify(canonicalIdentity(result))).digest("hex");
}
export function assertConsistentVariants(variants) {
  const hashes = variants.map(({ result }) => canonicalIdentityHash(result));
  const allHashesMatch = new Set(hashes).size === 1;
  const noCookie = variants.find(({ client }) => client.label === "No cookies");
  const cookie = variants.find(({ client }) => client.label === "Existing cookies");
  if (noCookie && cookie && canonicalIdentityHash(noCookie.result) !== canonicalIdentityHash(cookie.result)) fail("COOKIE_VARIANT_MISMATCH");
  const userAgentHashes = variants.filter(({ client }) => client.label !== "No cookies" && client.label !== "Existing cookies").map(({ result }) => canonicalIdentityHash(result));
  if (new Set(userAgentHashes).size !== 1) fail("USER_AGENT_VARIANT_MISMATCH");
  if (!allHashesMatch) fail("SPLIT_HOMEPAGE_DELIVERY");
  return { hashes, allHashesMatch };
}
async function verifyMatrix(label, baseUrl, configuredUrl) {
  const variants = [];
  for (const client of CLIENT_MATRIX) {
    const result = await verify(`${label} — ${client.label}`, baseUrl, client);
    verificationFailure(result, `${label.toUpperCase().replace(/\s+/g, "_")}_NOT_UPDATED`, configuredUrl);
    variants.push({ client, result });
  }
  const comparison = assertConsistentVariants(variants);
  const unusualVary = variants.some(({ result }) => !result.cacheVarySafe);
  console.error(`VARIANT_IDENTITY_RESULT ${sanitized({ label, rawVaryHeaders: variants.map(({ client, result }) => ({ label: client.label, vary: result.vary })), allowedVaryTokens: ALLOWED_VARY_TOKENS, testedRequestVariants: variants.map(({ client }) => ({ label: client.label, cookieMode: client.cookie ? "benign test cookie" : "no cookies", cacheBusted: true })), canonicalIdentityHashes: variants.map(({ client }, index) => ({ label: client.label, hash: comparison.hashes[index] })), allHashesMatch: comparison.allHashesMatch })}`);
  // Unknown Vary keys are only unsafe if the cross-variant comparison cannot prove one identity.
  if (unusualVary && !comparison.allHashesMatch) fail("UNSAFE_CACHE_VARY");
}

function verificationFailure(result, code, configuredUrl) {
  if (result.status !== 200 || (configuredUrl && !isConfiguredProductionUrl(result.finalUrl, configuredUrl))) fail(code);
  if (!result.themeVersionFound) fail("WRONG_THEME_VERSION");
  if (!result.deploymentMarkerFound) fail("DEPLOYMENT_MARKER_MISSING");
  if (!result.canonicalUrlFound) fail("CANONICAL_URL_MISSING");
  if (!result.cacheVarySafe) fail("UNSAFE_CACHE_VARY");
  const homepageMarkers = [result.homepageRootFound, result.decisionScoreFound, result.decisionIntelligenceFound, result.compensationPathwayFound, result.compensationHeroFound];
  if (homepageMarkers.every((found) => !found)) fail("ROUTE_BYPASSES_UPDATED_TEMPLATE");
  if (homepageMarkers.some((found) => !found)) fail("HOMEPAGE_STRUCTURE_MISSING");
  if (result.retiredHomepageFound) fail("RETIRED_HOMEPAGE_DELIVERED");
}

export function assertProductionVerification(result, code = "PRODUCTION_NOT_UPDATED", configuredUrl) { verificationFailure(result, code, configuredUrl); }

async function verifyOrigin() { await verifyMatrix("Ghost origin", ORIGIN_URL, CUSTOM_URL); }
async function verifySite() { await verifyMatrix("Custom domain", CUSTOM_URL, CUSTOM_URL); }

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [command, value] = process.argv.slice(2);
  if (command === "validate-secrets") { environment(); console.error("SECRET_VALIDATION_RESULT configuration is valid."); }
  else if (command === "inspect") { if (!value) fail("WRONG_ZIP_DEPLOYED", "ZIP path is required"); inspectZip(value); }
  else if (command === "upload") { if (!value) fail("WRONG_ZIP_DEPLOYED", "ZIP path is required"); await upload(value); }
  else if (command === "activate") { if (!value) fail("ACTIVATION_FAILED", "theme name is required"); await activate(value); }
  else if (command === "verify-origin") await verifyOrigin();
  else if (command === "verify-site") await verifySite();
  else fail("ACTIVATION_FAILED", "Command must be validate-secrets, inspect, upload, activate, verify-origin, or verify-site.");
}
