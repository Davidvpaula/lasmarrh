-- Create the first admin user in the system
-- This will create a profile for the admin with the specified email
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'comercial@telemedlasmar.com',
  crypt('Ribeiro9692@', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin Comercial", "role": "admin"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Create the profile for the admin user
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Admin Comercial',
  'comercial@telemedlasmar.com',
  'admin'
) ON CONFLICT (user_id) DO NOTHING;