import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Mail, 
  Database,
  Save,
  RefreshCw,
  UserPlus,
  Monitor,
  Activity
} from 'lucide-react';
import { SystemSettingsTab } from '@/components/SystemSettingsTab';
import { ActiveSessionsTab } from '@/components/ActiveSessionsTab';
import { AuditLogsTab } from '@/components/AuditLogsTab';
import { BackupDataTab } from '@/components/BackupDataTab';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'RH Pulse',
    adminEmail: 'admin@rhpulse.com',
    emailNotifications: true,
    systemNotifications: true,
    autoApproval: false,
    maintenanceMode: false,
    dataRetention: '30',
    backupFrequency: 'daily'
  });

  const [loading, setLoading] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "Todas as configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.fullName) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setCreatingAdmin(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            full_name: newAdmin.fullName,
            role: 'admin'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Administrador criado",
        description: `Novo administrador ${newAdmin.fullName} foi criado com sucesso.`,
      });

      setNewAdmin({ email: '', password: '', fullName: '' });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar o administrador.",
        variant: "destructive",
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">Gerencie as configurações gerais da plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
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
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestão de Dados
              </CardTitle>
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
                  value={settings.dataRetention}
                  onChange={(e) => handleInputChange('dataRetention', e.target.value)}
                  placeholder="30"
                />
                <p className="text-sm text-muted-foreground">
                  Dados antigos serão arquivados após este período
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Frequência de Backup</Label>
                <select
                  id="backupFrequency"
                  className="w-full p-2 border border-input rounded-md bg-background"
                  value={settings.backupFrequency}
                  onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensalmente</option>
                </select>
              </div>

              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Fazer Backup Agora
              </Button>
            </CardContent>
          </Card>

          {/* Create Admin User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Criar Novo Administrador
              </CardTitle>
              <CardDescription>
                Criar uma nova conta de administrador para o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newAdminName">Nome Completo</Label>
                <Input
                  id="newAdminName"
                  value={newAdmin.fullName}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nome completo do administrador"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newAdminEmail">Email</Label>
                <Input
                  id="newAdminEmail"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newAdminPassword">Senha</Label>
                <Input
                  id="newAdminPassword"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Senha segura"
                />
                <p className="text-sm text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <Button 
                onClick={handleCreateAdmin} 
                disabled={creatingAdmin}
                className="w-full"
              >
                {creatingAdmin ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Administrador
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Configurações de segurança e acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Sessões Ativas</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gerencie as sessões ativas no sistema
                  </p>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Ver Sessões Ativas
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Logs de Auditoria</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Visualizar logs de atividades do sistema
                  </p>
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Ver Logs
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Configurações SMTP</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Configurar servidor de email para envio de notificações
                  </p>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Configurar SMTP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} disabled={loading} size="lg">
            {loading ? (
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
    </div>
  );
};

export default Settings;