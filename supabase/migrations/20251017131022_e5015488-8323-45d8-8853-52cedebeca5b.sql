-- Create table for interview field configurations
CREATE TABLE IF NOT EXISTS public.interview_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL UNIQUE,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, textarea, email, phone, select, radio
  field_options JSONB, -- for select/radio fields
  is_required BOOLEAN NOT NULL DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_fields
CREATE POLICY "Admins can manage interview fields"
  ON public.interview_fields
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active interview fields"
  ON public.interview_fields
  FOR SELECT
  USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_interview_fields_updated_at
  BEFORE UPDATE ON public.interview_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_interview_fields_active ON public.interview_fields(is_active, order_index);

-- Insert default interview fields (as examples)
INSERT INTO public.interview_fields (field_name, field_label, field_type, is_required, placeholder, help_text, order_index, is_active) VALUES
  ('motivation', 'Por que você quer fazer parte da nossa equipe?', 'textarea', true, 'Conte-nos sua motivação...', 'Mínimo 50 caracteres', 0, true),
  ('experience', 'Descreva sua experiência profissional relevante', 'textarea', true, 'Descreva sua experiência...', 'Mínimo 50 caracteres', 1, true),
  ('expectations', 'Quais são suas expectativas com este trabalho?', 'textarea', true, 'Conte-nos suas expectativas...', 'Mínimo 30 caracteres', 2, true),
  ('whatsapp', 'Número de WhatsApp', 'phone', true, '(11) 99999-9999', 'Para contato direto', 3, true)
ON CONFLICT (field_name) DO NOTHING;