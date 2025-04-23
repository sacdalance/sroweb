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
      activity_id,
      account_id,
      org_id,
      student_position,
      student_contact,
      activity_name,
      activity_description,
      sdg_goals,
      charge_fee,
      university_partner,
      partner_name,
      partner_role,
      venue,
      venue_approver,
      venue_approver_contact,
      is_off_campus,
      green_monitor_name,
      green_monitor_contact,
      sro_approval_status,
      odsa_approval_status,
      final_status,
      sro_remarks,
      odsa_remarks,
      activity_type,
      drive_folder_link,
      appeal_reason,
      account:account (account_name),
      organization:organization (
        org_name,
        adviser_name,
        adviser_email
      ),
      schedule:activity_schedule (
        start_date,
        end_date,
        start_time,
        end_time,
        recurring_days,
        is_recurring
      ),
      created_at
    `)
    .eq("account_id", account_id)
    .order("activity_id", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;
