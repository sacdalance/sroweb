import { API_BASE_URL, authFetch } from "@/lib/api-config";

export async function createActivity(activity, files, schedule) {
  const formData = new FormData();
  if (files.conceptPaperFile) formData.append('conceptPaper', files.conceptPaperFile);
  if (files.form2bFile) formData.append('form2b', files.form2bFile);

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
