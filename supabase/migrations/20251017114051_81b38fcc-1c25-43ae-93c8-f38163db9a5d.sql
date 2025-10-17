-- Update handle_new_user function to create stage_progress with correct initial status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _application_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  -- Assign role based on metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'doctor')
  );
  
  -- Create application for doctors and initialize stage progress
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'doctor') = 'doctor' THEN
    INSERT INTO public.applications (doctor_id)
    VALUES (NEW.id)
    RETURNING id INTO _application_id;
    
    -- Initialize all stages with proper status
    -- Stage 1: Registration - automatically completed when user signs up
    INSERT INTO public.stage_progress (application_id, stage_number, status, completed_at)
    VALUES (_application_id, 1, 'completed', now());
    
    -- Stage 2: Interview - available immediately after registration
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    VALUES (_application_id, 2, 'available');
    
    -- Stage 3: Documents - locked until admin approves stage 2
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    VALUES (_application_id, 3, 'locked');
    
    -- Stage 4: Training - locked until admin approves stage 3
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    VALUES (_application_id, 4, 'locked');
    
    -- Stage 5: Completion - locked until all previous stages are completed
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    VALUES (_application_id, 5, 'locked');
    
    -- Stage 6: Additional Training (optional) - locked until stage 5 is completed
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    VALUES (_application_id, 6, 'locked');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update existing applications that don't have stage_progress records
DO $$
DECLARE
  app RECORD;
BEGIN
  FOR app IN 
    SELECT a.id 
    FROM applications a 
    LEFT JOIN stage_progress sp ON sp.application_id = a.id
    WHERE sp.id IS NULL
  LOOP
    -- Stage 1: Registration
    INSERT INTO stage_progress (application_id, stage_number, status, completed_at)
    VALUES (app.id, 1, 'completed', now())
    ON CONFLICT DO NOTHING;
    
    -- Stage 2: Interview
    INSERT INTO stage_progress (application_id, stage_number, status)
    VALUES (app.id, 2, 'available')
    ON CONFLICT DO NOTHING;
    
    -- Stage 3: Documents
    INSERT INTO stage_progress (application_id, stage_number, status)
    VALUES (app.id, 3, 'locked')
    ON CONFLICT DO NOTHING;
    
    -- Stage 4: Training
    INSERT INTO stage_progress (application_id, stage_number, status)
    VALUES (app.id, 4, 'locked')
    ON CONFLICT DO NOTHING;
    
    -- Stage 5: Completion
    INSERT INTO stage_progress (application_id, stage_number, status)
    VALUES (app.id, 5, 'locked')
    ON CONFLICT DO NOTHING;
    
    -- Stage 6: Additional Training
    INSERT INTO stage_progress (application_id, stage_number, status)
    VALUES (app.id, 6, 'locked')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;