-- Create training_progress table
CREATE TABLE IF NOT EXISTS public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.training_videos(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  watch_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, video_id)
);

-- Enable RLS
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for training_progress
CREATE POLICY "Users can view their own training progress"
ON public.training_progress
FOR SELECT
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own training progress"
ON public.training_progress
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own training progress"
ON public.training_progress
FOR UPDATE
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all training progress"
ON public.training_progress
FOR ALL
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_training_progress_updated_at
BEFORE UPDATE ON public.training_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();