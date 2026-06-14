/**
 * In-memory access-token store.
 *
 * Why in-memory and not localStorage:
 *   - localStorage is readable by any JS on the page, so an XSS payload
 *     can steal the token. Keeping it in a closure variable means the
 *     attacker has to land code that runs *and* fires while the tab is open.
 *   - The refresh token lives in an httpOnly cookie set by the backend.
 *     The browser sends it automatically on credentialed requests;
 *     JavaScript can never see it.
 *
 * Tab reload note: the access token is intentionally lost on reload.
 * Pages call `bootstrapAccessToken()` once on mount, which hits
 * /api/token/refresh/ (with credentials) and silently re-mints one
 * from the refresh cookie. If that fails the user is logged out.
 */
"use client";

import axios from "axios";

let accessToken = null;
let bootstrapPromise = null;

// Normalize so callers can safely concat `${BASE_URL}api/...` regardless of
// whether the env var has a trailing slash.
const BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_PORT || "http://localhost:8000"
).replace(/\/+$/, "") + "/";

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
}

export function isAuthenticated() {
  return Boolean(accessToken);
}

/**
 * Try to mint a fresh access token from the httpOnly refresh cookie.
 * Returns the access token on success, null on failure (i.e. logged out).
 * Safe to call multiple times concurrently - dedupes in-flight calls.
 */
export function bootstrapAccessToken() {
  if (accessToken) return Promise.resolve(accessToken);
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = axios
    .post(`${BASE_URL}api/token/refresh/`, null, { withCredentials: true })
    .then((res) => {
      accessToken = res.data?.access || null;
      return accessToken;
    })
    .catch(() => {
      accessToken = null;
      return null;
    })
    .finally(() => {
      bootstrapPromise = null;
    });

  return bootstrapPromise;
}

/** Fire-and-forget server-side cookie clear. Always clears local state. */
export async function logout() {
  try {
    await axios.post(`${BASE_URL}api/auth/logout/`, null, {
      withCredentials: true,
    });
  } catch {
    // Swallow - we still want local state cleared even if the request fails.
  }
  clearAccessToken();
}
