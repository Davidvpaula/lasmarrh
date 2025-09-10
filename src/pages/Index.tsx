import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import doctorTeleconsult1 from '@/assets/doctor-teleconsult-1.jpg';
import doctorTeleconsult2 from '@/assets/doctor-teleconsult-2.jpg';
import medicalTeamTelemed from '@/assets/medical-team-telemed.jpg';

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section - Full Screen */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0 z-0">
          <div className="grid grid-cols-3 h-full opacity-5">
            <div className="relative">
              <img src={doctorTeleconsult1} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative">
              <img src={medicalTeamTelemed} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative">
              <img src={doctorTeleconsult2} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 relative z-10">
          {/* Logo and Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="flex justify-center mb-8">
              <img 
                src="/lovable-uploads/91791353-fd2d-4472-9b14-67723fe916c4.png" 
                alt="Lasmar Telemed" 
                className="h-24 sm:h-32 lg:h-40 w-auto hover-scale"
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Lasmar Telemed
              </span>
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary mb-8">
              Trabalhe Conosco
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Plataforma completa de telemedicina para profissionais da saúde
            </p>
            <p className="text-sm sm:text-base text-muted-foreground/80 max-w-2xl mx-auto mb-12">
              Conecte-se com pacientes através de nossa tecnologia inovadora em teleconsultas
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
                className="hover-scale px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white"
              >
                Criar Conta
              </Button>
            </div>
          </div>

          {/* Access Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Professional Dashboard */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 hover-scale backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <UserPlus className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl lg:text-3xl font-semibold">Área do Profissional</CardTitle>
                <CardDescription className="text-base lg:text-lg text-muted-foreground">
                  Gerencie suas teleconsultas e atendimentos médicos
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center px-6 pb-8">
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img src={doctorTeleconsult1} alt="Médico em teleconsulta" className="w-full h-32 object-cover opacity-80" />
                </div>
                <p className="text-sm lg:text-base text-muted-foreground mb-8 leading-relaxed">
                  Acesse suas consultas, prontuários e agenda médica online
                </p>
                <Button 
                  onClick={() => handleRestrictedAccess('/dashboard/professional', 'Dashboard Profissional')}
                  className="w-full py-3 text-lg font-medium hover-scale shadow-md bg-primary hover:bg-primary-hover"
                  size="lg"
                >
                  <UserPlus className="h-5 w-5 mr-3" />
                  {user ? 'Acessar Dashboard' : 'Login Profissional'}
                  <ArrowRight className="h-5 w-5 ml-3" />
                </Button>
              </CardContent>
            </Card>

            {/* Admin Dashboard */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary/30 hover-scale backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Shield className="h-10 w-10 text-secondary" />
                </div>
                <CardTitle className="text-2xl lg:text-3xl font-semibold">Painel Administrativo</CardTitle>
                <CardDescription className="text-base lg:text-lg text-muted-foreground">
                  Gerenciar profissionais, processos e sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center px-6 pb-8">
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img src="/lovable-uploads/86231256-1c8d-4fc8-b163-a7b77b95e5f1.png" alt="Equipe médica em videoconferência" className="w-full h-32 object-cover opacity-80" />
                </div>
                <p className="text-sm lg:text-base text-muted-foreground mb-8 leading-relaxed">
                  Controle completo da plataforma e equipe médica
                </p>
                <Button 
                  onClick={() => handleRestrictedAccess('/admin/auth', 'Dashboard Administrativo')}
                  className="w-full bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 py-3 text-lg font-medium hover-scale shadow-md"
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
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/91791353-fd2d-4472-9b14-67723fe916c4.png" 
              alt="Lasmar Telemed" 
              className="h-8 w-auto opacity-70"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Lasmar Telemed - Plataforma de Telemedicina
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;