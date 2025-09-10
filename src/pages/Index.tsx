import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, profile } = useAuth();
  
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };
  
  const handleRestrictedAccess = (path: string, title: string) => {
    if (!user) {
      // Para área administrativa, ir direto para login admin
      if (path.includes('/admin')) {
        handleNavigate('/admin/auth');
      } else {
        handleNavigate('/professional/auth');
      }
      return;
    }
    
    // Verificar permissões para admin
    if (path.includes('/admin') && profile?.role !== 'admin') {
      return; // Não permite acesso
    }
    
    handleNavigate(path);
  };

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
          
          {/* Authentication Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => handleNavigate('/professional/auth')}
              size="lg"
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              Entrar na Plataforma
            </Button>
            <Button 
              onClick={() => handleNavigate('/professional/auth')}
              variant="outline"
              size="lg"
            >
              Criar Conta
            </Button>
          </div>
        </div>

        {/* Access Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Professional Dashboard */}
          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-secondary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Dashboard do Profissional</CardTitle>
              <CardDescription className="text-base">
                Acompanhe seu processo seletivo e etapas de candidatura
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Visualize progresso, documentos, treinamentos e mais
              </p>
              <Button 
                onClick={() => handleRestrictedAccess('/dashboard/professional', 'Dashboard Profissional')}
                variant="secondary"
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {user ? 'Acessar Dashboard' : 'Login Profissional'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Admin Dashboard */}
          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Dashboard Administrativo</CardTitle>
              <CardDescription className="text-base">
                Gerencie candidatos, processos e configurações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Controle completo de candidaturas, treinamentos e usuários
              </p>
              <Button 
                onClick={() => handleRestrictedAccess('/admin/auth', 'Dashboard Administrativo')}
                className="w-full bg-gradient-primary hover:bg-primary-hover"
              >
                <Shield className="h-4 w-4 mr-2" />
                {!user ? 'Login Administrativo' : (profile?.role === 'admin' ? 'Acessar Dashboard' : 'Acesso Restrito')}
                <ArrowRight className="h-4 w-4 ml-2" />
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
