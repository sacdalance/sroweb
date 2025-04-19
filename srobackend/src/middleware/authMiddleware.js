// middleware/authMiddleware.js
import { supabase } from '../supabaseClient.js';
import express from 'express';

const router = express.Router();

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw error;

    req.user = user;
    next();
  } catch (err) {
    console.error("Supabase Auth Error:", err.message || err);
    return res.status(503).json({ error: 'Authentication service unavailable. Please try again later.' });
  }
};

export const verifyAdminRoles = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw error;

    const { data: account, error: accountError } = await supabase
      .from("account")
      .select("role_id")
      .eq("email", user.email)
      .single();

    if (accountError || !account || ![2, 3, 4].includes(account.role_id)) {
      return res.status(403).json({ error: "Forbidden: Admin roles only" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Supabase Admin Role Check Error:", err.message || err);
    return res.status(503).json({ error: 'Authorization service unavailable. Please try again later.' });
  }
};

router.get('/test', authMiddleware, (req, res) => {
    res.json({ message: 'Auth middleware works!', user: req.user });
});
