-- Fix system_settings RLS policy to restrict access to admins only
-- Remove the permissive policy that allows all authenticated users to view settings
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.system_settings;

-- Create new admin-only SELECT policy
CREATE POLICY "Only admins can view settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- The existing "Only admins can manage settings" policy already covers INSERT, UPDATE, DELETE
-- This ensures that system_settings table is completely restricted to admin users only

-- Add comment for documentation
COMMENT ON TABLE public.system_settings IS 
'Contains sensitive system configuration data, API keys, and business logic parameters. 
Access is restricted to administrators only via RLS policies.';