import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Lock, FileText, Play, Award, LogOut } from 'lucide-react';

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

// Simulando dados de profissional para desenvolvimento
const mockProfile = {
  user_id: 'mock-user-123',
  full_name: 'Dr. João Silva',
  email: 'joao.silva@email.com',
  role: 'doctor'
};

const DoctorDashboard = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);
  const [loading, setLoading] = useState(false); // Desabilitado para desenvolvimento

  // Mock data para desenvolvimento
  const mockApplication = {
    id: 'app-123',
    status: 'active',
    current_stage: 2
  };

  const mockStageProgress = [
    { stage_number: 1, status: 'completed', completed_at: '2024-01-15T10:00:00Z', notes: 'Cadastro realizado com sucesso' },
    { stage_number: 2, status: 'in_progress', started_at: '2024-01-20T09:00:00Z', notes: 'Aguardando agendamento da entrevista' },
    { stage_number: 3, status: 'locked', notes: null },
    { stage_number: 4, status: 'locked', notes: null },
    { stage_number: 5, status: 'locked', notes: null },
    { stage_number: 6, status: 'locked', notes: null },
  ];

  useEffect(() => {
    // Simulando carregamento de dados para desenvolvimento
    setApplication(mockApplication);
    setStageProgress(mockStageProgress);
  }, []);

  const handleSignOut = () => {
    window.location.href = '/';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">RH Pulse</h1>
              <span className="ml-4 text-sm text-muted-foreground">Painel do Candidato</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Olá, {mockProfile?.full_name}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progresso do Processo Seletivo</CardTitle>
            <CardDescription>
              Acompanhe seu progresso através das etapas do processo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progresso Geral</span>
                <span>{Math.round(calculateProgress())}% concluído</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Main Process Stages */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Processo Seletivo - Etapas Obrigatórias</h2>
          {STAGES.filter(stage => !stage.optional).map((stage) => {
            const status = getStageStatus(stage.id);
            const stageData = stageProgress.find(s => s.stage_number === stage.id);
            const Icon = stage.icon;

            return (
              <Card key={stage.id} className={`transition-all duration-200 ${
                status === 'available' || status === 'in_progress' 
                  ? 'ring-2 ring-primary ring-opacity-50 shadow-md' 
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
                  {stageData?.notes && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {stageData.notes}
                    </p>
                  )}
                  
                  {status === 'available' && (
                    <Button 
                      className="bg-gradient-primary hover:bg-primary-hover"
                      onClick={() => {
                        if (stage.id === 2) window.location.href = '/interview';
                        if (stage.id === 3) window.location.href = '/documents';
                        if (stage.id === 4) window.location.href = '/training';
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
                        if (stage.id === 4) window.location.href = '/training';
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
                    {stageData?.notes && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {stageData.notes}
                      </p>
                    )}
                    
                    {status === 'available' && (
                      <Button 
                        variant="secondary"
                        className="bg-secondary hover:bg-secondary/80"
                        onClick={() => {
                          if (stage.id === 6) window.location.href = '/training';
                        }}
                      >
                        Iniciar Treinamentos Extras
                      </Button>
                    )}
                    
                    {status === 'in_progress' && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (stage.id === 6) window.location.href = '/training';
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