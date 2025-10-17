-- Permitir que profissionais de saúde baixem documentos de assinatura
-- Isso corrige o erro "Bucket not found" ao tentar baixar contratos

-- Política para profissionais visualizarem documentos de assinatura
CREATE POLICY "Profissionais podem ver documentos de assinatura"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'candidate-documents' AND
  (storage.foldername(name))[1] = 'signature-docs'
);
