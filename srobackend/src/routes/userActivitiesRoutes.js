import express from "express";
import { supabase } from '../supabaseClient.js';

const router = express.Router();

/**
 * GET /api/activities/user/:account_id
 * Returns all activities submitted by a specific user
 */
router.get("/user/:account_id", async (req, res) => {
  const { account_id } = req.params;

  const { data, error } = await supabase
    .from("activity")
    .select(`
      *,
      account:account (*),
      organization:organization (*),
      schedule:activity_schedule (*)
    `)
    .eq("account_id", account_id)
    .order("activity_id", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;
