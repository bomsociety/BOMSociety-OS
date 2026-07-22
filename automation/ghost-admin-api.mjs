import { createHmac } from "node:crypto";

// Ghost 6 Admin API uses version negotiation rather than a versioned URL.
// Keep the JWT audience aligned with the current Admin API contract.
const API_AUDIENCE = "/admin/";
export const DEFAULT_ADMIN_API_VERSION = "v6.54";

export function adminApiVersion() {
  const version = process.env.GHOST_API_VERSION || DEFAULT_ADMIN_API_VERSION;
  if (!/^v\d+\.\d+$/.test(version)) {
    throw new Error("GHOST_API_VERSION must use Ghost's v<major>.<minor> format (for example, v6.54).");
  }
  return version;
}

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
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return new URL(`/ghost/api/admin${endpoint}`, origin).toString();
}

export async function ghostRequest(adminUrl, adminKey, path, options = {}) {
  const { onResponse, ...requestOptions } = options;
  const response = await fetch(adminApiUrl(adminUrl, path), {
    ...requestOptions,
    headers: {
      Authorization: `Ghost ${createAdminToken(adminKey)}`,
      Accept: "application/json",
      ...requestOptions.headers,
      "Accept-Version": adminApiVersion(),
    },
  });
  const body = await response.text();
  onResponse?.({ body, status: response.status });
  if (!response.ok) throw new Error(`Ghost Admin API ${requestOptions.method ?? "GET"} ${path} failed (${response.status}): ${body}`);
  return body ? JSON.parse(body) : {};
}
