import express from "express";
import { supabase } from "../supabaseClient.js";
import { verifyAdminRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/incoming", verifyAdminRoles, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("activity")
    .select(`
      *,
      account:account (*),
      organization:organization (*),
      schedule:activity_schedule!activity_schedule_activity_id_fkey (start_date)
    `, { count: "exact" })
    .or("final_status.is.null,final_status.neq.Approved")
    .order("activity_id", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching incoming:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data, total: count, page, limit });
});

// Summary of Activities
router.get("/summary", verifyAdminRoles, async (req, res) => {
  const { activity_type, status, organization, year, month } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("activity")
    .select(`
      *,
      account:account (*),
      organization:organization (*),
      schedule:activity_schedule (*)
    `, { count: "exact" })
    .order("created_at", { ascending: false });

    if (activity_type && activity_type !== "all") {
      query = query.ilike("activity_type", `%${activity_type}%`);
    }

    if (status === "pending") {
      query = query.or("final_status.eq.For Appeal,final_status.is.null");
    } else if (status && status !== "all") {
      query = query.eq("final_status", status);
    }

  if (organization && organization !== "All Organizations") {
    query = query.eq("organization.org_name", organization);
  }

  // if (year && year !== "All Academic Years") {
  //   const [start, end] = year.split("-");
  //   query = query.gte("schedule.start_date", `${start}-06-01`);
  //   query = query.lte("schedule.end_date", `${end}-05-31`);
  // }

  // if (month && month !== "All Months") {
  //   const monthIndex = new Date(`${month} 1, 2000`).getMonth() + 1; // January = 1
  
  //   // Convert to 2-digit format (e.g. "01", "05", "12")
  //   const paddedMonth = String(monthIndex).padStart(2, "0");
  
  //   // Use LIKE operator to match YYYY-MM-% (e.g. 2025-05-%)
  //   query = query.filter("schedule.start_date::text", "like", `%-${paddedMonth}-%`);
  // }

  query = query.range(from, to);
  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching summary activities:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data, total: count, page, limit });
});

router.get("/organizations", verifyAdminRoles, async (req, res) => {
  const { data, error } = await supabase
    .from("organization")
    .select("org_name")
    .order("org_name", { ascending: true })
    .limit(500);

  if (error) return res.status(500).json({ error: error.message });
  const names = data.map((org) => org.org_name);
  res.status(200).json(names);
});

router.get("/academic-years", verifyAdminRoles, async (req, res) => {
  const { data, error } = await supabase
    .from("activity_schedule")
    .select("start_date")
    .order("start_date", { ascending: false })
    .limit(1000);

  if (error) return res.status(500).json({ error: error.message });

  const yearsSet = new Set();

  data.forEach((item) => {
    const year = new Date(item.start_date).getFullYear();
    yearsSet.add(year);
  });

  const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
  const academicYears = sortedYears.map((year) => `${year}-${year + 1}`);

  res.json(["All Academic Years", ...academicYears]);
});

export default router;