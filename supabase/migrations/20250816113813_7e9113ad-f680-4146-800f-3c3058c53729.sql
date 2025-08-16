-- Create enum types for roles and stage statuses
CREATE TYPE public.user_role AS ENUM ('doctor', 'admin');
CREATE TYPE public.stage_status AS ENUM ('locked', 'available', 'in_progress', 'completed', 'approved', 'rejected');
CREATE TYPE public.application_status AS ENUM ('active', 'completed', 'rejected');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'doctor',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  crm TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table to track doctor applications
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'active',
  current_stage INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stages table to track individual stage progress
CREATE TABLE public.stage_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  status stage_status NOT NULL DEFAULT 'locked',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(user_id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, stage_number)
);

-- Create documents table for file uploads
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training videos table
CREATE TABLE public.training_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training progress table
CREATE TABLE public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.training_videos(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  watch_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, video_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Applications policies
CREATE POLICY "Doctors can view their own applications" ON public.applications
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own applications" ON public.applications
  FOR UPDATE USING (doctor_id = auth.uid());

CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all applications" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Stage progress policies
CREATE POLICY "Doctors can view their own stage progress" ON public.stage_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their own stage progress" ON public.stage_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all stage progress" ON public.stage_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all stage progress" ON public.stage_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Documents policies
CREATE POLICY "Doctors can view their own documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Training videos policies
CREATE POLICY "All authenticated users can view active training videos" ON public.training_videos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage training videos" ON public.training_videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Training progress policies
CREATE POLICY "Doctors can view their own training progress" ON public.training_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their own training progress" ON public.training_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all training progress" ON public.training_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'doctor')
  );

  -- If the user is a doctor, create an application and initial stage progress
  IF COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'doctor') = 'doctor' THEN
    INSERT INTO public.applications (doctor_id, current_stage)
    VALUES (NEW.id, 1);
    
    -- Create stage progress for all 5 stages
    INSERT INTO public.stage_progress (application_id, stage_number, status)
    SELECT 
      a.id,
      generate_series(1, 5),
      CASE 
        WHEN generate_series(1, 5) = 1 THEN 'completed'::stage_status -- Stage 1 (Registration) is auto-completed
        WHEN generate_series(1, 5) = 2 THEN 'available'::stage_status -- Stage 2 (Interview) is available
        ELSE 'locked'::stage_status -- Stages 3-5 are locked
      END
    FROM public.applications a 
    WHERE a.doctor_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stage_progress_updated_at
  BEFORE UPDATE ON public.stage_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();