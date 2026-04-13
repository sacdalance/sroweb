import express from "express";
import { supabase } from '../supabaseClient.js';
import { authMiddleware, verifyOwnership } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /activities/user/:account_id
 * Returns all activities submitted by a specific user
 */
router.get("/user/:account_id", authMiddleware, verifyOwnership, async (req, res) => {
  const { account_id } = req.params;

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
      schedule:activity_schedule (*)
    `, { count: "exact" })
    .eq("account_id", account_id)
    .order("activity_id", { ascending: false })
    .range(from, to);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ data, total: count, page, limit });
});

export default router;
