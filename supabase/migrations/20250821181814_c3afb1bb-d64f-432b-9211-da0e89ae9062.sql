-- Add stage 6 (optional additional training) for existing applications
-- This will add the 6th stage to all existing applications

INSERT INTO stage_progress (application_id, stage_number, status)
SELECT 
  a.id,
  6 as stage_number,
  CASE 
    WHEN sp5.status = 'completed' OR sp5.status = 'approved' THEN 'available'::stage_status
    ELSE 'locked'::stage_status
  END as status
FROM applications a
LEFT JOIN stage_progress sp5 ON sp5.application_id = a.id AND sp5.stage_number = 5
WHERE NOT EXISTS (
  SELECT 1 FROM stage_progress sp6 
  WHERE sp6.application_id = a.id AND sp6.stage_number = 6
);

-- Update the handle_new_user function to include stage 6 for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'doctor')
  );

  -- If the user is a doctor, create an application and initial stage progress
  IF COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'doctor') = 'doctor' THEN
    INSERT INTO public.applications (doctor_id, current_stage)
    VALUES (NEW.id, 1);
    
    -- Create stage progress for all 6 stages
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    SELECT 
      a.id,
      generate_series(1, 6),
      CASE 
        WHEN generate_series(1, 6) = 1 THEN 'completed'::stage_status -- Stage 1 (Registration) is auto-completed
        WHEN generate_series(1, 6) = 2 THEN 'available'::stage_status -- Stage 2 (Interview) is available
        WHEN generate_series(1, 6) = 6 THEN 'locked'::stage_status -- Stage 6 (Additional training) starts locked
        ELSE 'locked'::stage_status -- Stages 3-5 are locked
      END
    FROM public.applications a 
    WHERE a.doctor_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;