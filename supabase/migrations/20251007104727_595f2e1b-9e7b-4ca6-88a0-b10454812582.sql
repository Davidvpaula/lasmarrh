-- Fix critical security issue: Restrict document access to own applications only
-- Remove the overly permissive policy that allows any authenticated user to see all documents

-- Drop the insecure policy
DROP POLICY IF EXISTS "Authenticated users can view active documents" ON public.documents;

-- Create secure policy: Users can only view documents from their own applications
CREATE POLICY "Users can view their own application documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  -- Check if the document's application belongs to the current user
  application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  )
  OR
  -- Alternatively, if application_id is null, check if the document is public/general
  (application_id IS NULL AND is_active = true)
);

-- Ensure users can only insert documents for their own applications
CREATE POLICY "Users can insert documents for their own applications"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  )
);

-- Users can update their own application documents
CREATE POLICY "Users can update their own application documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  )
)
WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  )
);

-- Users can delete their own application documents
CREATE POLICY "Users can delete their own application documents"
ON public.documents
FOR DELETE
TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  )
);