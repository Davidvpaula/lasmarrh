-- Additional Security Enhancement: Prevent unauthenticated access and protect audit logs
-- This addresses remaining security findings from the security scan

-- 1. Add explicit policy to deny unauthenticated access to profiles table
CREATE POLICY "Deny unauthenticated access to profiles"
  ON public.profiles
  FOR ALL
  TO anon
  USING (false);

-- 2. Protect audit_logs table from tampering
-- Drop existing policies to add more restrictive ones
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Only the log_audit_event function can insert audit logs (via SECURITY DEFINER)
-- No direct INSERT access for any user
CREATE POLICY "Only system functions can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Prevent any user from updating audit logs (immutable audit trail)
CREATE POLICY "Prevent audit log modification"
  ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

-- Prevent any user from deleting audit logs (immutable audit trail)
CREATE POLICY "Prevent audit log deletion"
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- Also deny anonymous access to audit logs
CREATE POLICY "Deny unauthenticated access to audit logs"
  ON public.audit_logs
  FOR ALL
  TO anon
  USING (false);

-- Add comment to document security enhancement
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail. Only system functions can insert records. No user can modify or delete records.';