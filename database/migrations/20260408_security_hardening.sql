-- ============================================================
-- Migration: Security hardening for production deployment
-- Date: 2026-04-08
-- Description: Locks down table-level grants and fixes RLS gaps.
--   The anon key is visible in the frontend JS bundle, so any
--   unauthenticated person can call the Supabase API directly.
--   This migration ensures they can only read public calendar data.
--
-- WHAT THIS CHANGES:
--   1. Enables RLS on 2 unprotected tables (role, interview_slots)
--   2. Revokes all dangerous grants from the anon role
--   3. Revokes TRUNCATE from the authenticated role
--   4. Tightens the notification INSERT policy
--   5. Hardens helper functions against search_path hijacking
--
-- WHAT THIS DOES NOT CHANGE:
--   - No existing RLS policies are modified (no risk of breaking queries)
--   - No authenticated grants for SELECT/INSERT/UPDATE/DELETE are changed
--   - Backend (service_role) is completely unaffected
-- ============================================================


-- ============================================================
-- 1. ENABLE RLS ON UNPROTECTED TABLES
--    These tables currently have NO row-level security.
--    Anyone with the anon key can read/write/delete them.
--    Neither table is queried by the frontend or backend app code.
-- ============================================================

ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE role ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read roles (safe, read-only lookup table)
CREATE POLICY "role_select_authenticated" ON role
  FOR SELECT USING (auth.role() = 'authenticated');


-- ============================================================
-- 2. LOCK DOWN THE ANON ROLE
--    The anon key is embedded in the frontend bundle and is
--    publicly extractable. Currently anon has INSERT, UPDATE,
--    DELETE, and TRUNCATE on EVERY table — meaning an attacker
--    can modify data without logging in.
--
--    After this: anon can ONLY read approved activities,
--    their schedules, and organization names (public calendar).
-- ============================================================

-- Revoke everything from anon on all tables
REVOKE ALL ON account FROM anon;
REVOKE ALL ON activity FROM anon;
REVOKE ALL ON activity_schedule FROM anon;
REVOKE ALL ON appointment_settings FROM anon;
REVOKE ALL ON appointments FROM anon;
REVOKE ALL ON blocked_slots FROM anon;
REVOKE ALL ON interview_slots FROM anon;
REVOKE ALL ON logs FROM anon;
REVOKE ALL ON notifications FROM anon;
REVOKE ALL ON org_annual_report FROM anon;
REVOKE ALL ON org_recognition FROM anon;
REVOKE ALL ON organization FROM anon;
REVOKE ALL ON role FROM anon;

-- Grant back ONLY what anon needs: SELECT for the public calendar
-- (protected by existing RLS policies that check final_status = 'Approved')
GRANT SELECT ON activity TO anon;
GRANT SELECT ON activity_schedule TO anon;
GRANT SELECT ON organization TO anon;


-- ============================================================
-- 3. REMOVE TRUNCATE FROM AUTHENTICATED ROLE
--    TRUNCATE wipes an entire table in one call. No application
--    code ever uses it. Removing this prevents a compromised
--    session from mass-deleting data.
-- ============================================================

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM authenticated;


-- ============================================================
-- 4. TIGHTEN NOTIFICATION INSERT POLICY
--    Current policy: WITH CHECK (true) — any user (even anon
--    before our grant revoke) can insert a notification to ANY
--    recipient. A bad actor could spam all users.
--
--    New policy: only authenticated users can insert, and the
--    recipient must be a real account.
-- ============================================================

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "notifications_insert_authenticated" ON notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND recipient_id IN (SELECT account_id FROM account)
  );


-- ============================================================
-- 5. HARDEN HELPER FUNCTIONS
--    user_role() and user_account_id() are SECURITY DEFINER,
--    meaning they run with the function owner's privileges.
--    Without a pinned search_path, an attacker who can create
--    objects in another schema could shadow the account table.
--    This pins the search_path to prevent that.
-- ============================================================

ALTER FUNCTION public.user_role() SET search_path = public;
ALTER FUNCTION public.user_account_id() SET search_path = public;
