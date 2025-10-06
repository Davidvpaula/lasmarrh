import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SettingsIcon, Save, RefreshCw } from 'lucide-react';

interface SystemSettings {
  siteName: string;
  adminEmail: string;
  emailNotifications: boolean;
  systemNotifications: boolean;
  autoApproval: boolean;
  maintenanceMode: boolean;
  dataRetentionDays: string;
  backupFrequency: string;
}

export const SystemSettingsTab = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'RH Pulse',
    adminEmail: 'admin@rhpulse.com',
    emailNotifications: true,
    systemNotifications: true,
    autoApproval: false,
    maintenanceMode: false,
    dataRetentionDays: '30',
    backupFrequency: 'daily'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>) || {};

      setSettings({
        siteName: settingsMap.site_name || 'RH Pulse',
        adminEmail: settingsMap.admin_email || 'admin@rhpulse.com',
        emailNotifications: settingsMap.email_notifications || true,
        systemNotifications: settingsMap.system_notifications || true,
        autoApproval: settingsMap.auto_approval || false,
        maintenanceMode: settingsMap.maintenance_mode || false,
        dataRetentionDays: settingsMap.data_retention_days?.toString() || '30',
        backupFrequency: settingsMap.backup_frequency || 'daily'
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações do sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToUpdate = [
        { key: 'site_name', value: JSON.stringify(settings.siteName) },
        { key: 'admin_email', value: JSON.stringify(settings.adminEmail) },
        { key: 'email_notifications', value: JSON.stringify(settings.emailNotifications) },
        { key: 'system_notifications', value: JSON.stringify(settings.systemNotifications) },
        { key: 'auto_approval', value: JSON.stringify(settings.autoApproval) },
        { key: 'maintenance_mode', value: JSON.stringify(settings.maintenanceMode) },
        { key: 'data_retention_days', value: settings.dataRetentionDays },
        { key: 'backup_frequency', value: JSON.stringify(settings.backupFrequency) }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key: setting.key,
            value: setting.value
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      // Log da ação
      await supabase.rpc('log_audit_event', {
        _action: 'UPDATE_SYSTEM_SETTINGS',
        _table_name: 'system_settings',
        _details: JSON.stringify(settings)
      });

      toast({
        title: "Configurações salvas",
        description: "Todas as configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof SystemSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Configurações básicas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Nome do Sistema</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => handleInputChange('siteName', e.target.value)}
              placeholder="Nome do sistema"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Email do Administrador</Label>
            <Input
              id="adminEmail"
              type="email"
              value={settings.adminEmail}
              onChange={(e) => handleInputChange('adminEmail', e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Modo de Manutenção</h4>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativar Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Quando ativo, apenas administradores podem acessar o sistema
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Configure as preferências de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações importantes por email
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações do Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Exibir notificações no painel administrativo
              </p>
            </div>
            <Switch
              checked={settings.systemNotifications}
              onCheckedChange={(checked) => handleInputChange('systemNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aprovação Automática</Label>
              <p className="text-sm text-muted-foreground">
                Aprovar automaticamente candidatos que atendem aos critérios
              </p>
            </div>
            <Switch
              checked={settings.autoApproval}
              onCheckedChange={(checked) => handleInputChange('autoApproval', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Dados</CardTitle>
          <CardDescription>
            Configurações de backup e retenção de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="dataRetention">Retenção de Dados (dias)</Label>
            <Input
              id="dataRetention"
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) => handleInputChange('dataRetentionDays', e.target.value)}
              placeholder="30"
            />
            <p className="text-sm text-muted-foreground">
              Dados antigos serão arquivados após este período
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backupFrequency">Frequência de Backup</Label>
            <Select
              value={settings.backupFrequency}
              onValueChange={(value) => handleInputChange('backupFrequency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">A cada hora</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};