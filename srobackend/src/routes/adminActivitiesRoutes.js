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

export default router;