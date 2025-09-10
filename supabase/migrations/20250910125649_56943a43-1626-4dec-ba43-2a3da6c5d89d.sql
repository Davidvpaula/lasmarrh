-- Criar tabela para configurações do sistema
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem configurações
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Inserir configurações padrão
INSERT INTO public.system_settings (key, value, description) VALUES
('site_name', '"RH Pulse"', 'Nome do sistema'),
('admin_email', '"admin@rhpulse.com"', 'Email do administrador principal'),
('email_notifications', 'true', 'Ativar notificações por email'),
('system_notifications', 'true', 'Ativar notificações do sistema'),
('auto_approval', 'false', 'Aprovação automática de candidatos'),
('maintenance_mode', 'false', 'Modo de manutenção'),
('data_retention_days', '30', 'Dias para retenção de dados'),
('backup_frequency', '"daily"', 'Frequência de backup');

-- Criar tabela para logs de auditoria
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS para logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Criar tabela para sessões ativas
CREATE TABLE public.active_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  session_token text NOT NULL,
  ip_address inet,
  user_agent text,
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS para sessões
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem sessões
CREATE POLICY "Admins can view active sessions" 
ON public.active_sessions 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Política para usuários gerenciarem suas próprias sessões
CREATE POLICY "Users can view their own sessions" 
ON public.active_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registrar logs de auditoria
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    now()
  );
END;
$$;