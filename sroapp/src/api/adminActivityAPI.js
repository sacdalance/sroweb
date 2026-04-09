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
  return result;
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
  return await res.json();
};

export const fetchApprovedActivities = async () => {
  const { data, error } = await supabase
    .from("activity")
    .select(`*, organization:organization(*), schedule:activity_schedule(*)`)
    .eq("final_status", "Approved");

  if (error) throw error;
  return data;
};

export const fetchOrgStats = async () => {
  const currentYear = new Date().getFullYear();

  const [{ data: annualReports }, { data: pendingApps }] =
    await Promise.all([
      supabase
        .from("org_annual_report")
        .select("*")
        .ilike("academic_year", `%${currentYear}`),

      supabase
        .from("org_recognition")
        .select("*")
        .eq("status", "Pending"),
    ]);

  return {
    annualReportsCount: Array.isArray(annualReports) ? annualReports.length : 0,
    pendingApplicationsCount: Array.isArray(pendingApps) ? pendingApps.length : 0,
  };
};

export const fetchActivityCounts = async () => {
  const { data, error } = await supabase.from("activity").select("final_status");

  if (error) throw error;

  let approved = 0;
  let pending = 0;

  data.forEach(({ final_status }) => {
    if (final_status === "Approved") {
      approved++;
    } else if (final_status === null || final_status === "For Appeal") {
      pending++;
    }
  });

  const { annualReportsCount, pendingApplicationsCount } = await fetchOrgStats();

  return {
    approved,
    pending,
    annualReports: annualReportsCount,
    pendingApplications: pendingApplicationsCount
  };
};

export const fetchActivityDetails = async (activityId) => {
  const { data: sdgData, error: sdgErr } = await supabase
    .from("activity")
    .select("sdg_goals")
    .eq("activity_id", activityId);
  if (sdgErr) throw sdgErr;

  const { data: partnerData, error: partnerErr } = await supabase
    .from("activity")
    .select("partner_name")
    .eq("activity_id", activityId);
  if (partnerErr) throw partnerErr;

  return {
    sdgGoals: sdgData.map((g) => g.goal_name),
    partners: partnerData.map((p) => p.partner_name),
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
