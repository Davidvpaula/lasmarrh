import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DoctorDashboard from '@/components/DoctorDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import { Shield, UserPlus, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-4">
            Dashboards do Sistema
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Escolha o dashboard apropriado para seu perfil
          </p>
        </div>

        {/* Dashboard Options */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Professional Dashboard */}
          <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-secondary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Dashboard do Profissional</CardTitle>
              <CardDescription className="text-base">
                Acompanhe seu processo seletivo e etapas
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                - Progresso das etapas<br/>
                - Documentos pendentes<br/>
                - Treinamentos obrigatórios e opcionais
              </p>
              <Button 
                onClick={() => handleNavigate('/dashboard/professional')}
                variant="secondary"
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Acessar Dashboard
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
                Gerencie todo o sistema e candidatos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                - Gestão de candidaturas<br/>
                - Aprovação de etapas<br/>
                - Administração de treinamentos<br/>
                - Controle de usuários
              </p>
              <Button 
                onClick={() => handleNavigate('/dashboard/admin')}
                className="w-full bg-gradient-primary hover:bg-primary-hover"
              >
                <Shield className="h-4 w-4 mr-2" />
                Acessar Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Button variant="outline" onClick={() => handleNavigate('/')}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;