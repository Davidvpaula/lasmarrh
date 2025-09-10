import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Users, FileText, Play, Settings, LogOut, Eye, CheckCircle, XCircle, UserPlus, Upload, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import TrainingManagementTab from './TrainingManagementTab';
import UploadsManagementTab from './UploadsManagementTab';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { user, profile, signOut } = useAuth();
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<DoctorApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    full_name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [user, profile]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as applications com dados do doctor
      const { data: applicationData, error: appError } = await supabase
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
            started_at,
            completed_at,
            notes
          )
        `)
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      // Transformar dados para o formato esperado
      const transformedApplications: DoctorApplication[] = applicationData?.map(app => ({
        id: app.id,
        doctor_id: app.doctor_id,
        status: app.status,
        current_stage: app.current_stage,
        created_at: app.created_at,
        profiles: {
          full_name: app.profiles?.full_name || 'Nome não informado',
          email: app.profiles?.email || 'Email não informado',
          crm: app.profiles?.crm || '',
          phone: app.profiles?.phone || ''
        },
        stage_progress: app.stage_progress || []
      })) || [];

      // Buscar admins
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;

      const transformedAdmins: AdminUser[] = adminData?.map(admin => ({
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
        created_at: admin.created_at
      })) || [];

      setApplications(transformedApplications);
      setAdmins(transformedAdmins);
    } catch (error) {
      console.error('Erro ao carregar dados admin:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard administrativo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const updateStageStatus = async (applicationId: string, stageNumber: number, status: string, notes: string = '') => {
    try {
      setLoading(true);
      
      // Update the specific stage
      await supabase
        .from('stage_progress')
        .update({
          status: status as 'completed' | 'in_progress' | 'locked' | 'rejected' | 'available' | 'approved',
          completed_at: status === 'approved' ? new Date().toISOString() : null,
          notes: notes,
          approved_by: status === 'approved' ? user?.id : null
        })
        .eq('application_id', applicationId)
        .eq('stage_number', stageNumber);

      // If approving interview (stage 2), unlock documents stage (stage 3)
      if (status === 'approved' && stageNumber === 2) {
        await supabase
          .from('stage_progress')
          .update({ status: 'available' })
          .eq('application_id', applicationId)
          .eq('stage_number', 3);

        // Update current stage in applications table
        await supabase
          .from('applications')
          .update({ current_stage: 3 })
          .eq('id', applicationId);
      }

      toast({
        title: status === 'approved' ? "Candidato aprovado!" : "Status atualizado",
        description: status === 'approved' ? "O candidato pode prosseguir para a próxima etapa." : "Status da etapa foi atualizado.",
      });

      // Recarregar dados
      await fetchAdminData();
      
    } catch (error) {
      console.error('Error updating stage status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da etapa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    if (!newAdminData.full_name || !newAdminData.email || !newAdminData.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar usuário admin via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminData.email,
        password: newAdminData.password,
        options: {
          data: {
            full_name: newAdminData.full_name,
            role: 'admin'
          }
        }
      });

      if (authError) throw authError;
      
      toast({
        title: "Admin criado",
        description: "Administrador criado com sucesso.",
      });
      
      setNewAdminData({ full_name: '', email: '', password: '' });
      await fetchAdminData(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao criar admin:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar administrador.",
        variant: "destructive",
      });
    }
  };

  const getStageStatusCount = (stageNumber: number) => {
    return applications.reduce((acc, app) => {
      const stage = app.stage_progress.find(s => s.stage_number === stageNumber);
      const status = stage?.status || 'locked';
      
      if (status === 'completed' || status === 'approved') acc.completed++;
      else if (status === 'available' || status === 'in_progress' || status === 'pending') acc.pending++;
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
      case 'pending':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return <Badge variant="outline">Bloqueada</Badge>;
    }
  };

  const handleViewDetails = (app: DoctorApplication) => {
    setSelectedApplication(app);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-fade-in">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">RH Pulse</h1>
              <span className="ml-4 text-sm text-muted-foreground">Painel Administrativo</span>
            </div>
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-xs text-success-foreground">Sistema Online</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Olá, {profile?.full_name || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hover-scale">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <Card className="hover-scale transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{applications.length}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                médicos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 hover:shadow-lg border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrevistas Pendentes</CardTitle>
              <div className="p-2 bg-warning/10 rounded-full">
                <Clock className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{getStageStatusCount(2).pending}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                aguardando entrevista
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 hover:shadow-lg border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos para Revisar</CardTitle>
              <div className="p-2 bg-accent/10 rounded-full">
                <FileText className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{getStageStatusCount(3).pending}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                documentações pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 hover:shadow-lg border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processos Concluídos</CardTitle>
              <div className="p-2 bg-success/10 rounded-full">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{getStageStatusCount(5).completed}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                candidatos aprovados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="applications" className="space-y-6 animate-fade-in">
          <TabsList className="grid w-full grid-cols-5 bg-muted/30 p-1 rounded-lg">
            <TabsTrigger value="applications" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Candidaturas</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Treinamentos</span>
            </TabsTrigger>
            <TabsTrigger value="uploads" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Uploads</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admins</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Gestão</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="animate-fade-in">
            <Card className="shadow-md border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Lista de Candidatos
                    </CardTitle>
                    <CardDescription>
                      Gerencie todas as candidaturas e seu progresso em tempo real
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {applications.length} Candidatos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {applications.map((app, index) => (
                    <Card key={app.id} className="hover-scale transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary/20 hover:border-l-primary animate-fade-in" 
                          style={{ animationDelay: `${index * 100}ms` }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                                {app.profiles.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{app.profiles.full_name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  {app.profiles.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Etapa atual: {app.current_stage}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(app.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewDetails(app)}
                              className="hover-scale"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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

          <TabsContent value="training">
            <TrainingManagementTab />
          </TabsContent>

          <TabsContent value="uploads">
            <UploadsManagementTab />
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Administradores do Sistema</CardTitle>
                    <CardDescription>
                      Gerencie os usuários com acesso administrativo
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-primary hover:bg-primary-hover">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Administrador</DialogTitle>
                        <DialogDescription>
                          Adicione um novo usuário com permissões administrativas
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="admin_name">Nome Completo</Label>
                          <Input
                            id="admin_name"
                            value={newAdminData.full_name}
                            onChange={(e) => setNewAdminData({ ...newAdminData, full_name: e.target.value })}
                            placeholder="Digite o nome completo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="admin_email">Email</Label>
                          <Input
                            id="admin_email"
                            type="email"
                            value={newAdminData.email}
                            onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                            placeholder="Digite o email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="admin_password">Senha Temporária</Label>
                          <Input
                            id="admin_password"
                            type="password"
                            value={newAdminData.password}
                            onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                            placeholder="Digite uma senha temporária"
                          />
                        </div>
                        <Button onClick={createAdmin} className="w-full">
                          Criar Administrador
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <Card key={admin.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{admin.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>
                          <Badge variant="outline">Administrador</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Usuários e Sistema</CardTitle>
                <CardDescription>
                  Ferramentas avançadas de administração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidades de gestão em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para ver detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Candidatura</DialogTitle>
            <DialogDescription>
              Informações completas para {selectedApplication?.profiles.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Informações Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nome Completo</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.profiles.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.profiles.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">CRM</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.profiles.crm || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.profiles.phone || 'Não informado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progresso das Etapas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Progresso das Etapas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedApplication.stage_progress.map((stage) => {
                      let interviewData = null;
                      if (stage.stage_number === 2 && stage.notes) {
                        try {
                          interviewData = JSON.parse(stage.notes);
                        } catch (e) {
                          // Ignore parsing errors
                        }
                      }

                      return (
                        <div key={stage.stage_number} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium">
                                Etapa {stage.stage_number}: {getStageName(stage.stage_number)}
                              </div>
                              {getStatusBadge(stage.status)}
                            </div>
                            {stage.completed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Concluída em: {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                            {interviewData && (
                              <div className="mt-2 p-2 bg-muted/30 rounded">
                                <p className="text-xs font-medium mb-1">Dados da Entrevista:</p>
                                <div className="text-xs space-y-1">
                                  {interviewData.motivation && <p><strong>Motivação:</strong> {interviewData.motivation}</p>}
                                  {interviewData.experience && <p><strong>Experiência:</strong> {interviewData.experience}</p>}
                                  {interviewData.expectations && <p><strong>Expectativas:</strong> {interviewData.expectations}</p>}
                                  {interviewData.whatsapp && <p><strong>WhatsApp:</strong> {interviewData.whatsapp}</p>}
                                  {interviewData.availability && (
                                    <div>
                                      <p><strong>Disponibilidade:</strong></p>
                                      {Object.entries(interviewData.availability).map(([day, slots]: [string, any]) => (
                                        <p key={day} className="ml-2">
                                          {day}: {Array.isArray(slots) ? slots.join(', ') : 'Não disponível'}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {(stage.status === 'pending' || stage.status === 'available') && (
                            <div className="flex gap-2 ml-4">
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
                                Rejeitar
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;