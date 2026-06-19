import supabase from "@/lib/supabase";
import { API_BASE_URL, authFetch } from "@/lib/api-config";

export const submitAdminActivity = async (activity, schedule, files) => {
  const formData = new FormData();
  if (files.conceptPaperFile) formData.append("conceptPaper", files.conceptPaperFile);
  if (files.form2bFile) formData.append("form2b", files.form2bFile);

  Object.entries(activity).forEach(([key, value]) => {
    formData.append(key, value);
  });

  Object.entries(schedule).forEach(([key, value]) => {
    formData.append(key, value ?? "");
  });

  const response = await authFetch(`${API_BASE_URL}/api/admin/activity`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Failed to submit activity.");
  return result;
};

export const fetchSummaryActivities = async (filters) => {
  const params = new URLSearchParams(filters);
  const res = await authFetch(`${API_BASE_URL}/api/activities/summary?${params.toString()}`);
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to fetch summary data.");
  return result.data ?? result;
};

export const fetchOrganizationNames = async () => {
  const res = await authFetch(`${API_BASE_URL}/api/activities/organizations`);
  if (!res.ok) throw new Error("Failed to fetch organizations.");
  return await res.json();
};

export const fetchAcademicYears = async () => {
  const res = await authFetch(`${API_BASE_URL}/api/activities/academic-years`);
  if (!res.ok) throw new Error("Failed to fetch academic years");
  return await res.json();
};

export const fetchIncomingRequests = async () => {
  const res = await authFetch(`${API_BASE_URL}/api/activities/incoming`);
  if (!res.ok) throw new Error("Failed to fetch incoming requests");
  const result = await res.json();
  return result.data ?? result;
};

export const fetchApprovedActivities = async () => {
  const { data, error } = await supabase
    .from("activity")
    .select(`*, organization:organization(*), schedule:activity_schedule(*)`)
    .eq("final_status", "Approved")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return data;
};

export const fetchOrgStats = async () => {
  const currentYear = new Date().getFullYear();

  const [{ count: annualReportsCount }, { count: pendingAppsCount }] =
    await Promise.all([
      supabase
        .from("org_annual_report")
        .select("report_id", { count: "exact", head: true })
        .ilike("academic_year", `%${currentYear}`),

      supabase
        .from("org_recognition")
        .select("recognition_id", { count: "exact", head: true })
        .eq("status", "Pending"),
    ]);

  return {
    annualReportsCount: annualReportsCount || 0,
    pendingApplicationsCount: pendingAppsCount || 0,
  };
};

export const fetchActivityCounts = async () => {
  const [{ count: approved }, { count: pending }, orgStats] = await Promise.all([
    supabase
      .from("activity")
      .select("activity_id", { count: "exact", head: true })
      .eq("final_status", "Approved"),
    supabase
      .from("activity")
      .select("activity_id", { count: "exact", head: true })
      .or("final_status.is.null,final_status.eq.For Appeal"),
    fetchOrgStats(),
  ]);

  return {
    approved: approved || 0,
    pending: pending || 0,
    annualReports: orgStats.annualReportsCount,
    pendingApplications: orgStats.pendingApplicationsCount,
  };
};

export const fetchActivityDetails = async (activityId) => {
  const { data, error } = await supabase
    .from("activity")
    .select("sdg_goals, partner_name")
    .eq("activity_id", activityId)
    .maybeSingle();
  if (error) throw error;

  return {
    sdgGoals: data?.sdg_goals || [],
    partners: data?.partner_name ? [data.partner_name] : [],
  };
};

export const generateApprovalSlips = async () => {
  const res = await authFetch(`${API_BASE_URL}/api/generate-approval-slips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to generate approval slips");
  return result;
};

/**
 * Download the approval slip PDF for a single approved activity.
 * Generated on-demand by the backend (Puppeteer) and streamed straight
 * to the browser as a file download — no Google Drive involved.
 */
export const downloadApprovalSlip = async (activityId, activityName = "Activity") => {
  const res = await authFetch(`${API_BASE_URL}/api/approval-slip/${activityId}/pdf`);

  if (!res.ok) {
    let message = "Failed to generate approval slip";
    try {
      const err = await res.json();
      message = err.error || message;
    } catch { /* response wasn't JSON */ }
    throw new Error(message);
  }

  const blob = await res.blob();
  const safeName = String(activityName).replace(/[^a-z0-9]+/gi, "_").slice(0, 60);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Approval_Slip_${safeName}_${activityId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
