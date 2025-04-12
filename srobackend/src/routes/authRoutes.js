// routes/authRoutes.js
import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Endpoint to verify user session (optional but useful)
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ authenticated: false });

  res.json({ authenticated: true, user });
});

export default router;
