import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

router.get('/list', async (req, res) => {
  const { data, error } = await supabase
    .from('organization')
    .select('org_id, org_name, org_email, adviser_name, adviser_email');

  if (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ error: 'Failed to fetch organizations' });
  }

  res.json(data);
});

export default router;
