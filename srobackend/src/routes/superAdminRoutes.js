import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

const VALID_ROLE_IDS = [1, 2, 3, 4, 5];

// Mirrors sroapp/src/lib/permissions.js - keep in sync.
// Checked by email (not role_id) so these accounts can always switch their
// role back even after switching away from role_id 4 via this same endpoint.
const SUPERADMIN_EMAILS = [
  "clpagunsan@up.edu.ph",
  "dvnisay1@up.edu.ph",
  "mmlarua@up.edu.ph",
  "ltcuadra@up.edu.ph",
  "lssacdalan@up.edu.ph",
  "faaquino@up.edu.ph",
];

// Lets a superadmin switch their own account's role (testing utility).
router.put('/role', authMiddleware, async (req, res) => {
  if (!SUPERADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: 'Forbidden: SuperAdmin only' });
  }

  const { role_id } = req.body;

  if (!VALID_ROLE_IDS.includes(role_id)) {
    return res.status(400).json({ error: 'Invalid role_id' });
  }

  const { error } = await supabase
    .from('account')
    .update({ role_id })
    .eq('account_id', req.account.account_id);

  if (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }

  res.json({ success: true });
});

export default router;
