import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';
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
              <Link className="h-8 w-8 text-warning" />
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
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
            <h1 className="text-2xl sm:text-3xl font-bold">Ferramentas de Trabalho</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acesse as principais ferramentas utilizadas no dia a dia profissional
          </p>
        </div>

        {/* Work Tools */}
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <Link className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Plataformas Integradas</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Ferramentas essenciais para comunicação, prontuários e agenda
              </p>
            </div>
          </div>
          
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader className="pb-4">
            </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {/* SacMais */}
              <div className="group space-y-4 p-4 sm:p-6 rounded-xl border border-border/50 hover:border-primary/30 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">SacMais</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Para comunicação via WhatsApp com pacientes de forma segura e profissional.
                  </p>
                </div>
                <Button 
                  onClick={() => window.open('https://app2.sacmais.com.br/?_gl=1*1td7av0*_gcl_au*NzM5NTMwMjQzLjE3NTQ5Mzg0MDc.*_ga*OTY4ODEwODYuMTc0NzA2MTExMg..*_ga_BKPCTKDLJW*czE3NTc1OTA1MTQkbzIzJGcxJHQxNzU3NTkwNTQ1JGoyOSRsMCRoMA..#/auth/login', '_blank')}
                  className="w-full bg-gradient-primary hover:bg-primary-hover hover-scale text-sm sm:text-base py-2.5"
                >
                  Acessar SacMais
                </Button>
              </div>

              {/* Feegow */}
              <div className="group space-y-4 p-4 sm:p-6 rounded-xl border border-border/50 hover:border-primary/30 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">Feegow</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Prontuário Eletrônico Médico completo para gestão de consultas e histórico.
                  </p>
                </div>
                <Button 
                  onClick={() => window.open('https://app.feegow.com/main/?P=Login&U=&Partner=&qs=p%3Dhome%26pers%3D1', '_blank')}
                  className="w-full bg-gradient-primary hover:bg-primary-hover hover-scale text-sm sm:text-base py-2.5"
                >
                  Acessar Feegow
                </Button>
              </div>

              {/* Wix */}
              <div className="group space-y-4 p-4 sm:p-6 rounded-xl border border-border/50 hover:border-primary/30 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 md:col-span-2 xl:col-span-1">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">Wix</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Agenda integrada para vinculação com Google Calendar e gestão de horários.
                  </p>
                </div>
                <Button 
                  onClick={() => window.open('https://manage.wix.com/studio/sites?viewId=all-items-view', '_blank')}
                  className="w-full bg-gradient-primary hover:bg-primary-hover hover-scale text-sm sm:text-base py-2.5"
                >
                  Acessar Wix
                </Button>
              </div>
            </div>

            {/* Observação */}
            <div className="mt-6 lg:mt-8 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-warning/5 to-warning/10 border border-warning/20 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-warning text-sm font-bold">!</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Observação Importante</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Todas as ferramentas serão liberadas após a conclusão das etapas do processo seletivo, 
                    acompanhadas de um login e senha padrão que deverão ser alterados no primeiro acesso.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkTools;