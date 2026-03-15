-- ============================================================
-- Migration: Allow anonymous reads for login page calendar
-- Date: 2026-03-15
-- Description: The login page shows a public calendar of approved
--   activities. Since users aren't authenticated on the login page,
--   we need to allow anon reads on approved activities, their
--   schedules, and organization names.
-- ============================================================

-- 1. ACTIVITY TABLE - Allow anon to read approved activities
CREATE POLICY "activity_select_approved_anon" ON activity
  FOR SELECT USING (
    final_status = 'Approved'
    AND auth.role() = 'anon'
  );

-- 2. ACTIVITY_SCHEDULE TABLE - Allow anon to read approved activity schedules
CREATE POLICY "schedule_select_approved_anon" ON activity_schedule
  FOR SELECT USING (
    auth.role() = 'anon'
    AND activity_id IN (SELECT activity_id FROM activity WHERE final_status = 'Approved')
  );

-- 3. ORGANIZATION TABLE - Allow anon to read org names (needed for calendar filters)
CREATE POLICY "organization_select_anon" ON organization
  FOR SELECT USING (auth.role() = 'anon');
