import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, FileText, Play, Settings, LogOut, Eye, CheckCircle, XCircle, UserPlus, Download, MessageSquare } from 'lucide-react';
import TrainingManagement from './TrainingManagement';

interface DoctorApplication {
  id: string;
  doctor_id: string;
  status: string;
  current_stage: number;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    crm: string;
    phone: string;
  };
  stage_progress: Array<{
    stage_number: number;
    status: string;
    completed_at: string;
    notes: string;
  }>;
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<DoctorApplication | null>(null);
  const [newAdminData, setNewAdminData] = useState({
    full_name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchApplications();
    fetchAdmins();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles!applications_doctor_id_fkey (
            full_name,
            email,
            crm,
            phone
          ),
          stage_progress (
            stage_number,
            status,
            completed_at,
            notes
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const updateStageStatus = async (applicationId: string, stageNumber: number, status: 'approved' | 'rejected' | 'completed' | 'available' | 'in_progress' | 'locked', notes: string = '') => {
    try {
      const { error } = await supabase
        .from('stage_progress')
        .update({ 
          status, 
          notes,
          completed_at: status === 'approved' ? new Date().toISOString() : null 
        })
        .eq('application_id', applicationId)
        .eq('stage_number', stageNumber);

      if (error) throw error;

      // Update current stage if approved
      if (status === 'approved' && stageNumber < 5) {
        await supabase
          .from('applications')
          .update({ current_stage: stageNumber + 1 })
          .eq('id', applicationId);

        // Unlock next stage
        await supabase
          .from('stage_progress')
          .update({ status: 'available' })
          .eq('application_id', applicationId)
          .eq('stage_number', stageNumber + 1);
      }

      toast({
        title: "Status atualizado",
        description: "O status da etapa foi atualizado com sucesso.",
      });

      fetchApplications();
    } catch (error) {
      console.error('Error updating stage status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const createAdmin = async () => {
    try {
      const { error } = await supabase.auth.signUp({
        email: newAdminData.email,
        password: newAdminData.password,
        options: {
          data: {
            full_name: newAdminData.full_name,
            role: 'admin'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Admin criado",
        description: "Nova conta de admin criada com sucesso.",
      });

      setNewAdminData({ full_name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta de admin.",
        variant: "destructive",
      });
    }
  };

  const getStageStatusCount = (stageNumber: number) => {
    return applications.reduce((acc, app) => {
      const stage = app.stage_progress.find(s => s.stage_number === stageNumber);
      const status = stage?.status || 'locked';
      
      if (status === 'completed' || status === 'approved') acc.completed++;
      else if (status === 'available' || status === 'in_progress') acc.pending++;
      else acc.blocked++;
      
      return acc;
    }, { completed: 0, pending: 0, blocked: 0 });
  };

  const getStageName = (stageNumber: number) => {
    const stages = ['', 'Cadastro', 'Entrevista', 'Documentos', 'Treinamento', 'Conclusão', 'Treinamentos Adicionais'];
    return stages[stageNumber] || 'Desconhecida';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <Badge variant="secondary" className="bg-success text-success-foreground">Concluída</Badge>;
      case 'available':
      case 'in_progress':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return <Badge variant="outline">Bloqueada</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">RH Pulse</h1>
              <span className="ml-4 text-sm text-muted-foreground">Painel Administrativo</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Olá, {profile?.full_name}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">médicos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrevistas Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStageStatusCount(2).pending}</div>
              <p className="text-xs text-muted-foreground">aguardando entrevista</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos para Revisar</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStageStatusCount(3).pending}</div>
              <p className="text-xs text-muted-foreground">documentações pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processos Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStageStatusCount(5).completed}</div>
              <p className="text-xs text-muted-foreground">candidatos aprovados</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Candidaturas</TabsTrigger>
            <TabsTrigger value="management">Gestão de Usuários</TabsTrigger>
            <TabsTrigger value="training">Treinamentos</TabsTrigger>
            <TabsTrigger value="admins">Administradores</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Candidatos</CardTitle>
                <CardDescription>
                  Gerencie todas as candidaturas e seu progresso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{app.profiles.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{app.profiles.email}</p>
                        {app.profiles.crm && (
                          <p className="text-sm text-muted-foreground">CRM: {app.profiles.crm}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Etapa {app.current_stage}: {getStageName(app.current_stage)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Criado em {new Date(app.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>
                                <Eye className="h-4 w-4 mr-1" />
                                Visualizar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Candidatura</DialogTitle>
                                <DialogDescription>
                                  Informações completas e gestão de etapas para {selectedApplication?.profiles.full_name}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedApplication && (
                                <div className="space-y-6">
                                  {/* Informações Pessoais */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Nome Completo</Label>
                                        <p className="text-sm">{selectedApplication.profiles.full_name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Email</Label>
                                        <p className="text-sm">{selectedApplication.profiles.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">CRM</Label>
                                        <p className="text-sm">{selectedApplication.profiles.crm || 'Não informado'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Telefone</Label>
                                        <p className="text-sm">{selectedApplication.profiles.phone || 'Não informado'}</p>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Progresso das Etapas */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Progresso das Etapas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        {selectedApplication.stage_progress
                                          .sort((a, b) => a.stage_number - b.stage_number)
                                          .map((stage) => (
                                          <div key={stage.stage_number} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <div>
                                                <h4 className="font-medium">
                                                  Etapa {stage.stage_number}: {getStageName(stage.stage_number)}
                                                </h4>
                                                {getStatusBadge(stage.status)}
                                              </div>
                                              <div className="flex gap-2">
                                                {stage.status === 'in_progress' && (
                                                  <>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => updateStageStatus(selectedApplication.id, stage.stage_number, 'approved')}
                                                      className="bg-success hover:bg-success/90"
                                                    >
                                                      <CheckCircle className="h-4 w-4 mr-1" />
                                                      Aprovar
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="destructive"
                                                      onClick={() => updateStageStatus(selectedApplication.id, stage.stage_number, 'rejected')}
                                                    >
                                                      <XCircle className="h-4 w-4 mr-1" />
                                                      Reprovar
                                                    </Button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            {stage.notes && (
                                              <div className="mt-2">
                                                <Label className="text-sm font-medium">Observações:</Label>
                                                <p className="text-sm text-muted-foreground">{stage.notes}</p>
                                              </div>
                                            )}
                                            {stage.completed_at && (
                                              <div className="mt-2">
                                                <Label className="text-sm font-medium">Concluída em:</Label>
                                                <p className="text-sm text-muted-foreground">
                                                  {new Date(stage.completed_at).toLocaleString('pt-BR')}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {applications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma candidatura encontrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>
                  Gerencie candidatos, aprove etapas e acompanhe formulários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Estatísticas por Etapa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5].map((stageNumber) => {
                      const stats = getStageStatusCount(stageNumber);
                      return (
                        <Card key={stageNumber}>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Etapa {stageNumber}: {getStageName(stageNumber)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Concluídas:</span>
                                <Badge variant="secondary" className="bg-success text-success-foreground">
                                  {stats.completed}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Pendentes:</span>
                                <Badge variant="secondary" className="bg-warning text-warning-foreground">
                                  {stats.pending}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Bloqueadas:</span>
                                <Badge variant="outline">{stats.blocked}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Lista de candidatos que precisam de ação */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Candidatos Pendentes de Aprovação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {applications
                          .filter(app => 
                            app.stage_progress.some(stage => stage.status === 'in_progress')
                          )
                          .map((app) => {
                            const pendingStage = app.stage_progress.find(stage => stage.status === 'in_progress');
                            return (
                              <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg bg-warning/5">
                                <div className="flex-1">
                                  <h3 className="font-semibold">{app.profiles.full_name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Etapa {pendingStage?.stage_number}: {getStageName(pendingStage?.stage_number || 0)}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateStageStatus(app.id, pendingStage?.stage_number || 0, 'approved')}
                                    className="bg-success hover:bg-success/90"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateStageStatus(app.id, pendingStage?.stage_number || 0, 'rejected')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reprovar
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        
                        {applications.filter(app => 
                          app.stage_progress.some(stage => stage.status === 'in_progress')
                        ).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum candidato pendente de aprovação</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <TrainingManagement />
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Administradores</CardTitle>
                    <CardDescription>
                      Gerencie contas de administradores do sistema
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Novo Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Nova Conta de Admin</DialogTitle>
                        <DialogDescription>
                          Preencha os dados para criar uma nova conta de administrador
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="full_name">Nome Completo</Label>
                          <Input
                            id="full_name"
                            value={newAdminData.full_name}
                            onChange={(e) => setNewAdminData({...newAdminData, full_name: e.target.value})}
                            placeholder="Digite o nome completo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newAdminData.email}
                            onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                            placeholder="Digite o email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Senha</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newAdminData.password}
                            onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
                            placeholder="Digite a senha"
                          />
                        </div>
                        <Button onClick={createAdmin} className="w-full">
                          Criar Admin
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{admin.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Criado em {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        Admin
                      </Badge>
                    </div>
                  ))}
                  
                  {admins.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum administrador encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;