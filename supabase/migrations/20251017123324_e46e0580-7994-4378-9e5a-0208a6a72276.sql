-- Allow doctors to update their own stage 3 progress (notes/status)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'stage_progress' 
      AND policyname = 'Users can update their own stage 3 progress'
  ) THEN
    CREATE POLICY "Users can update their own stage 3 progress"
    ON public.stage_progress
    FOR UPDATE
    USING (
      stage_number = 3 AND application_id IN (
        SELECT applications.id FROM public.applications 
        WHERE applications.doctor_id = auth.uid()
      )
    )
    WITH CHECK (
      stage_number = 3 AND application_id IN (
        SELECT applications.id FROM public.applications 
        WHERE applications.doctor_id = auth.uid()
      )
    );
  END IF;
END $$;