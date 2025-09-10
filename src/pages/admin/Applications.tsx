import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Users, FileText, Eye, CheckCircle, XCircle, UserPlus, Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';
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

const Applications = () => {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<DoctorApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchApplications();
    }
  }, [user, profile]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
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

      setApplications(transformedApplications);
    } catch (error) {
      console.error('Erro ao carregar applications:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de candidatos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStageStatus = async (applicationId: string, stageNumber: number, status: string, notes: string = '') => {
    try {
      setLoading(true);
      
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

      if (status === 'approved' && stageNumber === 2) {
        await supabase
          .from('stage_progress')
          .update({ status: 'available' })
          .eq('application_id', applicationId)
          .eq('stage_number', 3);

        await supabase
          .from('applications')
          .update({ current_stage: 3 })
          .eq('id', applicationId);
      }

      toast({
        title: status === 'approved' ? "Candidato aprovado!" : "Status atualizado",
        description: status === 'approved' ? "O candidato pode prosseguir para a próxima etapa." : "Status da etapa foi atualizado.",
      });

      await fetchApplications();
      
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Applications List */}
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
                <Card key={app.id} className="hover-scale transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary/20 hover:border-l-primary">
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
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {app.stage_progress.map((stage) => (
                            <div key={stage.stage_number} className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                {getStageName(stage.stage_number)}:
                              </span>
                              {getStatusBadge(stage.status)}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-muted">
                          Etapa {app.current_stage}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(app)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dialog for viewing details */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Candidato</DialogTitle>
              <DialogDescription>
                Informações completas e progresso do candidato
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
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
                
                <div>
                  <Label className="text-sm font-medium mb-3 block">Progresso das Etapas</Label>
                  <div className="space-y-3">
                    {selectedApplication.stage_progress.map((stage) => (
                      <div key={stage.stage_number} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{getStageName(stage.stage_number)}</span>
                          {stage.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Concluída em: {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(stage.status)}
                          {(stage.status === 'available' || stage.status === 'in_progress' || stage.status === 'pending') && stage.stage_number === 2 && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updateStageStatus(selectedApplication.id, stage.stage_number, 'approved')}
                                size="sm"
                                className="bg-success hover:bg-success/90"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                onClick={() => updateStageStatus(selectedApplication.id, stage.stage_number, 'rejected')}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Applications;