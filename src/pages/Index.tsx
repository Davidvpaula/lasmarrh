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
        handleNavigate('/auth');
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
      {/* Hero Section - Full Screen */}
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pulso RH
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Plataforma completa de gestão de processos seletivos para profissionais da saúde
            </p>
            <p className="text-sm sm:text-base text-muted-foreground/80 max-w-2xl mx-auto mb-12">
              Simplifique seu processo de recrutamento com nossa solução inteligente e intuitiva
            </p>
            
            {/* Authentication Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => handleNavigate('/auth')}
                size="lg"
                className="bg-gradient-primary hover:bg-primary-hover hover-scale px-8 py-4 text-lg shadow-lg"
              >
                Entrar na Plataforma
              </Button>
              <Button 
                onClick={() => handleNavigate('/auth')}
                variant="outline"
                size="lg"
                className="hover-scale px-8 py-4 text-lg border-2"
              >
                Criar Conta
              </Button>
            </div>
          </div>

          {/* Access Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Professional Dashboard */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary/30 hover-scale backdrop-blur-sm bg-card/80">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <UserPlus className="h-10 w-10 text-secondary" />
                </div>
                <CardTitle className="text-2xl lg:text-3xl font-semibold">Painel do Profissional</CardTitle>
                <CardDescription className="text-base lg:text-lg text-muted-foreground">
                  Acompanhe seu processo seletivo e etapas de candidatura
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center px-6 pb-8">
                <p className="text-sm lg:text-base text-muted-foreground mb-8 leading-relaxed">
                  Visualize progresso, documentos, treinamentos e muito mais
                </p>
                <Button 
                  onClick={() => handleRestrictedAccess('/dashboard/professional', 'Dashboard Profissional')}
                  variant="secondary"
                  className="w-full py-3 text-lg font-medium hover-scale shadow-md"
                  size="lg"
                >
                  <UserPlus className="h-5 w-5 mr-3" />
                  {user ? 'Acessar Dashboard' : 'Login Profissional'}
                  <ArrowRight className="h-5 w-5 ml-3" />
                </Button>
              </CardContent>
            </Card>

            {/* Admin Dashboard */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 hover-scale backdrop-blur-sm bg-card/80">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl lg:text-3xl font-semibold">Painel Administrativo</CardTitle>
                <CardDescription className="text-base lg:text-lg text-muted-foreground">
                  Gerenciar candidatos, processos e configurações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center px-6 pb-8">
                <p className="text-sm lg:text-base text-muted-foreground mb-8 leading-relaxed">
                  Controle completo de candidaturas, treinamentos e usuários
                </p>
                <Button 
                  onClick={() => handleRestrictedAccess('/admin/auth', 'Dashboard Administrativo')}
                  className="w-full bg-gradient-primary hover:bg-primary-hover py-3 text-lg font-medium hover-scale shadow-md"
                  size="lg"
                >
                  <Shield className="h-5 w-5 mr-3" />
                  {!user ? 'Login Administrativo' : (profile?.role === 'admin' ? 'Acessar Dashboard' : 'Acesso Restrito')}
                  <ArrowRight className="h-5 w-5 ml-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Pulso RH - Sistema de Gestão de Processos Seletivos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;