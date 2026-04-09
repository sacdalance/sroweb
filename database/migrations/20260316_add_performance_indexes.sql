-- ============================================================
-- Migration: Add performance indexes for 3000+ student scale
-- Date: 2026-03-16
-- Description: Adds indexes on frequently queried columns to
--   eliminate full table scans. All indexes are additive and
--   non-destructive (IF NOT EXISTS).
-- ============================================================

-- Account table (queried on EVERY authenticated request)
CREATE INDEX IF NOT EXISTS idx_account_email ON account(email);
CREATE INDEX IF NOT EXISTS idx_account_role ON account(role_id);

-- Activity table (most queried table)
CREATE INDEX IF NOT EXISTS idx_activity_account_id ON activity(account_id);
CREATE INDEX IF NOT EXISTS idx_activity_org_id ON activity(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_final_status ON activity(final_status);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity(created_at);

-- Activity schedule (joined on every activity query)
CREATE INDEX IF NOT EXISTS idx_schedule_activity_id ON activity_schedule(activity_id);
CREATE INDEX IF NOT EXISTS idx_schedule_start_date ON activity_schedule(start_date);

-- Organization (dropdown lookups, adviser matching)
CREATE INDEX IF NOT EXISTS idx_organization_adviser_email ON organization(adviser_email);

-- Appointments (booking page, admin management)
CREATE INDEX IF NOT EXISTS idx_appointments_account_id ON appointments(account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);

-- Blocked slots (checked on every booking)
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(block_date);

-- Org recognition & annual reports
CREATE INDEX IF NOT EXISTS idx_org_recognition_org_id ON org_recognition(org_id);
CREATE INDEX IF NOT EXISTS idx_org_recognition_submitted_by ON org_recognition(submitted_by);
CREATE INDEX IF NOT EXISTS idx_annual_report_org_id ON org_annual_report(org_id);
CREATE INDEX IF NOT EXISTS idx_annual_report_submitted_by ON org_annual_report(submitted_by);
