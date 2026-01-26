import { API_BASE_URL } from "@/lib/api-config";
export async function sendEmailAPI({ to, subject, text, html }) {
  const response = await fetch(`${API_BASE_URL}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, text, html }),
  });

  return await response.json();
}
