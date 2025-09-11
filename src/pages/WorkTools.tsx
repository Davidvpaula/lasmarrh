import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const WorkTools = () => {
  const { user } = useAuth();
  const [hasInterviewAccess, setHasInterviewAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkInterviewAccess();
    }
  }, [user]);

  const checkInterviewAccess = async () => {
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

      // Verificar se a entrevista foi concluída/aprovada
      if (applicationData) {
        const { data: progressData, error: progressError } = await supabase
          .from('stage_progress')
          .select('*')
          .eq('application_id', applicationData.id)
          .eq('stage_number', 2)
          .single();

        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }

        setHasInterviewAccess(progressData?.status === 'completed' || progressData?.status === 'approved');
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar acesso às ferramentas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasInterviewAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-warning" />
            </div>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              As ferramentas de trabalho só ficam disponíveis após a conclusão da etapa de entrevista.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/interview'}>
              Ir para Entrevista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
            <h1 className="text-3xl font-bold">Ferramentas de Trabalho</h1>
          </div>
          <p className="text-muted-foreground">
            Acesse as principais ferramentas utilizadas no dia a dia profissional
          </p>
        </div>

        {/* Work Tools */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-accent/10 via-background to-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Plataformas Integradas</CardTitle>
                <CardDescription className="text-base">
                  Ferramentas essenciais para comunicação, prontuários e agenda
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* SacMais */}
              <div className="space-y-3 p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                <h3 className="font-semibold text-lg text-foreground">SacMais</h3>
                <p className="text-sm text-muted-foreground">Para comunicação, via WhatsApp com Paciente.</p>
                <Button 
                  onClick={() => window.open('https://app2.sacmais.com.br/?_gl=1*1td7av0*_gcl_au*NzM5NTMwMjQzLjE3NTQ5Mzg0MDc.*_ga*OTY4ODEwODYuMTc0NzA2MTExMg..*_ga_BKPCTKDLJW*czE3NTc1OTA1MTQkbzIzJGcxJHQxNzU3NTkwNTQ1JGoyOSRsMCRoMA..#/auth/login', '_blank')}
                  className="w-full bg-gradient-primary hover:bg-primary-hover"
                >
                  Acessar SacMais
                </Button>
              </div>

              {/* Feegow */}
              <div className="space-y-3 p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                <h3 className="font-semibold text-lg text-foreground">Feegow</h3>
                <p className="text-sm text-muted-foreground">Prontuario Eletronico Médico</p>
                <Button 
                  onClick={() => window.open('https://app.feegow.com/main/?P=Login&U=&Partner=&qs=p%3Dhome%26pers%3D1', '_blank')}
                  className="w-full bg-gradient-primary hover:bg-primary-hover"
                >
                  Acessar Feegow
                </Button>
              </div>

              {/* Wix */}
              <div className="space-y-3 p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                <h3 className="font-semibold text-lg text-foreground">Wix</h3>
                <p className="text-sm text-muted-foreground">Agenda para vinculação do Google</p>
                <Button 
                  onClick={() => window.open('https://manage.wix.com/studio/sites?viewId=all-items-view', '_blank')}
                  className="w-full bg-gradient-primary hover:bg-primary-hover"
                >
                  Acessar Wix
                </Button>
              </div>
            </div>

            {/* Observação */}
            <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-sm text-foreground font-medium flex items-start gap-2">
                <span className="text-warning mt-0.5">ℹ️</span>
                <span>
                  <strong>Observação:</strong> Todas as ferramentas serão liberadas após a conclusão das etapas, 
                  acompanhadas de um login e senha padrão, que deverão ser alterados no primeiro acesso.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkTools;