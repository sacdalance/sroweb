import { API_BASE_URL, authFetch } from "@/lib/api-config";

export async function editActivity(activity, schedule) {
  const payload = {
    ...activity,
    ...schedule,
  };

  const response = await authFetch(`${API_BASE_URL}/activityEdit/edit/${activity.activity_id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update activity");
  }

  return await response.json();
}
