-- Habilitar Realtime para a tabela training_progress
-- Isso permite que o Admin veja atualizações em tempo real do progresso dos profissionais

-- Configurar replica identity para capturar todas as mudanças
ALTER TABLE public.training_progress REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_progress;
