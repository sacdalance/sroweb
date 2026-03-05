import { API_BASE_URL, authFetch } from "@/lib/api-config";

export async function createActivity(activity, file, schedule) {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(activity).forEach(([key, value]) => {
    formData.append(key, value);
  });

  Object.entries(schedule).forEach(([key, value]) => {
    formData.append(key, value ?? '');
  });

  const response = await authFetch(`${API_BASE_URL}/activityRequest`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to submit activity');
  return result;
}
