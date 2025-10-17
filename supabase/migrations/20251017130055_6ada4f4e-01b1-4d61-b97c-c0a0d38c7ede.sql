-- Create table for form field configurations
CREATE TABLE IF NOT EXISTS public.form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, textarea, email, phone, cpf, date, file, select
  field_options JSONB, -- for select fields
  is_required BOOLEAN NOT NULL DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for signature documents
CREATE TABLE IF NOT EXISTS public.signature_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  category TEXT DEFAULT 'signature',
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track signed documents by candidates
CREATE TABLE IF NOT EXISTS public.signed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  signature_document_id UUID NOT NULL REFERENCES public.signature_documents(id) ON DELETE CASCADE,
  signed_file_path TEXT,
  signed_file_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, signed, rejected
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, signature_document_id)
);

-- Enable RLS
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_fields
CREATE POLICY "Admins can manage form fields"
  ON public.form_fields
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active form fields"
  ON public.form_fields
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for signature_documents
CREATE POLICY "Admins can manage signature documents"
  ON public.signature_documents
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active signature documents"
  ON public.signature_documents
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for signed_documents
CREATE POLICY "Admins can view all signed documents"
  ON public.signed_documents
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own signed documents"
  ON public.signed_documents
  FOR SELECT
  USING (application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own signed documents"
  ON public.signed_documents
  FOR INSERT
  WITH CHECK (application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  ));

CREATE POLICY "Users can update their own signed documents"
  ON public.signed_documents
  FOR UPDATE
  USING (application_id IN (
    SELECT id FROM public.applications WHERE doctor_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all signed documents"
  ON public.signed_documents
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_form_fields_updated_at
  BEFORE UPDATE ON public.form_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signature_documents_updated_at
  BEFORE UPDATE ON public.signature_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signed_documents_updated_at
  BEFORE UPDATE ON public.signed_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_form_fields_active ON public.form_fields(is_active, order_index);
CREATE INDEX idx_signature_documents_active ON public.signature_documents(is_active, order_index);
CREATE INDEX idx_signed_documents_application ON public.signed_documents(application_id);
CREATE INDEX idx_signed_documents_status ON public.signed_documents(status);