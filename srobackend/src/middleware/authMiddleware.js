// middleware/authMiddleware.js
import { supabase } from '../supabaseClient.js';
import express from 'express';

const router = express.Router();

const authCache = new Map();
const pendingAuth = new Map(); // Coalesce concurrent cache misses for the same token
const AUTH_CACHE_TTL = 60000; // 1 minute

// Clean up expired entries every 2 minutes (aligned closer to TTL)
const cacheCleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of authCache) {
    if (now - value.timestamp > AUTH_CACHE_TTL) {
      authCache.delete(key);
    }
  }
}, 2 * 60 * 1000);
cacheCleanup.unref();

// Shared function to resolve auth for a token, coalescing concurrent requests
async function resolveAuth(token) {
  // Check cache first
  const cached = authCache.get(token);
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL) {
    return cached;
  }

  // Coalesce: if another request is already resolving this token, wait for it
  if (pendingAuth.has(token)) {
    return pendingAuth.get(token);
  }

  const promise = (async () => {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const { data: account } = await supabase
      .from("account")
      .select("account_id, role_id, email")
      .eq("email", user.email)
      .single();

    const entry = { user, account: account || null, timestamp: Date.now() };
    authCache.set(token, entry);
    return entry;
  })().finally(() => {
    pendingAuth.delete(token);
  });

  pendingAuth.set(token, promise);
  return promise;
}

/**
 * Verifies the user is authenticated via Supabase JWT.
 * Sets req.user (Supabase user) and req.account (account_id, role_id, email).
 */
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const result = await resolveAuth(token);
    if (!result) return res.status(401).json({ error: 'Invalid or expired token' });

    req.user = result.user;
    req.account = result.account;
    next();
  } catch (err) {
    console.error("Auth error:", err.message || err);
    return res.status(503).json({ error: 'Authentication service unavailable.' });
  }
};

/**
 * Verifies the user has an admin role (SRO=2, ODSA=3, SuperAdmin=4, Adviser=5).
 * Must be used after authMiddleware or standalone (it authenticates too).
 */
export const verifyAdminRoles = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const result = await resolveAuth(token);
    if (!result) return res.status(401).json({ error: 'Invalid or expired token' });

    if (!result.account || ![2, 3, 4, 5].includes(result.account.role_id)) {
      return res.status(403).json({ error: "Forbidden: Admin roles only" });
    }

    req.user = result.user;
    req.account = result.account;
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
    const result = await resolveAuth(token);
    if (!result) return res.status(401).json({ error: 'Invalid or expired token' });

    if (!result.account || result.account.role_id !== 4) {
      return res.status(403).json({ error: "Forbidden: SuperAdmin only" });
    }

    req.user = result.user;
    req.account = result.account;
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
  if ([2, 3, 4, 5].includes(req.account.role_id)) return next();

  if (req.account.account_id !== paramId) {
    return res.status(403).json({ error: 'Forbidden: You can only access your own data' });
  }
  next();
};

router.get('/test', authMiddleware, (req, res) => {
    res.json({ message: 'Auth middleware works!', user: req.user });
});
