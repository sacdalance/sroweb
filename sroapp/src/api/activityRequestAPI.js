const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function createActivity(activity, file) {
  const formData = new FormData();
  formData.append('file', file);
  Object.keys(activity).forEach(key => {
    formData.append(key, activity[key]);
  });

  const response = await fetch(`${BASE_URL}/activityRequest`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to submit activity');
  return result;
}
