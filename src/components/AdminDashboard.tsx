import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Users, FileText, LogOut, CheckCircle, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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

const AdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [user, profile]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Buscar applications, perfis e progresso sem joins implícitos (evita erros de relação)
      const { data: apps, error: appError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      const doctorIds = (apps || []).map((a: any) => a.doctor_id).filter(Boolean);
      const appIds = (apps || []).map((a: any) => a.id);

      const [profilesRes, stagesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, email, crm, phone')
          .in('user_id', doctorIds.length ? doctorIds : ['00000000-0000-0000-0000-000000000000']),
        supabase
          .from('stage_progress')
          .select('application_id, stage_number, status, completed_at, notes')
          .in('application_id', appIds.length ? appIds : ['00000000-0000-0000-0000-000000000000'])
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (stagesRes.error) throw stagesRes.error;

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const stagesByApp = new Map<string, any[]>();
      (stagesRes.data || []).forEach((s: any) => {
        const arr = stagesByApp.get(s.application_id) || [];
        arr.push({
          stage_number: s.stage_number,
          status: s.status,
          completed_at: s.completed_at,
          notes: s.notes || ''
        });
        stagesByApp.set(s.application_id, arr);
      });

      const applicationData = apps || [];


      if (appError) throw appError;

      const transformedApplications: DoctorApplication[] = (applicationData as any[])?.map((app: any) => {
        const p = profileMap.get(app.doctor_id) || {};
        const stages = stagesByApp.get(app.id) || [];
        return {
          id: app.id,
          doctor_id: app.doctor_id,
          status: app.status,
          current_stage: app.current_stage,
          created_at: app.created_at,
          profiles: {
            full_name: p.full_name || 'Nome não informado',
            email: p.email || 'Email não informado',
            crm: p.crm || '',
            phone: p.phone || ''
          },
          stage_progress: stages
        };
      }) || [];

      setApplications(transformedApplications);
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
      <header className="hidden lg:block bg-card border-b shadow-sm sticky top-0 z-10 backdrop-blur-sm">
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo ao Dashboard</h2>
          <p className="text-muted-foreground">Visão geral do sistema e métricas principais</p>
        </div>

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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Gerenciar Candidatos
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todas as candidaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/admin/applications')} 
                className="w-full"
              >
                Ver Candidatos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Revisar Documentos
              </CardTitle>
              <CardDescription>
                Analise documentos enviados pelos candidatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/admin/forms')} 
                className="w-full"
              >
                Ver Documentos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Entrevistas
              </CardTitle>
              <CardDescription>
                Gerencie entrevistas e aprovações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/admin/interviews')} 
                className="w-full"
              >
                Ver Entrevistas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas ações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{app.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">Etapa {app.current_stage}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Date(app.created_at).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              ))}
              
              {applications.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;