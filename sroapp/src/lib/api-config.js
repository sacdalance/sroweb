import supabase from "@/lib/supabase";

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

// Cache the access token at module level to avoid calling getSession() on every request
let cachedAccessToken = null;

// Single shared promise for initial session fetch — prevents concurrent getSession() calls
let initPromise = supabase.auth.getSession().then(({ data: { session } }) => {
  cachedAccessToken = session?.access_token || null;
});

// Keep token in sync on auth state changes (login, token refresh, logout)
supabase.auth.onAuthStateChange((_event, session) => {
  cachedAccessToken = session?.access_token || null;
});

/**
 * Authenticated fetch wrapper. Automatically attaches the Supabase JWT.
 * Use this instead of raw fetch() for all backend API calls.
 */
export async function authFetch(url, options = {}) {
  if (!cachedAccessToken) {
    // Wait for the initial session fetch to complete (safe against concurrent calls)
    await initPromise;
  }
  if (!cachedAccessToken) {
    throw new Error("Not authenticated");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${cachedAccessToken}`,
  };

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  return fetch(url, { ...options, headers });
}
