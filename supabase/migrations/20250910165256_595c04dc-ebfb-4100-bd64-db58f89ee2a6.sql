-- Fix security issues in active_sessions table
-- 1. Remove session_token column and replace with session_hash
-- 2. Add session_fingerprint for device identification
-- 3. Add expires_at for proper session management

ALTER TABLE public.active_sessions 
DROP COLUMN IF EXISTS session_token;

ALTER TABLE public.active_sessions 
ADD COLUMN session_hash TEXT,
ADD COLUMN session_fingerprint TEXT,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create index for efficient session lookup
CREATE INDEX idx_active_sessions_hash ON public.active_sessions(session_hash);
CREATE INDEX idx_active_sessions_expires ON public.active_sessions(expires_at);

-- Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Admins can view active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.active_sessions;

-- Create new secure policies
CREATE POLICY "Admins can manage active sessions" 
ON public.active_sessions 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view their own session metadata only" 
ON public.active_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only update their own sessions to mark as inactive
CREATE POLICY "Users can deactivate their own sessions" 
ON public.active_sessions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_active = false);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.active_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  -- Log cleanup action
  PERFORM log_audit_event(
    'CLEANUP_EXPIRED_SESSIONS',
    'active_sessions',
    NULL,
    NULL,
    json_build_object('cleaned_count', (
      SELECT COUNT(*) FROM public.active_sessions 
      WHERE expires_at < now() AND is_active = false
    ))
  );
END;
$$;