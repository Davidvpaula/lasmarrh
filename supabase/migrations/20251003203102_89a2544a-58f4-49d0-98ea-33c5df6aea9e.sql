-- Security Enhancement: Strengthen profiles table RLS policies
-- This migration addresses the security finding about potential PII exposure

-- Drop existing policies to recreate them with stronger constraints
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate policies with explicit access controls
-- Only admins can view ALL profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Users can ONLY view their own profile (strict user_id matching)
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can ONLY update their own profile (strict user_id matching)
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add explicit denial for any other access attempts
-- This ensures no authenticated user can access profiles they don't own
CREATE POLICY "Deny all other profile access"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (false);

-- Add comment to document security enhancement
COMMENT ON TABLE public.profiles IS 'Contains sensitive PII (email, phone, CRM). RLS policies enforce strict access control: users can only access their own profile, admins can view all profiles.';