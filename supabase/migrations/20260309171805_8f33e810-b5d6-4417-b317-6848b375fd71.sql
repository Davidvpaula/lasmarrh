
-- Add signed_documents table (referenced by Forms.tsx)
CREATE TABLE public.signed_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  signature_document_id UUID REFERENCES public.signature_documents(id) ON DELETE CASCADE NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signed docs" ON public.signed_documents FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND doctor_id = auth.uid()));
CREATE POLICY "Users can insert own signed docs" ON public.signed_documents FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND doctor_id = auth.uid()));
CREATE POLICY "Admins can manage all signed docs" ON public.signed_documents FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin'));

-- Add file_path column to signature_documents (referenced by EditForms.tsx)
ALTER TABLE public.signature_documents ADD COLUMN file_path TEXT DEFAULT '';
