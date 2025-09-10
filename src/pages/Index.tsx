import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, UserPlus, ArrowRight, CheckCircle, Users, Clock, FileText, MapPin, Smartphone, DollarSign } from 'lucide-react';
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
      if (path.includes('/admin')) {
        handleNavigate('/admin/auth');
      } else {
        handleNavigate('/auth');
      }
      return;
    }
    
    if (path.includes('/admin') && profile?.role !== 'admin') {
      return;
    }
    
    handleNavigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-2 sm:px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/91791353-fd2d-4472-9b14-67723fe916c4.png" 
              alt="Lasmar Telemed" 
              className="h-8 sm:h-10 md:h-12 w-auto"
            />
          </div>
          
          <div className="flex gap-1 sm:gap-2 md:gap-3">
            <Button 
              onClick={() => handleRestrictedAccess('/auth', 'Área do Profissional')}
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary hover:text-white text-xs sm:text-sm px-2 sm:px-3"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Área do </span>Profissional
            </Button>
            <Button 
              onClick={() => handleRestrictedAccess('/admin/auth', 'Área Admin')}
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary hover:text-white text-xs sm:text-sm px-2 sm:px-3"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Área </span>Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Faixa 1 - Hero */}
      <section className="pt-16 sm:pt-20 pb-12 sm:pb-16 bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5">
          <img src={doctorTeleconsult1} alt="" className="w-full h-full object-cover" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <img 
                src="/lovable-uploads/91791353-fd2d-4472-9b14-67723fe916c4.png" 
                alt="Lasmar Telemed" 
                className="h-16 sm:h-24 md:h-32 lg:h-40 w-auto mx-auto mb-4 sm:mb-8 hover-scale"
              />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Lasmar Telemed
              </span>
            </h1>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-primary mb-6 sm:mb-8">
              Trabalhe Conosco
            </h2>
            
            <div className="mt-8 sm:mt-12 rounded-2xl overflow-hidden shadow-2xl max-w-3xl mx-auto">
              <img 
                src={medicalTeamTelemed} 
                alt="Médicos em teleconsulta" 
                className="w-full h-48 sm:h-64 md:h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Faixa 2 - Chamada Principal */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-foreground mb-6 sm:mb-8 font-medium leading-relaxed px-2">
              Plataforma completa de trabalho em teleconsulta para profissionais da saúde.
            </p>
            
            <Button 
              onClick={() => handleNavigate('/auth')}
              size="lg"
              className="bg-gradient-primary hover:scale-105 transition-all duration-300 px-6 sm:px-8 md:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold shadow-xl w-full sm:w-auto"
            >
              Cadastre-se agora
            </Button>
          </div>
        </div>
      </section>

      {/* Faixa 3.1 - Nossa História */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">Nossa História</h2>
            
            <div className="text-lg leading-relaxed text-muted-foreground space-y-6">
              <p>
                A Lasmar Telemed nasceu como uma plataforma de médicos cooperados, criada por quatro profissionais da mesma família. A demanda de pacientes cresceu, e amigos médicos foram incorporados ao projeto.
              </p>
              <p>
                Hoje, contamos com um grupo seleto de 15 profissionais, todos focados em criar vínculos reais com seus pacientes, trabalhando 100% em teleconsulta.
              </p>
              <p className="font-semibold text-primary">
                Nosso propósito é oferecer um atendimento humano, de qualidade e que gera fidelização, valorizando a experiência do paciente e do profissional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa 3.2 - Como Funciona */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">Como Funciona?</h2>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="text-lg leading-relaxed text-muted-foreground space-y-4">
                  <p>
                    Na Lasmar Telemed, você realiza consultas particulares com todo o apoio necessário para conquistar e gerenciar seus pacientes.
                  </p>
                  <p>
                    Nossa equipe de gestão, vendas, secretariado e marketing trabalha para impulsionar seu perfil, trazendo pacientes diretamente para você.
                  </p>
                  <p className="font-semibold text-primary">
                    Disponibilizamos ferramentas simples e eficazes, permitindo que o profissional foque no que realmente importa: o cuidado com o paciente.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <img 
                  src={doctorTeleconsult2} 
                  alt="Médico, marketing digital e pacientes conectados" 
                  className="w-full h-80 object-cover rounded-2xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa 4 - Profissional da Saúde */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-2 border-primary/20 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="text-center bg-gradient-primary text-white">
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  Profissional da Saúde
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success flex-shrink-0" />
                    <span className="text-sm sm:text-base">Secretário comunitário</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-success flex-shrink-0" />
                    <span className="text-sm sm:text-base"><strong>Dedução por consulta: X%</strong></span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-success flex-shrink-0" />
                    <span className="text-sm sm:text-base">Prontuário eletrônico (aberto, sem backup)</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-success flex-shrink-0" />
                    <span className="text-sm sm:text-base">Flexibilidade total e controle da agenda</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-success flex-shrink-0" />
                    <span className="text-sm sm:text-base">Landing Page simples (padrão)</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground text-sm sm:text-base">Sem anúncios Google Ads direcionados</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Faixa 6 - Cooperado Médico */}
      <section className="py-16 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-2 border-warning/30 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="text-center bg-gradient-to-r from-warning to-orange-500 text-white">
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  Cooperado Médico (Patrocinado)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <div className="font-bold text-primary text-xl mb-2">R$ 500,00</div>
                      <div className="text-sm">Vendedor disponível até 22h (triagem automática)</div>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-lg">
                      <div className="font-bold text-secondary text-xl mb-2">R$ 100,00</div>
                      <div className="text-sm">Prontuário eletrônico fechado (com backup)</div>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-warning/10 p-4 rounded-lg">
                      <div className="font-bold text-warning text-xl mb-2">R$ 300,00</div>
                      <div className="text-sm">Suporte de TI para anúncios no seu perfil</div>
                    </div>
                    <div className="bg-green-500/10 p-4 rounded-lg">
                      <div className="font-bold text-green-600 text-xl mb-2">R$ XX,XX</div>
                      <div className="text-sm">Tráfego pago Google ADS</div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-bold text-lg mb-4 text-foreground">Benefícios Extras:</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                        <span>Campanhas patrocinadas Google Ads</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                        <span>Google Maps integrado</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-6 w-6 text-success flex-shrink-0" />
                        <span><strong>Dedução por consulta: Menor %</strong></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-6 w-6 text-success flex-shrink-0" />
                        <span>Landing Page personalizada</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-red-500 text-xl">⚠️</span>
                      <div className="text-sm text-red-700">
                        <strong>Observação:</strong> Para se tornar cooperado, é necessário atender alguns pré-requisitos da plataforma. 
                        Trabalhamos apenas com especialidades que têm demanda comprovada em teleconsulta, garantindo que o profissional realmente tenha lucro justo.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Faixa 7 - Tabela Comparativa */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">Tabela Comparativa Visual</h2>
            
            <div className="overflow-x-auto shadow-xl rounded-2xl">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="bg-gradient-primary text-white">
                    <th className="p-3 text-left font-bold text-sm">Categoria</th>
                    <th className="p-3 text-center font-bold text-sm">Profissional da Saúde</th>
                    <th className="p-3 text-center font-bold text-sm">Cooperado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-sm">Dedução por consulta</td>
                    <td className="p-3 text-center text-sm">X%</td>
                    <td className="p-3 text-center font-bold text-success text-sm">Menor %</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-sm">Prontuário</td>
                    <td className="p-3 text-center text-sm">Aberto<br/>(sem backup)</td>
                    <td className="p-3 text-center font-bold text-success text-sm">Fechado<br/>(com backup)</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-sm">Secretaria</td>
                    <td className="p-3 text-center text-sm">Comunitária</td>
                    <td className="p-3 text-center font-bold text-success text-sm">Exclusivo +<br/>Vendedor até 22h</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-sm">Landing Page</td>
                    <td className="p-3 text-center text-sm">Simples<br/>(padrão)</td>
                    <td className="p-3 text-center font-bold text-success text-sm">Personalizada<br/>(Google Ads incluso)</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-sm">Marketing/Anúncios</td>
                    <td className="p-3 text-center text-sm">Não incluso</td>
                    <td className="p-3 text-center font-bold text-success text-sm">Google Ads +<br/>Google Maps</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-sm">Suporte TI</td>
                    <td className="p-3 text-center text-sm">Básico</td>
                    <td className="p-3 text-center font-bold text-success text-sm">Gestor de Tráfego</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <img src={doctorTeleconsult1} alt="" className="w-full h-full object-cover" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">
              Seja parte da Lasmar Telemed e transforme sua carreira em teleconsulta.
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Button 
                onClick={() => handleNavigate('/auth')}
                size="lg"
                variant="outline"
                className="bg-white text-primary hover:bg-gray-100 border-white px-6 sm:px-8 md:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                Trabalhe Conosco
              </Button>
              <Button 
                onClick={() => handleNavigate('/auth')}
                size="lg"
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-white/30 px-6 sm:px-8 md:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                Cadastre-se Agora
              </Button>
            </div>
            
            <div className="mt-12 rounded-2xl overflow-hidden shadow-2xl max-w-2xl mx-auto">
              <img 
                src={medicalTeamTelemed} 
                alt="Médicos sorrindo em vídeo chamada" 
                className="w-full h-48 object-cover opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

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