import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router();

const toBool = (val) => val === true || val === 'true';

router.put('/edit/:activity_id', authMiddleware, async (req, res) => {
  const { activity_id } = req.params;
  const body = req.body;

  // Update activity fields
  const updatePayload = {
    account_id: body.account_id,
    org_id: body.org_id,
    student_position: body.student_position,
    student_contact: body.student_contact,
    activity_name: body.activity_name,
    activity_description: body.activity_description,
    activity_type: body.activity_type,
    sdg_goals: body.sdg_goals,
    charge_fee: toBool(body.charge_fee),
    university_partner: toBool(body.university_partner),
    partner_name: body.partner_name,
    partner_role: body.partner_role,
    venue: body.venue,
    venue_approver: body.venue_approver,
    venue_approver_contact: body.venue_approver_contact,
    is_off_campus: toBool(body.is_off_campus),
    green_monitor_name: body.green_monitor_name,
    green_monitor_contact: body.green_monitor_contact,
    has_outside_visitors: toBool(body.has_outside_visitors),
    appeal_reason: body.appeal_reason,
    final_status: "For Appeal",
    sro_remarks: null,
    odsa_remarks: null,
    sro_approval_status: null,
    odsa_approval_status: null,
  };

  const { error } = await supabase
    .from('activity')
    .update(updatePayload)
    .eq('activity_id', activity_id);

  if (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: "Failed to update activity." });
  }

  // Update schedule if provided
  if (body.start_date) {
    const { error: scheduleError } = await supabase
      .from('activity_schedule')
      .update({
        is_recurring: body.is_recurring || 'one-time',
        start_date: body.start_date,
        end_date: body.end_date || null,
        start_time: body.start_time,
        end_time: body.end_time,
        recurring_days: body.recurring_days || null,
      })
      .eq('activity_id', activity_id);

    if (scheduleError) {
      console.error("Schedule update error:", scheduleError);
      return res.status(500).json({ error: "Activity updated but schedule update failed. Please try again." });
    }
  }

  return res.status(200).json({ message: "Activity updated for appeal." });
});

export default router;
