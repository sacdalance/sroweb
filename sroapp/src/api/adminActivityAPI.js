import supabase from "@/lib/supabase";
import axios from "axios";

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

export const fetchIncomingRequests = async (access_token) => {
  const res = await axios.get("/api/activities/incoming", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  return res.data;
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

  const [{ data: annualReports, error: annualError }, { data: pendingApps, error: appError }] =
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

  console.log("Counts from DB:", { approved, pending, annualReportsCount, pendingApplicationsCount });

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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error("No active session");

  const res = await fetch("/api/generate-approval-slips", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "Failed to generate approval slips");
  }

  return result;
};
