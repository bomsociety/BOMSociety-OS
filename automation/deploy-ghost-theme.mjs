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
    hero: process.env.GHOST_VERIFY_HERO || "What decision needs your attention?",
    cta: process.env.GHOST_VERIFY_CTA || "Create My Free Profile",
  };
  for (const [name, marker] of Object.entries(markers)) {
    if (!marker.trim()) throw new Error(`GHOST_VERIFY_${name.toUpperCase()} must not be empty.`);
  }
  return markers;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uploadedThemeIdentifier(uploadResult) {
  const theme = uploadResult.themes?.find((item) => typeof item.name === "string" && item.name.trim());
  return theme?.name;
}

async function installedThemeIdentifier(uploadResult, packageName) {
  const identifier = uploadedThemeIdentifier(uploadResult);
  if (identifier) return identifier;

  const installedThemes = await ghostRequest(adminUrl, adminKey, "/themes/", { method: "GET" });
  const installedTheme = installedThemes.themes?.find((theme) => theme.name === packageName);
  if (!installedTheme?.name) {
    throw new Error(`Ghost upload response did not include a theme identifier, and no installed theme matched package name: ${packageName}`);
  }
  return installedTheme.name;
}

if (command === "upload") {
  requireGhostEnvironment();
  const packageName = process.argv[4];
  if (!value || !packageName) throw new Error("Usage: deploy-ghost-theme.mjs upload <zip-path> <package-name>");
  const archive = await readFile(value);
  const form = new FormData();
  form.append("file", new Blob([archive], { type: "application/zip" }), basename(value));
  let responseBody = "";
  const result = await ghostRequest(adminUrl, adminKey, "/themes/upload/", {
    method: "POST",
    body: form,
    onResponse: ({ body }) => { responseBody = body; },
  });
  console.error(`Ghost theme upload response: ${responseBody}`);
  // Ghost identifies themes from their package, never from the uploaded ZIP filename.
  console.log(await installedThemeIdentifier(result, packageName));
} else if (command === "activate") {
  requireGhostEnvironment(["adminUrl", "adminKey"]);
  if (!value) throw new Error("Usage: deploy-ghost-theme.mjs activate <theme-name>");
  await ghostRequest(adminUrl, adminKey, `/themes/${encodeURIComponent(value)}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ themes: [{ active: true }] }),
  });
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
  throw new Error("Command must be upload, activate, active-theme, or verify.");
}
