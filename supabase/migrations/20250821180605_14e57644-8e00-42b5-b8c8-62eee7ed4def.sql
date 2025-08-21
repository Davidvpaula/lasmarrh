-- Create the first admin user
-- Note: This creates the user profile, but the actual auth user needs to be created via signup
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Administrador Comercial',
  'comercial@telemedlasmar.com',
  'admin'::user_role
) ON CONFLICT (email) DO NOTHING;

-- Create a function to help with admin user setup
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be called from the application to create the auth user
  -- The actual user creation needs to happen via Supabase Auth signup
  RETURN 'Admin profile created. Use signup with comercial@telemedlasmar.com and password Ribeiro9692@ to complete setup.';
END;
$$;