
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor');

-- ========== CREATE ALL TABLES FIRST ==========

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  crm TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'doctor',
  UNIQUE (user_id, role)
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  current_stage INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  stage_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, stage_number)
);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.training_videos(id) ON DELETE CASCADE NOT NULL,
  watch_time_minutes INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, video_id)
);

CREATE TABLE public.interview_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL UNIQUE,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  field_options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  field_options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.signature_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '',
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== ENABLE RLS ON ALL TABLES ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ========== FUNCTIONS ==========
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT, p_entity_type TEXT, p_entity_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL, p_new_values JSONB DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_old_values, p_new_values);
END; $$;

-- ========== RLS POLICIES ==========

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Applications
CREATE POLICY "Doctors can view own application" ON public.applications FOR SELECT TO authenticated USING (doctor_id = auth.uid());
CREATE POLICY "Doctors can insert own application" ON public.applications FOR INSERT TO authenticated WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Doctors can update own application" ON public.applications FOR UPDATE TO authenticated USING (doctor_id = auth.uid());
CREATE POLICY "Admins can manage all applications" ON public.applications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Stage progress
CREATE POLICY "Users can view own stage progress" ON public.stage_progress FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND doctor_id = auth.uid()));
CREATE POLICY "Users can update own stage progress" ON public.stage_progress FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND doctor_id = auth.uid()));
CREATE POLICY "Admins can manage all stage progress" ON public.stage_progress FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Documents
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND doctor_id = auth.uid()));
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND doctor_id = auth.uid()));
CREATE POLICY "Admins can manage all documents" ON public.documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Training videos
CREATE POLICY "Anyone authenticated can view active videos" ON public.training_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage training videos" ON public.training_videos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Training progress
CREATE POLICY "Users can view own training progress" ON public.training_progress FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND doctor_id = auth.uid()));
CREATE POLICY "Users can manage own training progress" ON public.training_progress FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND doctor_id = auth.uid()));
CREATE POLICY "Admins can manage all training progress" ON public.training_progress FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Interview fields
CREATE POLICY "Anyone authenticated can view interview fields" ON public.interview_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage interview fields" ON public.interview_fields FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Form fields
CREATE POLICY "Anyone authenticated can view form fields" ON public.form_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage form fields" ON public.form_fields FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Signature documents
CREATE POLICY "Anyone authenticated can view signature docs" ON public.signature_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage signature docs" ON public.signature_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- System settings
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Active sessions
CREATE POLICY "Admins can manage sessions" ON public.active_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ========== TRIGGER FOR AUTO-CREATE PROFILE ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, crm)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, COALESCE(NEW.raw_user_meta_data->>'crm', ''));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'doctor'));

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'doctor') = 'doctor' THEN
    INSERT INTO public.applications (doctor_id, status, current_stage) VALUES (NEW.id, 'pending', 1);
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== STORAGE ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can view all documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
