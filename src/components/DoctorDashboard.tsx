import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Lock, FileText, Play, Award, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StageProgress {
  stage_number: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

interface Application {
  id: string;
  status: string;
  current_stage: number;
}

const STAGES = [
  { id: 1, title: 'Cadastro', description: 'Registro inicial no sistema', icon: CheckCircle },
  { id: 2, title: 'Entrevista', description: 'Processo de entrevista (aguarda aprovação)', icon: FileText },
  { id: 3, title: 'Documentos', description: 'Envio de documentação obrigatória', icon: FileText },
  { id: 4, title: 'Treinamento', description: 'Módulos de capacitação obrigatória', icon: Play },
  { id: 5, title: 'Conclusão', description: 'Finalização do processo seletivo', icon: Award },
  { id: 6, title: 'Treinamentos Adicionais', description: 'Cursos complementares (opcional)', icon: Play, optional: true },
];

const DoctorDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplicationData();
    }
  }, [user]);

  const fetchApplicationData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar application do usuário
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('doctor_id', user.id)
        .single();

      if (appError && appError.code !== 'PGRST116') {
        throw appError;
      }

      // Buscar progresso das etapas
      if (applicationData) {
        const { data: progressData, error: progressError } = await supabase
          .from('stage_progress')
          .select('*')
          .eq('application_id', applicationData.id)
          .order('stage_number');

        if (progressError) {
          throw progressError;
        }

        setApplication(applicationData);
        setStageProgress(progressData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getStageStatus = (stageNumber: number) => {
    const stage = stageProgress.find(s => s.stage_number === stageNumber);
    return stage?.status || 'locked';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'available':
      case 'in_progress':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Lock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-success text-success-foreground">Concluída</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-success text-success-foreground">Aprovada</Badge>;
      case 'available':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Disponível</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Em Andamento</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return <Badge variant="outline">Bloqueada</Badge>;
    }
  };

  const calculateProgress = () => {
    const completedStages = stageProgress.filter(s => 
      (s.status === 'completed' || s.status === 'approved') && s.stage_number <= 5 // Only count first 5 stages for main progress
    ).length;
    return (completedStages / 5) * 100;
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
              <span className="ml-4 text-sm text-muted-foreground">Painel do Candidato</span>
            </div>
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs text-primary">Em Processo</span>
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
        {/* Progress Overview */}
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-primary/5 via-background to-accent/5 animate-fade-in">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Award className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Progresso do Processo Seletivo</CardTitle>
            <CardDescription className="text-base">
              Acompanhe seu progresso e próximas etapas do processo de seleção
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Progresso Geral</span>
                <span className="text-primary">{Math.round(calculateProgress())}% concluído</span>
              </div>
              <div className="relative">
                <Progress value={calculateProgress()} className="h-3 bg-muted" />
                <div className="absolute inset-0 bg-gradient-primary opacity-90 rounded-full" 
                     style={{ width: `${calculateProgress()}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Início</span>
                <span className={calculateProgress() >= 50 ? "text-primary font-medium" : ""}>Meio do processo</span>
                <span className={calculateProgress() >= 100 ? "text-success font-medium" : ""}>Conclusão</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Process Stages */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
            <h2 className="text-2xl font-bold">Processo Seletivo - Etapas Obrigatórias</h2>
          </div>
          {STAGES.filter(stage => !stage.optional).map((stage, index) => {
            const status = getStageStatus(stage.id);
            const stageData = stageProgress.find(s => s.stage_number === stage.id);
            const Icon = stage.icon;

            return (
              <Card key={stage.id} 
                    className={`transition-all duration-300 hover-scale animate-fade-in ${
                      status === 'available' || status === 'in_progress' 
                        ? 'ring-2 ring-primary ring-opacity-50 shadow-xl border-primary/20 bg-gradient-to-r from-primary/5 to-transparent' 
                        : status === 'completed' || status === 'approved'
                        ? 'border-success/30 bg-gradient-to-r from-success/5 to-transparent'
                        : 'hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 150}ms` }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-6 w-6 ${
                          status === 'completed' || status === 'approved' 
                            ? 'text-success' 
                            : status === 'available' || status === 'in_progress'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`} />
                        <div>
                          <CardTitle className="text-lg">
                            Etapa {stage.id}: {stage.title}
                          </CardTitle>
                          <CardDescription>{stage.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      {getStatusBadge(status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {status === 'available' && (
                    <Button 
                      className="bg-gradient-primary hover:bg-primary-hover"
                      onClick={() => {
                        if (stage.id === 2) window.location.href = '/interview';
                        if (stage.id === 3) window.location.href = '/documents';
                        if (stage.id === 4) window.location.href = '/training/professional';
                      }}
                    >
                      Iniciar Etapa
                    </Button>
                  )}
                  
                  {status === 'in_progress' && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (stage.id === 2) window.location.href = '/interview';
                        if (stage.id === 3) window.location.href = '/documents';
                        if (stage.id === 4) window.location.href = '/training/professional';
                      }}
                    >
                      Continuar Etapa
                    </Button>
                  )}
                  
                  {(status === 'completed' || status === 'approved') && stageData?.completed_at && (
                    <div className="text-sm text-muted-foreground">
                      Concluída em {new Date(stageData.completed_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Optional Additional Training Stage */}
        {stageProgress.find(s => s.stage_number === 5 && (s.status === 'completed' || s.status === 'approved')) && (
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-semibold mb-4">Treinamentos Adicionais - Etapa Opcional</h2>
            {STAGES.filter(stage => stage.optional).map((stage) => {
              const status = getStageStatus(stage.id);
              const stageData = stageProgress.find(s => s.stage_number === stage.id);
              const Icon = stage.icon;

              return (
                <Card key={stage.id} className={`transition-all duration-200 border-dashed ${
                  status === 'available' || status === 'in_progress' 
                    ? 'ring-2 ring-secondary ring-opacity-50 shadow-md' 
                    : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-6 w-6 ${
                            status === 'completed' || status === 'approved' 
                              ? 'text-success' 
                              : status === 'available' || status === 'in_progress'
                              ? 'text-secondary'
                              : 'text-muted-foreground'
                          }`} />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Etapa {stage.id}: {stage.title}
                              <Badge variant="outline" className="text-xs">Opcional</Badge>
                            </CardTitle>
                            <CardDescription>{stage.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {status === 'available' && (
                      <Button 
                        variant="secondary"
                        className="bg-secondary hover:bg-secondary/80"
                        onClick={() => {
                          if (stage.id === 6) window.location.href = '/training/professional';
                        }}
                      >
                        Iniciar Treinamentos Extras
                      </Button>
                    )}
                    
                    {status === 'in_progress' && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (stage.id === 6) window.location.href = '/training/professional';
                        }}
                      >
                        Continuar Treinamentos
                      </Button>
                    )}
                    
                    {(status === 'completed' || status === 'approved') && stageData?.completed_at && (
                      <div className="text-sm text-muted-foreground">
                        Concluída em {new Date(stageData.completed_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;