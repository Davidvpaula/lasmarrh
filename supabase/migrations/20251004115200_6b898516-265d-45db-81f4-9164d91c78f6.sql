-- Add explicit deny policy for unauthenticated access to system_settings
CREATE POLICY "Deny unauthenticated access to system_settings"
  ON public.system_settings
  FOR ALL
  TO anon
  USING (false);

-- Update comment to document security model
COMMENT ON TABLE public.system_settings IS 'Contains system configuration data. Only admins can view and manage settings. Unauthenticated access is explicitly denied.';