import supabase from "@/lib/supabase";

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

function buildNetworkErrorMessage(isUploadRequest) {
  if (isUploadRequest) {
    return "Upload failed. Please retry on stable Wi-Fi or use smaller PDF files.";
  }
  return "Network request failed. Please check your connection and try again.";
}

// Cache the access token at module level to avoid calling getSession() on every request
let cachedAccessToken = null;

// Resolve once the first auth state (including INITIAL_SESSION on page load) is known.
// Avoids a separate getSession() call, which can contend with other callers for the
// browser's navigator.locks session lock and hang indefinitely in some environments.
let resolveInit;
let initPromise = new Promise((resolve) => { resolveInit = resolve; });

supabase.auth.onAuthStateChange((_event, session) => {
  cachedAccessToken = session?.access_token || null;
  if (resolveInit) {
    resolveInit();
    resolveInit = null;
  }
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

  try {
    return await fetch(url, { ...options, headers });
  } catch (error) {
    const isUploadRequest = options.body instanceof FormData;
    const wrappedError = new Error(buildNetworkErrorMessage(isUploadRequest));
    wrappedError.name = error?.name || "NetworkError";
    wrappedError.cause = error;
    throw wrappedError;
  }
}
