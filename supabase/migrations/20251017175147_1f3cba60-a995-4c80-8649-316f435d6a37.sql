-- Allow doctors to update their own stage 2 (Interview) progress
-- This fixes the issue where interview answers couldn't be saved due to RLS

-- Create/update policy for stage 2 updates
DROP POLICY IF EXISTS "Users can update their own stage 2 progress" ON public.stage_progress;
CREATE POLICY "Users can update their own stage 2 progress"
ON public.stage_progress
FOR UPDATE
USING (
  stage_number = 2 AND application_id IN (
    SELECT applications.id FROM public.applications
    WHERE applications.doctor_id = auth.uid()
  )
)
WITH CHECK (
  stage_number = 2 AND application_id IN (
    SELECT applications.id FROM public.applications
    WHERE applications.doctor_id = auth.uid()
  )
);
