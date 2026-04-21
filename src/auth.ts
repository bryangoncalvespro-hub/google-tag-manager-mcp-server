import { AsyncLocalStorage } from "node:async_hooks";
import { JWT } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/tagmanager.manage.accounts",
  "https://www.googleapis.com/auth/tagmanager.edit.containers",
  "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
  "https://www.googleapis.com/auth/tagmanager.publish",
];

/**
 * Reserved for future OAuth user-level mode. For now, static-token modes are active.
 */
export const authContext = new AsyncLocalStorage<string>();

// ── Mode 1: Service Account (preferred for external client audits) ──
// Uses a GCP service account JSON key. The service account email must be invited
// as Admin on the target GTM accounts. No token expiration.

let jwtClient: JWT | null = null;

function getServiceAccountClient(): JWT | null {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) return null;
  if (jwtClient) return jwtClient;
  const sa = JSON.parse(saJson) as { client_email: string; private_key: string };
  jwtClient = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: SCOPES,
  });
  return jwtClient;
}

// ── Mode 2: Refresh token (for internal use with a personal/Workspace account) ──

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Returns a valid Google OAuth2 access token for the Tag Manager API.
 *
 * Priority:
 *   1. Per-request Bearer token (OAuth user-level mode — future use)
 *   2. Service Account JSON (GOOGLE_SERVICE_ACCOUNT_JSON) — preferred when set
 *   3. Auto-refreshed token from GOOGLE_REFRESH_TOKEN env var
 */
export async function getAccessToken(): Promise<string> {
  const perRequestToken = authContext.getStore();
  if (perRequestToken) return perRequestToken;

  const saClient = getServiceAccountClient();
  if (saClient) {
    const { token } = await saClient.getAccessToken();
    if (!token) throw new Error("Service account failed to obtain an access token");
    return token;
  }

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      "No authentication provided. Set either GOOGLE_SERVICE_ACCOUNT_JSON (preferred), " +
        "or GOOGLE_REFRESH_TOKEN + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET env vars."
    );
  }

  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars are required when using refresh-token mode."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh Google token: ${err}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  console.error("🔑 Google access token refreshed successfully");
  return cachedAccessToken;
}
