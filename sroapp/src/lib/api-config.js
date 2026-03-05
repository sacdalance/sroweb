import supabase from "@/lib/supabase";

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

/**
 * Authenticated fetch wrapper. Automatically attaches the Supabase JWT.
 * Use this instead of raw fetch() for all backend API calls.
 */
export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${session.access_token}`,
  };

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  return fetch(url, { ...options, headers });
}
