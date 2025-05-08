import supabase from "@/lib/supabase";

export const submitAdminActivity = async (activity, schedule, file) => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("No active session. Please log in again.");
  }

  const formData = new FormData();
  formData.append("file", file);

  Object.entries(activity).forEach(([key, value]) => {
    formData.append(key, value);
  });

  Object.entries(schedule).forEach(([key, value]) => {
    formData.append(key, value ?? "");
  });

  const response = await fetch("/api/admin/activity", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to submit activity.");
  }

  return result;
};

// Summary of Activities

export const fetchSummaryActivities = async (filters) => {
  const { data: { session } } = await supabase.auth.getSession();

  const params = new URLSearchParams(filters);
  const res = await fetch(`/api/activities/summary?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to fetch summary data.");

  return result;
};

export const fetchOrganizationNames = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch("/api/activities/organizations", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch organizations.");
  return await res.json();
};

export const fetchAcademicYears = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch("/api/activities/academic-years", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch academic years");
  return await res.json();
};