import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Reserved for future OAuth user-level mode. For now, static-token mode is active.
 */
export const authContext = new AsyncLocalStorage<string>();

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Returns a valid Google OAuth2 access token for the Tag Manager API.
 *
 * Priority:
 *   1. Per-request Bearer token (OAuth user-level mode — future use)
 *   2. Auto-refreshed access token derived from GOOGLE_REFRESH_TOKEN env vars
 */
export async function getAccessToken(): Promise<string> {
  const perRequestToken = authContext.getStore();
  if (perRequestToken) return perRequestToken;

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      "No authentication provided. Set GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET env vars."
    );
  }

  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars are required.");
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
