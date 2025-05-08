import express from "express";
import { supabase } from "../supabaseClient.js";
import { verifyAdminRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/incoming", verifyAdminRoles, async (req, res) => {
  const { data, error } = await supabase
    .from("activity")
    .select(`
      *,
      account:account (*),
      organization:organization (*),
      schedule:activity_schedule (*)
    `)
    .or("final_status.is.null,final_status.neq.Approved")
    .order("activity_id", { ascending: false });

  if (error) {
    console.error("Error fetching incoming:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
});

// Summary of Activities
router.get("/summary", verifyAdminRoles, async (req, res) => {
  const { activity_type, status, organization, year, month } = req.query;

  let query = supabase
    .from("activity")
    .select(`*, account:account (*), organization:organization (*), schedule:activity_schedule (*)`)
    .order("created_at", { ascending: false });

    if (activity_type && activity_type !== "all") {
      query = query.ilike("activity_type", `%${activity_type}%`);
    }

  if (status && status !== "all") {
    query = query.eq("final_status", status);
  }

  if (organization && organization !== "All Organizations") {
    query = query.eq("organization.org_name", organization);
  }

  if (year && year !== "All Academic Years") {
    const [start, end] = year.split("-");
    query = query.gte("schedule.start_date", `${start}-06-01`);
    query = query.lte("schedule.end_date", `${end}-05-31`);
  }

  if (month && month !== "All Months") {
    const monthIndex = new Date(`${month} 1, 2000`).getMonth() + 1;
    query = query.filter("EXTRACT(MONTH FROM schedule.start_date)", "eq", monthIndex);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching summary activities:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
});


export default router;