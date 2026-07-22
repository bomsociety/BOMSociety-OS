import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { ghostRequest } from "./ghost-admin-api.mjs";

const [command, value] = process.argv.slice(2);
const { GHOST_ADMIN_URL: adminUrl, GHOST_ADMIN_KEY: adminKey, GHOST_SITE_URL: siteUrl } = process.env;
if (!adminUrl || !adminKey || !siteUrl) throw new Error("GHOST_ADMIN_URL, GHOST_ADMIN_KEY, and GHOST_SITE_URL are required.");

if (command === "upload") {
  if (!value) throw new Error("Usage: deploy-ghost-theme.mjs upload <zip-path>");
  const archive = await readFile(value);
  const form = new FormData();
  form.append("file", new Blob([archive], { type: "application/zip" }), basename(value));
  const result = await ghostRequest(adminUrl, adminKey, "/themes/upload/", { method: "POST", body: form });
  const themeName = result.themes?.[0]?.name;
  if (!themeName) throw new Error("Ghost upload succeeded without returning an uploaded theme name.");
  console.log(themeName);
} else if (command === "activate") {
  if (!value) throw new Error("Usage: deploy-ghost-theme.mjs activate <theme-name>");
  await ghostRequest(adminUrl, adminKey, `/themes/${encodeURIComponent(value)}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ themes: [{ active: true }] }),
  });
} else if (command === "verify") {
  const response = await fetch(new URL("/", siteUrl));
  const html = await response.text();
  if (!response.ok) throw new Error(`Live homepage returned HTTP ${response.status}.`);
  for (const requiredText of ["Level up the business side of medicine.", "Start Leveling Up", "Explore For You"]) {
    if (!html.includes(requiredText)) throw new Error(`Live homepage is missing required text: ${requiredText}`);
  }
} else {
  throw new Error("Command must be upload, activate, or verify.");
}
