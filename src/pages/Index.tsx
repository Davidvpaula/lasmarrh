import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, UserPlus } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            RH Pulse
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma de gestão de processos seletivos para profissionais da saúde
          </p>
        </div>

        {/* Access Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Admin Access */}
          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Acesso Administrativo</CardTitle>
              <CardDescription className="text-base">
                Área restrita para administradores do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Gerencie candidatos, processos e configurações do sistema
              </p>
              <Button 
                onClick={() => navigate('/auth/admin')}
                className="w-full bg-gradient-primary hover:bg-primary-hover"
              >
                <Shield className="h-4 w-4 mr-2" />
                Login Administrativo
              </Button>
            </CardContent>
          </Card>

          {/* Professional Access */}
          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-secondary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Profissional da Saúde</CardTitle>
              <CardDescription className="text-base">
                Candidatura e acompanhamento de processo seletivo
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Cadastre-se ou faça login para acompanhar sua candidatura
              </p>
              <Button 
                onClick={() => navigate('/auth/professional')}
                variant="secondary"
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Acesso do Profissional
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm text-muted-foreground">
            © 2024 RH Pulse - Sistema de Gestão de Processos Seletivos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
