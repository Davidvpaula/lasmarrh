-- Fix signup failure caused by set-returning function usage inside CASE in handle_new_user
-- and ensure the trigger exists

-- Safer search_path and corrected generate_series usage
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_id uuid;
  v_role public.user_role;
BEGIN
  -- Determine role from metadata, default to 'doctor'
  v_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'doctor'::public.user_role);

  -- Create profile for every new user
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    v_role
  );

  -- If user is a doctor, create application and initial stage progress
  IF v_role = 'doctor'::public.user_role THEN
    INSERT INTO public.applications (doctor_id, current_stage)
    VALUES (NEW.id, 1)
    RETURNING id INTO v_app_id;

    -- Insert progress rows for stages 1..6 using a single generate_series reference
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    SELECT 
      v_app_id,
      gs AS stage_number,
      CASE 
        WHEN gs = 1 THEN 'completed'::public.stage_status
        WHEN gs = 2 THEN 'available'::public.stage_status
        WHEN gs = 6 THEN 'locked'::public.stage_status
        ELSE 'locked'::public.stage_status
      END AS status
    FROM generate_series(1, 6) AS gs;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;