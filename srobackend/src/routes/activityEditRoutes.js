import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

router.put('/edit/:activity_id', async (req, res) => {
  const { activity_id } = req.params;
  const body = req.body;

  const updatePayload = {
    account_id: body.account_id,
    org_id: body.org_id,
    student_position: body.student_position,
    student_contact: body.student_contact,
    activity_name: body.activity_name,
    activity_description: body.activity_description,
    activity_type: body.activity_type,
    sdg_goals: body.sdg_goals,
    charge_fee: body.charge_fee === 'true',
    university_partner: body.university_partner === 'true',
    partner_name: body.partner_name,
    partner_role: body.partner_role,
    venue: body.venue,
    venue_approver: body.venue_approver,
    venue_approver_contact: body.venue_approver_contact,
    is_off_campus: body.is_off_campus === 'true',
    green_monitor_name: body.green_monitor_name,
    green_monitor_contact: body.green_monitor_contact,
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
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: "Activity updated for appeal." });
});

export default router;
