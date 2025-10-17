-- Habilitar Realtime para todas as tabelas relevantes ao Admin
-- Isso permite que o Admin veja atualizações em tempo real dos profissionais de saúde

-- Configurar replica identity para capturar todas as mudanças
ALTER TABLE public.stage_progress REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.signed_documents REPLICA IDENTITY FULL;
ALTER TABLE public.interview_fields REPLICA IDENTITY FULL;
ALTER TABLE public.form_fields REPLICA IDENTITY FULL;
ALTER TABLE public.signature_documents REPLICA IDENTITY FULL;
ALTER TABLE public.training_videos REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stage_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signed_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_fields;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_fields;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signature_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;