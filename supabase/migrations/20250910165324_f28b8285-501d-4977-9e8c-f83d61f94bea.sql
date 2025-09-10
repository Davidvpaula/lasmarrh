-- Fix function search path security issues
-- Update cleanup_expired_sessions function to have proper search_path

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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