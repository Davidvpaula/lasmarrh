-- Criar bucket de storage para documentos dos candidatos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-documents',
  'candidate-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket de documentos
CREATE POLICY "Usuários podem fazer upload de seus próprios documentos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem ver seus próprios documentos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'candidate-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins podem ver todos os documentos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'candidate-documents' AND
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins podem deletar documentos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'candidate-documents' AND
  public.is_admin(auth.uid())
);

CREATE POLICY "Usuários podem atualizar seus próprios documentos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'candidate-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);