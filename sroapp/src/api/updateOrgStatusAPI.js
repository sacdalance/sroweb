// src/api/updateOrgStatus.js
import { API_BASE_URL, authFetch } from "@/lib/api-config";

export async function updateOrgStatus(recognition_id, update) {
  const res = await authFetch(`${API_BASE_URL}/api/org-applications/update-status`, {
    method: "POST",
    body: JSON.stringify({ recognition_id, update }),
  });
  if (!res.ok) {
    let error = "Failed to update org status";
    try {
      const data = await res.json();
      error = data.error || error;
    } catch { }
    throw new Error(error);
  }
  return await res.json();
}
