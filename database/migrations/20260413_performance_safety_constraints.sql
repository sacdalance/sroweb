-- ============================================================
-- Migration: Add safety constraints for race condition prevention
-- Date: 2026-04-13
-- Description: Adds unique constraints to prevent double-booking
--   appointments, duplicate accounts, and activity ID collisions.
--   All constraints are additive and non-destructive (IF NOT EXISTS).
-- ============================================================

-- Prevent duplicate accounts for the same email
ALTER TABLE account ADD CONSTRAINT IF NOT EXISTS unique_account_email UNIQUE (email);

-- Prevent double-booking the same appointment slot
-- Only one scheduled/confirmed appointment per date+time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_appointment_slot
  ON appointments (appointment_date, appointment_time)
  WHERE status IN ('scheduled', 'confirmed');

-- Prevent duplicate activity IDs
ALTER TABLE activity ADD CONSTRAINT IF NOT EXISTS unique_activity_id UNIQUE (activity_id);
