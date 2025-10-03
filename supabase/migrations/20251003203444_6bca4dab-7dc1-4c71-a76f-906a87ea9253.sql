-- Fix Critical Security Issue: Remove problematic catch-all policy and add proper access controls
-- This resolves the ERROR-level security finding about potential data theft

-- 1. Remove the problematic "Deny all other profile access" policy
DROP POLICY IF EXISTS "Deny all other profile access" ON public.profiles;

-- The existing policies already handle all authenticated cases correctly:
-- - Admins can view all profiles
-- - Users can view their own profile
-- - Users can update their own profile
-- 
-- No additional "deny all" policy is needed because RLS denies by default
-- unless explicitly allowed by a policy

-- 2. Fix active_sessions table to prevent unauthenticated access
CREATE POLICY "Deny unauthenticated access to active_sessions"
  ON public.active_sessions
  FOR ALL
  TO anon
  USING (false);

-- Add comment to document the security model
COMMENT ON TABLE public.profiles IS 'Contains sensitive PII (email, phone, CRM). RLS policies use positive permissions model: only explicitly allowed access is granted. Admins can view all profiles via is_admin() check. Users can only view/update their own profile via auth.uid() = user_id check. All other access is denied by default RLS behavior.';

COMMENT ON TABLE public.active_sessions IS 'Contains session metadata including IP addresses and user agents. Access is restricted to authenticated users who can only view their own sessions. Admins can view all sessions. Unauthenticated access is explicitly denied.';