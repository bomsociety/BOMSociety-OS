import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { ghostRequest } from "./ghost-admin-api.mjs";

const [command, value] = process.argv.slice(2);
const { GHOST_ADMIN_URL: adminUrl, GHOST_ADMIN_KEY: adminKey, GHOST_SITE_URL: siteUrl } = process.env;

function requireGhostEnvironment(required = ["adminUrl", "adminKey", "siteUrl"]) {
  const values = { adminUrl, adminKey, siteUrl };
  if (required.some((name) => !values[name])) {
    throw new Error("GHOST_ADMIN_URL, GHOST_ADMIN_KEY, and GHOST_SITE_URL are required.");
  }
}

function verificationMarkers() {
  const markers = {
    title: process.env.GHOST_VERIFY_TITLE || "BOMSociety",
    hero: process.env.GHOST_VERIFY_HERO || "GET PAID MORE",
    cta: process.env.GHOST_VERIFY_CTA || "How intelligence is built",
  };
  for (const [name, marker] of Object.entries(markers)) {
    if (!marker.trim()) throw new Error(`GHOST_VERIFY_${name.toUpperCase()} must not be empty.`);
  }
  return markers;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizedUploadResponse(response) {
  let value = response;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      // A non-JSON response is still safe to log as a string.
    }
  }
  return JSON.stringify(value, (key, nestedValue) => (
    /authorization|cookie|key|password|secret|token/i.test(key) ? "[REDACTED]" : nestedValue
  ));
}

function logUploadDiagnostics({ request, response, uploadResponse }) {
  console.error(`Ghost theme upload request: ${sanitizedUploadResponse(request)}`);
  console.error(`Ghost theme upload response: ${sanitizedUploadResponse(response)}`);
  console.error(`Ghost theme parsed JSON: ${sanitizedUploadResponse(uploadResponse)}`);
  console.error(`Ghost theme uploadResponse: ${sanitizedUploadResponse(uploadResponse)}`);
  console.error(`Ghost theme uploadResponse.themes: ${sanitizedUploadResponse(uploadResponse.themes)}`);
  console.error(`Ghost theme uploadResponse.themes[0]: ${sanitizedUploadResponse(uploadResponse.themes?.[0])}`);
  console.error(`Ghost theme uploadResponse.themes[0].name: ${sanitizedUploadResponse(uploadResponse.themes?.[0]?.name)}`);
}

function uploadedThemeName(uploadResponse) {
  const name = uploadResponse.themes?.[0]?.name;
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Ghost upload response did not include themes[0].name; refusing to guess an activation name.");
  }
  return name;
}

async function activate(themeName) {
  await ghostRequest(adminUrl, adminKey, `/themes/${encodeURIComponent(themeName)}/activate/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ themes: [{ active: true }] }),
  });
}

if (command === "upload") {
  requireGhostEnvironment();
  if (!value) throw new Error("Usage: deploy-ghost-theme.mjs upload <zip-path>");
  const archive = await readFile(value);
  const form = new FormData();
  form.append("file", new Blob([archive], { type: "application/zip" }), basename(value));
  const uploadRequest = { method: "POST", path: "/themes/upload/", fileName: basename(value), contentType: "application/zip" };
  let uploadResponseText;
  const uploadResponse = await ghostRequest(adminUrl, adminKey, "/themes/upload/", {
    method: "POST",
    body: form,
    onResponse: ({ body }) => { uploadResponseText = body; },
  });
  logUploadDiagnostics({ request: uploadRequest, response: uploadResponseText, uploadResponse });
  const themeName = uploadedThemeName(uploadResponse);
  await activate(themeName);
  console.log(themeName);
} else if (command === "restore") {
  requireGhostEnvironment(["adminUrl", "adminKey"]);
  if (!value) throw new Error("Usage: deploy-ghost-theme.mjs restore <theme-name>");
  await activate(value);
} else if (command === "active-theme") {
  requireGhostEnvironment(["adminUrl", "adminKey"]);
  const result = await ghostRequest(adminUrl, adminKey, "/themes/", { method: "GET" });
  const activeTheme = result.themes?.find((theme) => theme.active)?.name;
  if (!activeTheme) throw new Error("Ghost Admin API did not return an active theme.");
  console.log(activeTheme);
} else if (command === "verify") {
  requireGhostEnvironment(["siteUrl"]);
  const response = await fetch(new URL("/", siteUrl));
  const html = await response.text();
  if (!response.ok) throw new Error(`Live homepage returned HTTP ${response.status}.`);
  const { title, hero, cta } = verificationMarkers();
  if (!new RegExp(`<title[^>]*>[^<]*${escapeRegExp(title)}[^<]*</title>`, "i").test(html)) {
    throw new Error(`Live homepage title is missing required title marker: ${title}`);
  }
  for (const [name, marker] of Object.entries({ hero, cta })) {
    if (!html.includes(marker)) throw new Error(`Live homepage is missing required ${name} marker: ${marker}`);
  }
} else {
  throw new Error("Command must be upload, restore, active-theme, or verify.");
}
