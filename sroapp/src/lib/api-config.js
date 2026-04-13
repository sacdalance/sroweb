import supabase from "@/lib/supabase";

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

// Cache the access token at module level to avoid calling getSession() on every request
let cachedAccessToken = null;

// Initialize: get current session token
supabase.auth.getSession().then(({ data: { session } }) => {
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
    // Fallback: try getSession once if cache is empty (e.g., race on first load)
    const { data: { session } } = await supabase.auth.getSession();
    cachedAccessToken = session?.access_token || null;
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
