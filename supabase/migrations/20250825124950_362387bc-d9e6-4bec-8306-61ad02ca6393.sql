-- 1) Helper function to avoid recursive RLS checks
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _uid AND p.role = 'admin'::user_role
  );
$$;

-- 2) PROFILES policies (make them PERMISSIVE and use is_admin)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile"
ON public.profiles
AS PERMISSIVE
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
AS PERMISSIVE
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3) APPLICATIONS policies
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.applications;
DROP POLICY IF EXISTS "Doctors can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Doctors can update their own applications" ON public.applications;

CREATE POLICY "Admins can view all applications"
ON public.applications
AS PERMISSIVE
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all applications"
ON public.applications
AS PERMISSIVE
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Doctors can view their own applications"
ON public.applications
AS PERMISSIVE
FOR SELECT
USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own applications"
ON public.applications
AS PERMISSIVE
FOR UPDATE
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

-- 4) DOCUMENTS policies
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Doctors can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Doctors can view their own documents" ON public.documents;

CREATE POLICY "Admins can view all documents"
ON public.documents
AS PERMISSIVE
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Doctors can insert their own documents"
ON public.documents
AS PERMISSIVE
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = documents.application_id AND a.doctor_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view their own documents"
ON public.documents
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = documents.application_id AND a.doctor_id = auth.uid()
  )
);

-- 5) STAGE_PROGRESS policies
DROP POLICY IF EXISTS "Admins can update all stage progress" ON public.stage_progress;
DROP POLICY IF EXISTS "Admins can view all stage progress" ON public.stage_progress;
DROP POLICY IF EXISTS "Doctors can update their own stage progress" ON public.stage_progress;
DROP POLICY IF EXISTS "Doctors can view their own stage progress" ON public.stage_progress;

CREATE POLICY "Admins can view all stage progress"
ON public.stage_progress
AS PERMISSIVE
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all stage progress"
ON public.stage_progress
AS PERMISSIVE
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Doctors can view their own stage progress"
ON public.stage_progress
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = stage_progress.application_id AND a.doctor_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update their own stage progress"
ON public.stage_progress
AS PERMISSIVE
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = stage_progress.application_id AND a.doctor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = stage_progress.application_id AND a.doctor_id = auth.uid()
  )
);

-- 6) TRAINING_PROGRESS policies
DROP POLICY IF EXISTS "Admins can view all training progress" ON public.training_progress;
DROP POLICY IF EXISTS "Doctors can update their own training progress" ON public.training_progress;
DROP POLICY IF EXISTS "Doctors can view their own training progress" ON public.training_progress;

CREATE POLICY "Admins can view all training progress"
ON public.training_progress
AS PERMISSIVE
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Doctors can view their own training progress"
ON public.training_progress
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = training_progress.application_id AND a.doctor_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update their own training progress"
ON public.training_progress
AS PERMISSIVE
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = training_progress.application_id AND a.doctor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = training_progress.application_id AND a.doctor_id = auth.uid()
  )
);

-- 7) TRAINING_VIDEOS policies
DROP POLICY IF EXISTS "Admins can manage training videos" ON public.training_videos;
DROP POLICY IF EXISTS "All authenticated users can view active training videos" ON public.training_videos;

CREATE POLICY "Admins can manage training videos"
ON public.training_videos
AS PERMISSIVE
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "All authenticated users can view active training videos"
ON public.training_videos
AS PERMISSIVE
FOR SELECT
USING (is_active = true);

-- 8) Reset data: remove previous candidate accounts and related data (keep admins)
DELETE FROM public.documents;
DELETE FROM public.training_progress;
DELETE FROM public.stage_progress;
DELETE FROM public.applications;
DELETE FROM public.profiles WHERE role = 'doctor'::user_role;