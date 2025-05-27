// src/api/updateOrgStatus.js
export async function updateOrgStatus(recognition_id, update) {
  const res = await fetch("/api/org-applications/update-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recognition_id, update }),
  });
  if (!res.ok) {
    let error = "Failed to update org status";
    try {
      const data = await res.json();
      error = data.error || error;
    } catch {}
    throw new Error(error);
  }
  return await res.json();
}
