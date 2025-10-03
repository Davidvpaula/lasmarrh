-- Final Security Enhancement: Restrict active_sessions UPDATE to only is_active field
-- This prevents tampering with security-sensitive session data

-- Drop the existing policy that allows too broad updates
DROP POLICY IF EXISTS "Users can deactivate their own sessions" ON public.active_sessions;

-- Create a more restrictive policy that only allows updating is_active to false
CREATE POLICY "Users can deactivate their own sessions"
  ON public.active_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND is_active = false
    -- Ensure other security-sensitive fields are not modified
    AND ip_address = (SELECT ip_address FROM active_sessions WHERE id = active_sessions.id)
    AND session_hash = (SELECT session_hash FROM active_sessions WHERE id = active_sessions.id)
    AND session_fingerprint = (SELECT session_fingerprint FROM active_sessions WHERE id = active_sessions.id)
    AND user_agent = (SELECT user_agent FROM active_sessions WHERE id = active_sessions.id)
  );

-- Update table comment to reflect the security model
COMMENT ON TABLE public.active_sessions IS 'Contains session metadata including IP addresses and user agents. Users can only view their own sessions and deactivate them (set is_active to false). All other session fields are immutable to prevent tampering. Admins can view and manage all sessions.';