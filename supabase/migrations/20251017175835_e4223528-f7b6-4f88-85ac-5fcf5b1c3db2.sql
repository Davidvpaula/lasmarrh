-- Permitir que admins façam upload de documentos de assinatura para o bucket candidate-documents
-- Isso corrige o erro "Falha ao salvar documento" na área Admin

-- Política para admins fazerem upload de documentos de assinatura
CREATE POLICY "Admins podem fazer upload de documentos de assinatura"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'candidate-documents' AND
  is_admin(auth.uid()) AND
  (storage.foldername(name))[1] = 'signature-docs'
);

-- Política para admins atualizarem documentos de assinatura
CREATE POLICY "Admins podem atualizar documentos de assinatura"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'candidate-documents' AND
  is_admin(auth.uid()) AND
  (storage.foldername(name))[1] = 'signature-docs'
);
