import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Route to check or insert user into 'account' table
router.post('/check-or-create', async (req, res) => {
  const { email, name } = req.body;

  if (!email.endsWith('@up.edu.ph')) {
    return res.status(403).json({ message: 'Email must be a UP Mail' });
  }

  try {
    const { data: existingUser } = await supabase
      .from('account')
      .select('account_id, role_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Check if user should be upgraded to adviser (role_id 5)
      if (existingUser.role_id === 1) {
        const { data: adviserOrgs, error: adviserErr } = await supabase
          .from('organization')
          .select('org_id')
          .eq('adviser_email', email);

        if (adviserErr) console.error('Adviser org lookup error:', adviserErr);

        if (adviserOrgs && adviserOrgs.length > 0) {
          const { error: updateErr } = await supabase
            .from('account')
            .update({ role_id: 5 })
            .eq('account_id', existingUser.account_id);
          if (updateErr) console.error('Role upgrade error:', updateErr);
          return res.status(200).json({ message: 'User upgraded to adviser' });
        }
      }
      return res.status(200).json({ message: 'User already exists' });
    }

    // Check if new user's email matches an org adviser
    const { data: adviserOrgs } = await supabase
      .from('organization')
      .select('org_id')
      .eq('adviser_email', email);

    const assignedRole = (adviserOrgs && adviserOrgs.length > 0) ? 5 : 1;

    const { error } = await supabase.from('account').upsert(
      {
        account_name: name,
        email,
        role_id: assignedRole,
      },
      { onConflict: 'email', ignoreDuplicates: true }
    );

    if (error) throw error;

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ authenticated: false });

  res.json({ authenticated: true, user });
});

export default router;
