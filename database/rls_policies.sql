-- ============================================================
-- RLS POLICIES FOR ALL SRO WEB TABLES
-- Run this in Supabase SQL Editor
-- ============================================================

-- Helper: reusable function to get current user's role_id
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS INT AS $$
  SELECT role_id FROM public.account
  WHERE email = auth.jwt()->>'email'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Helper: reusable function to get current user's account_id
CREATE OR REPLACE FUNCTION public.user_account_id()
RETURNS INT AS $$
  SELECT account_id FROM public.account
  WHERE email = auth.jwt()->>'email'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ============================================================
-- 1. ACCOUNT TABLE
-- ============================================================
ALTER TABLE account ENABLE ROW LEVEL SECURITY;

-- Users can read their own account
CREATE POLICY "account_select_own" ON account
  FOR SELECT USING (email = auth.jwt()->>'email');

-- Admins can read all accounts
CREATE POLICY "account_select_admin" ON account
  FOR SELECT USING (public.user_role() IN (2, 3, 4));

-- Users can update their own account (but NOT role_id)
CREATE POLICY "account_update_own" ON account
  FOR UPDATE USING (email = auth.jwt()->>'email')
  WITH CHECK (
    email = auth.jwt()->>'email'
    AND role_id = (SELECT role_id FROM account WHERE email = auth.jwt()->>'email')
  );

-- Only superadmins can change role_id
CREATE POLICY "account_update_superadmin" ON account
  FOR UPDATE USING (public.user_role() = 4);


-- ============================================================
-- 2. ACTIVITY TABLE
-- ============================================================
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Students can see their own activities
CREATE POLICY "activity_select_own" ON activity
  FOR SELECT USING (account_id = public.user_account_id());

-- Admins can see all activities
CREATE POLICY "activity_select_admin" ON activity
  FOR SELECT USING (public.user_role() IN (2, 3, 4));

-- Anyone authenticated can see approved activities (for calendar)
CREATE POLICY "activity_select_approved" ON activity
  FOR SELECT USING (
    final_status = 'Approved'
    AND auth.role() = 'authenticated'
  );

-- Students can insert their own activities
CREATE POLICY "activity_insert_own" ON activity
  FOR INSERT WITH CHECK (account_id = public.user_account_id());

-- Students can update their own pending activities (edit/cancel)
CREATE POLICY "activity_update_own" ON activity
  FOR UPDATE USING (
    account_id = public.user_account_id()
    AND final_status IS DISTINCT FROM 'Approved'
  );

-- Admins can update any activity (approve/reject)
CREATE POLICY "activity_update_admin" ON activity
  FOR UPDATE USING (public.user_role() IN (2, 3, 4));


-- ============================================================
-- 3. ACTIVITY_SCHEDULE TABLE
-- ============================================================
ALTER TABLE activity_schedule ENABLE ROW LEVEL SECURITY;

-- Students can see schedules for their own activities
CREATE POLICY "schedule_select_own" ON activity_schedule
  FOR SELECT USING (
    activity_id IN (SELECT activity_id FROM activity WHERE account_id = public.user_account_id())
  );

-- Admins can see all schedules
CREATE POLICY "schedule_select_admin" ON activity_schedule
  FOR SELECT USING (public.user_role() IN (2, 3, 4));

-- Approved activity schedules are visible to authenticated users (calendar)
CREATE POLICY "schedule_select_approved" ON activity_schedule
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND activity_id IN (SELECT activity_id FROM activity WHERE final_status = 'Approved')
  );

-- Students can insert schedules for their own activities
CREATE POLICY "schedule_insert_own" ON activity_schedule
  FOR INSERT WITH CHECK (
    activity_id IN (SELECT activity_id FROM activity WHERE account_id = public.user_account_id())
  );

-- Students can update schedules for their own pending activities
CREATE POLICY "schedule_update_own" ON activity_schedule
  FOR UPDATE USING (
    activity_id IN (
      SELECT activity_id FROM activity
      WHERE account_id = public.user_account_id()
        AND final_status IS DISTINCT FROM 'Approved'
    )
  );

-- Admins can update any schedule
CREATE POLICY "schedule_update_admin" ON activity_schedule
  FOR UPDATE USING (public.user_role() IN (2, 3, 4));


-- ============================================================
-- 4. ORGANIZATION TABLE
-- ============================================================
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read organizations (needed for dropdowns)
CREATE POLICY "organization_select_all" ON organization
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete organizations
CREATE POLICY "organization_insert_admin" ON organization
  FOR INSERT WITH CHECK (public.user_role() IN (2, 3, 4));

CREATE POLICY "organization_update_admin" ON organization
  FOR UPDATE USING (public.user_role() IN (2, 3, 4));

CREATE POLICY "organization_delete_admin" ON organization
  FOR DELETE USING (public.user_role() IN (2, 3, 4));


-- ============================================================
-- 5. ORG_RECOGNITION TABLE
-- ============================================================
ALTER TABLE org_recognition ENABLE ROW LEVEL SECURITY;

