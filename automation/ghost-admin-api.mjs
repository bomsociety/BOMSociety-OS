import { createHmac } from "node:crypto";

const API_AUDIENCE = "/v5/admin/";

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

export function createAdminToken(key, now = Math.floor(Date.now() / 1000)) {
  const [id, secret] = key.split(":");
  if (!id || !secret || !/^[a-f0-9]+$/i.test(secret)) {
    throw new Error("GHOST_ADMIN_KEY must be an Admin API key in id:hex-secret format.");
  }

  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }));
  const payload = base64Url(JSON.stringify({ iat: now, exp: now + 300, aud: API_AUDIENCE }));
  const signature = createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function adminApiUrl(adminUrl, path) {
  const origin = new URL(adminUrl);
  return new URL(`/ghost/api/admin${path}`, origin).toString();
}

export async function ghostRequest(adminUrl, adminKey, path, options = {}) {
  const response = await fetch(adminApiUrl(adminUrl, path), {
    ...options,
    headers: {
      Authorization: `Ghost ${createAdminToken(adminKey)}`,
      Accept: "application/json",
      ...options.headers,
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Ghost Admin API ${options.method ?? "GET"} ${path} failed (${response.status}): ${body}`);
  return body ? JSON.parse(body) : {};
}
