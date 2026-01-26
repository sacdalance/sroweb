import { API_BASE_URL } from "@/lib/api-config";

export async function editActivity(activity, schedule) {
  const payload = {
    ...activity,
    ...schedule,
  };

  const response = await fetch(`${API_BASE_URL}/activityEdit/edit/${activity.activity_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update activity");
  }

  return await response.json();
}
