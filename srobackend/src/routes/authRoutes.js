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
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(200).json({ message: 'User already exists' });
    }

    const { error } = await supabase.from('account').insert([
      {
        account_name: name,
        email,
        role_id: 1, // role_id 1 for student/basic user
      },
    ]);

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
