-- Fix remaining function search path security issue
-- Update log_audit_event function to have proper search_path

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text, 
  p_entity_type text, 
  p_entity_id uuid DEFAULT NULL::uuid, 
  p_old_values jsonb DEFAULT NULL::jsonb, 
  p_new_values jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    now()
  );
END;
$$;