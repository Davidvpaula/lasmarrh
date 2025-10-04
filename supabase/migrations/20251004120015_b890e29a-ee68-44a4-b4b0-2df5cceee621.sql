-- Fix Critical Security Issue: Prevent unauthorized application creation
-- The 'applications' table needs an INSERT policy to prevent abuse

-- Add INSERT policy: Only admins can manually create applications
-- Note: The handle_new_user() trigger creates applications automatically
-- with SECURITY DEFINER, which bypasses RLS policies
CREATE POLICY "Only admins can manually create applications"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Update table comment to document the security model
COMMENT ON TABLE public.applications IS 'Applications are automatically created by the handle_new_user() trigger when a doctor signs up. Only admins can manually create applications to prevent abuse and system flooding. Each doctor can only have one application record.';

-- Add a unique constraint to ensure one application per doctor
-- This prevents duplicate applications even if policies are bypassed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'applications_doctor_id_key'
  ) THEN
    ALTER TABLE public.applications 
    ADD CONSTRAINT applications_doctor_id_key UNIQUE (doctor_id);
  END IF;
END $$;