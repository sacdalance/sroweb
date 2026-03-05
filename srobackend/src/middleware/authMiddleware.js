// middleware/authMiddleware.js
import { supabase } from '../supabaseClient.js';
import express from 'express';

const router = express.Router();

/**
 * Verifies the user is authenticated via Supabase JWT.
 * Sets req.user (Supabase user) and req.account (account_id, role_id, email).
 */
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    // Attach account info for downstream use
    const { data: account } = await supabase
      .from("account")
      .select("account_id, role_id, email")
      .eq("email", user.email)
      .single();

    req.user = user;
    req.account = account || null;
    next();
  } catch (err) {
    console.error("Auth error:", err.message || err);
    return res.status(503).json({ error: 'Authentication service unavailable.' });
  }
};

/**
 * Verifies the user has an admin role (SRO=2, ODSA=3, SuperAdmin=4).
 * Must be used after authMiddleware or standalone (it authenticates too).
 */
export const verifyAdminRoles = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    const { data: account, error: accountError } = await supabase
      .from("account")
      .select("account_id, role_id, email")
      .eq("email", user.email)
      .single();

    if (accountError || !account || ![2, 3, 4].includes(account.role_id)) {
      return res.status(403).json({ error: "Forbidden: Admin roles only" });
    }

    req.user = user;
    req.account = account;
    next();
  } catch (err) {
    console.error("Admin role check error:", err.message || err);
    return res.status(503).json({ error: 'Authorization service unavailable.' });
  }
};

/**
 * Verifies the user is a superadmin (role_id=4).
 */
export const verifySuperAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    const { data: account } = await supabase
      .from("account")
      .select("account_id, role_id, email")
      .eq("email", user.email)
      .single();

    if (!account || account.role_id !== 4) {
      return res.status(403).json({ error: "Forbidden: SuperAdmin only" });
    }

    req.user = user;
    req.account = account;
    next();
  } catch (err) {
    console.error("SuperAdmin check error:", err.message || err);
    return res.status(503).json({ error: 'Authorization service unavailable.' });
  }
};

/**
 * Verifies that the authenticated user owns the resource (account_id matches).
 * Expects req.account to be set (use after authMiddleware).
 * Checks req.params.account_id or req.body.account_id.
 */
export const verifyOwnership = (req, res, next) => {
  const paramId = parseInt(req.params.account_id || req.body.account_id);
  if (!req.account) return res.status(401).json({ error: 'Not authenticated' });

  // Admins bypass ownership checks
  if ([2, 3, 4].includes(req.account.role_id)) return next();

  if (req.account.account_id !== paramId) {
    return res.status(403).json({ error: 'Forbidden: You can only access your own data' });
  }
  next();
};

router.get('/test', authMiddleware, (req, res) => {
    res.json({ message: 'Auth middleware works!', user: req.user });
});
