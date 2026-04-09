-- ============================================================
-- Migration: Add Adviser role (role_id=5) to RLS policies
-- Date: 2026-03-15
-- Description: Updates all RLS policies that check for admin roles
--   to include the new Adviser role (role_id=5).
--   Adviser gets read access to activities, schedules, accounts,
--   and update access to activities (for endorsing/rejecting).
-- ============================================================

-- 1. ACCOUNT TABLE - Allow advisers to read all accounts (needed for joins)
DROP POLICY IF EXISTS "account_select_admin" ON account;
CREATE POLICY "account_select_admin" ON account
  FOR SELECT USING (public.user_role() IN (2, 3, 4, 5));

-- 2. ACTIVITY TABLE - Allow advisers to read and update activities
DROP POLICY IF EXISTS "activity_select_admin" ON activity;
CREATE POLICY "activity_select_admin" ON activity
  FOR SELECT USING (public.user_role() IN (2, 3, 4, 5));

DROP POLICY IF EXISTS "activity_update_admin" ON activity;
CREATE POLICY "activity_update_admin" ON activity
  FOR UPDATE USING (public.user_role() IN (2, 3, 4, 5));

-- 3. ACTIVITY_SCHEDULE TABLE - Allow advisers to read schedules
DROP POLICY IF EXISTS "schedule_select_admin" ON activity_schedule;
CREATE POLICY "schedule_select_admin" ON activity_schedule
  FOR SELECT USING (public.user_role() IN (2, 3, 4, 5));

-- 4. ORGANIZATION TABLE - Already uses auth.role() = 'authenticated' for SELECT, no change needed

-- 5. NOTIFICATIONS TABLE - Allow advisers to read/insert notifications
--    (if policies exist that restrict to admin roles, update them)

-- 6. LOGS TABLE - Allow advisers to read logs
DROP POLICY IF EXISTS "logs_select_admin" ON logs;
CREATE POLICY "logs_select_admin" ON logs
  FOR SELECT USING (public.user_role() IN (2, 3, 4, 5));

-- NOTE: Organization, appointment_settings, blocked_slots, org_recognition,
-- org_annual_report policies are NOT updated for adviser because advisers
-- should not have access to those features.
