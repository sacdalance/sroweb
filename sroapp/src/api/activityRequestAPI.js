const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function createActivity(activity) {
  const response = await fetch(`${BASE_URL}/activityRequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activity),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to submit activity');
  return result;
}