-- Add unique constraint on email in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create the first admin user profile
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