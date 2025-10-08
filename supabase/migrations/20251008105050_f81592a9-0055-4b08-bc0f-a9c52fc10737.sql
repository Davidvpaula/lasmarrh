-- Fix profiles table RLS policies - remove redundant policy and keep specific ones
-- The issue is that we have multiple overlapping SELECT policies which can cause confusion

-- Drop the redundant policy that was flagged
DROP POLICY IF EXISTS "Authenticated users only - no public access" ON public.profiles;

-- The following policies already exist and provide proper access control:
-- 1. "Users can view their own profile" - allows users to see only their own data
-- 2. "Admins can view all profiles" - allows admins to see all profiles

-- Verify we have the correct policies in place
-- If they don't exist, create them

-- Policy for users to view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Policy for admins to view all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Add documentation
COMMENT ON TABLE public.profiles IS 
'Contains sensitive user data (email, phone, full_name). RLS is enabled with two SELECT policies:
1. Users can only view their own profile (user_id = auth.uid())
2. Admins can view all profiles (is_admin check)
No other authenticated users can view profiles of other users.';