-- Users can see their own submissions
CREATE POLICY "org_recognition_select_own" ON org_recognition
  FOR SELECT USING (submitted_by = public.user_account_id());

-- Admins can see all submissions
CREATE POLICY "org_recognition_select_admin" ON org_recognition
  FOR SELECT USING (public.user_role() IN (2, 3, 4));

-- Users can insert their own submissions
CREATE POLICY "org_recognition_insert_own" ON org_recognition
  FOR INSERT WITH CHECK (submitted_by = public.user_account_id());

-- Only admins can update (approve/reject)
CREATE POLICY "org_recognition_update_admin" ON org_recognition
  FOR UPDATE USING (public.user_role() IN (2, 3, 4));


-- ============================================================
-- 6. ORG_ANNUAL_REPORT TABLE
-- ============================================================
ALTER TABLE org_annual_report ENABLE ROW LEVEL SECURITY;

-- Users can see their own reports
CREATE POLICY "annual_report_select_own" ON org_annual_report
  FOR SELECT USING (submitted_by = public.user_account_id());

-- Admins can see all reports
CREATE POLICY "annual_report_select_admin" ON org_annual_report
  FOR SELECT USING (public.user_role() IN (2, 3, 4));

-- Users can insert their own reports
CREATE POLICY "annual_report_insert_own" ON org_annual_report
  FOR INSERT WITH CHECK (submitted_by = public.user_account_id());

-- Only admins can update reports
CREATE POLICY "annual_report_update_admin" ON org_annual_report
  FOR UPDATE USING (public.user_role() IN (2, 3, 4));


-- ============================================================
-- 7. APPOINTMENT_SETTINGS TABLE
-- ============================================================
ALTER TABLE appointment_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings (needed for booking UI)
CREATE POLICY "appointment_settings_select_all" ON appointment_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify settings
CREATE POLICY "appointment_settings_insert_admin" ON appointment_settings
  FOR INSERT WITH CHECK (public.user_role() IN (2, 3, 4));

CREATE POLICY "appointment_settings_update_admin" ON appointment_settings
  FOR UPDATE USING (public.user_role() IN (2, 3, 4));

CREATE POLICY "appointment_settings_delete_admin" ON appointment_settings
  FOR DELETE USING (public.user_role() IN (2, 3, 4));


-- ============================================================
-- 8. BLOCKED_SLOTS TABLE
-- ============================================================
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (needed to show unavailable slots)
CREATE POLICY "blocked_slots_select_all" ON blocked_slots
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage blocked slots
CREATE POLICY "blocked_slots_insert_admin" ON blocked_slots
  FOR INSERT WITH CHECK (public.user_role() IN (2, 3, 4));

CREATE POLICY "blocked_slots_update_admin" ON blocked_slots
  FOR UPDATE USING (public.user_role() IN (2, 3, 4));

CREATE POLICY "blocked_slots_delete_admin" ON blocked_slots
  FOR DELETE USING (public.user_role() IN (2, 3, 4));


-- ============================================================
-- 9. APPOINTMENTS TABLE
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users can see their own appointments
CREATE POLICY "appointments_select_own" ON appointments
  FOR SELECT USING (account_id = public.user_account_id());

-- Admins can see all appointments
CREATE POLICY "appointments_select_admin" ON appointments
  FOR SELECT USING (public.user_role() IN (2, 3, 4));

-- Users can insert their own appointments
CREATE POLICY "appointments_insert_own" ON appointments
  FOR INSERT WITH CHECK (account_id = public.user_account_id());

-- Users can update their own appointments (reschedule/cancel requests)
CREATE POLICY "appointments_update_own" ON appointments
  FOR UPDATE USING (account_id = public.user_account_id());

-- Admins can update any appointment (confirm/reject/complete)
CREATE POLICY "appointments_update_admin" ON appointments
  FOR UPDATE USING (public.user_role() IN (2, 3, 4));


-- ============================================================
-- 10. NOTIFICATIONS TABLE (already has RLS from notifications_table.sql)
-- Skipped - policies already exist
-- ============================================================


-- ============================================================
-- 11. LOGS TABLE
-- ============================================================
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs
CREATE POLICY "logs_select_admin" ON logs
  FOR SELECT USING (public.user_role() IN (2, 3, 4));

-- Any authenticated user can insert logs (actions are logged)
CREATE POLICY "logs_insert_all" ON logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- 12. CONSULTATION_HOURS TABLE (if exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultation_hours') THEN
    EXECUTE 'ALTER TABLE consultation_hours ENABLE ROW LEVEL SECURITY';

    EXECUTE $policy$
      CREATE POLICY "consultation_hours_select_all" ON consultation_hours
        FOR SELECT USING (auth.role() = 'authenticated')
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "consultation_hours_admin" ON consultation_hours
        FOR ALL USING (public.user_role() IN (2, 3, 4))
    $policy$;
  END IF;
END $$;
