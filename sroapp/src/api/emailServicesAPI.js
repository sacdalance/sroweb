import { API_BASE_URL, authFetch } from "@/lib/api-config";
export async function sendEmailAPI({ to, subject, text, html }) {
  const response = await authFetch(`${API_BASE_URL}/api/send-email`, {
    method: 'POST',
    body: JSON.stringify({ to, subject, text, html }),
  });

  return await response.json();
}
