-- Step 1: Create the user_roles table with proper security
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Update the is_admin function to use the secure user_roles table with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = _uid AND ur.role = 'admin'::user_role
  );
$$;

-- Step 4: Create RLS policies for user_roles table
-- Only admins can view all roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Only admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Step 5: Update the handle_new_user trigger to use user_roles table
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

  -- Create profile for every new user (without role column)
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );

  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If user is a doctor, create application and initial stage progress
  IF v_role = 'doctor'::public.user_role THEN
    INSERT INTO public.applications (doctor_id, current_stage)
    VALUES (NEW.id, 1)
    RETURNING id INTO v_app_id;

    -- Insert progress rows for stages 1..6
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

-- Step 6: Remove the role column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;