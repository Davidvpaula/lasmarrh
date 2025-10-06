-- Add missing columns to stage_progress
ALTER TABLE public.stage_progress
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing column to training_videos
ALTER TABLE public.training_videos
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add missing columns to documents
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE;

-- Add foreign key from applications to profiles
ALTER TABLE public.applications
ADD CONSTRAINT applications_doctor_id_fkey 
FOREIGN KEY (doctor_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;