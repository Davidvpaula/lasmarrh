-- Fix the search_path security warning by making it more specific
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'doctor'::public.user_role)
  );

  -- If the user is a doctor, create an application and initial stage progress
  IF COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'doctor'::public.user_role) = 'doctor'::public.user_role THEN
    INSERT INTO public.applications (doctor_id, current_stage)
    VALUES (NEW.id, 1);
    
    -- Create stage progress for all 6 stages
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    SELECT 
      a.id,
      generate_series(1, 6),
      CASE 
        WHEN generate_series(1, 6) = 1 THEN 'completed'::public.stage_status -- Stage 1 (Registration) is auto-completed
        WHEN generate_series(1, 6) = 2 THEN 'available'::public.stage_status -- Stage 2 (Interview) is available
        WHEN generate_series(1, 6) = 6 THEN 'locked'::public.stage_status -- Stage 6 (Additional training) starts locked
        ELSE 'locked'::public.stage_status -- Stages 3-5 are locked
      END
    FROM public.applications a 
    WHERE a.doctor_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;