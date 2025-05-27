// routes/adminOrgApplicationsRoutes.js
import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

router.post('/update-status', async (req, res) => {
  const { recognition_id, update } = req.body;
  if (!recognition_id || !update) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const { error } = await supabase
    .from('org_recognition')
    .update(update)
    .eq('recognition_id', recognition_id);

  if (error) {
    console.error('Supabase update error:', error);
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ success: true });
});

export default router;
