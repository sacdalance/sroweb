import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router();

router.put('/cancel/:activity_id', authMiddleware, async (req, res) => {
  const { activity_id } = req.params;
  const { appeal_reason } = req.body;

  if (!appeal_reason) {
    return res.status(400).json({ error: 'Cancellation reason is required' });
  }

  const { data: activity, error: fetchError } = await supabase
    .from('activity')
    .select('account_id')
    .eq('activity_id', activity_id)
    .single();

  if (fetchError || !activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  const isAdmin = [2, 3, 4, 5].includes(req.account?.role_id);
  if (!isAdmin && activity.account_id !== req.account?.account_id) {
    return res.status(403).json({ error: 'Forbidden: You can only cancel your own activities' });
  }

  const updatePayload = {
    appeal_reason,
    final_status: "For Cancellation",
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

  return res.status(200).json({ message: "Activity marked for cancellation." });
});

export default router; 