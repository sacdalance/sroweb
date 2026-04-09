-- ============================================================
-- Migration: Fix account UPDATE RLS for SuperAdmin role switching
-- Date: 2026-03-16
-- Description: The SuperAdmin cheats page updates role_id via the
--   frontend Supabase client. The old policy blocked this because:
--   1. account_update_own has WITH CHECK that prevents role_id changes
--   2. account_update_superadmin only works when user_role()=4, but
--      if you switched to Student (role 1), you can't switch back
--
--   Fix: Allow superadmin EMAILS (not role) to update any account,
--   since superadmin status is based on hardcoded emails in the app.
-- ============================================================

-- Drop the old superadmin update policy (role-based, breaks when role is changed)
DROP POLICY IF EXISTS "account_update_superadmin" ON account;

-- New policy: superadmin emails can update ANY account (including role_id)
-- These emails match SUPERADMIN_EMAILS in sroapp/src/lib/permissions.js
CREATE POLICY "account_update_superadmin" ON account
  FOR UPDATE USING (
    auth.jwt()->>'email' IN (
      'clpagunsan@up.edu.ph',
      'dvnisay1@up.edu.ph',
      'mmlarua@up.edu.ph',
      'ltcuadra@up.edu.ph',
      'lssacdalan@up.edu.ph'
    )
  );
