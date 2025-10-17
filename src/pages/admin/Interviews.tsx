import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, User, Calendar, CheckCircle, XCircle, Eye, Clock, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface InterviewResponse {
  application_id: string;
  doctor_name: string;
  responses: any;
  submitted_at: string;
  status: string;
}

export default function Interviews() {
  const [interviews, setInterviews] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInterviews();

    // Configurar real-time para atualizações automáticas
    const channel = supabase
      .channel('interviews-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stage_progress', filter: 'stage_number=eq.2' },
        () => fetchInterviews()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        () => fetchInterviews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInterviews = async () => {
    try {
      // Buscar entrevistas (stage 2) - incluindo todas com status relevante
      const { data: stages, error } = await supabase
        .from('stage_progress')
        .select('application_id, notes, status, created_at')
        .eq('stage_number', 2)
        .in('status', ['available', 'in_progress', 'completed', 'approved', 'rejected']);

      if (error) throw error;

      // Usar todas as entrevistas encontradas (não filtrar por dados vazios)
      const appIds = (stages || []).map((s: any) => s.application_id);
      
      if (appIds.length === 0) {
        setInterviews([]);
        return;
      }

      const { data: appsRes, error: appsErr } = await supabase
        .from('applications')
        .select('id, doctor_id')
        .in('id', appIds);
      if (appsErr) throw appsErr;

      const doctorIds = (appsRes || []).map((a: any) => a.doctor_id);
      const { data: profilesRes, error: profilesErr } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', doctorIds);
      if (profilesErr) throw profilesErr;

      const appMap = new Map((appsRes || []).map((a: any) => [a.id, a.doctor_id]));
      const profileMap = new Map((profilesRes || []).map((p: any) => [p.user_id, p.full_name]));

      const formattedData: InterviewResponse[] = (stages || []).map((item: any) => {
        const doctorId = appMap.get(item.application_id);
        const doctorName = profileMap.get(doctorId) || 'Nome não informado';
        let parsed: any = {};
        try { 
          parsed = item.notes ? JSON.parse(item.notes) : {}; 
        } catch (e) {
          console.error('Erro ao fazer parse do JSON:', e);
        }
        return {
          application_id: item.application_id,
          doctor_name: doctorName,
          responses: parsed,
          submitted_at: item.created_at,
          status: item.status,
        };
      });

      setInterviews(formattedData);
    } catch (error) {
      console.error('Erro ao buscar entrevistas:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar entrevistas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const DAYS_OF_WEEK_MAP: { [key: string]: string } = {
    segunda: 'Segunda-feira',
    terca: 'Terça-feira',
    quarta: 'Quarta-feira',
    quinta: 'Quinta-feira',
    sexta: 'Sexta-feira',
    sabado: 'Sábado',
    domingo: 'Domingo'
  };

  const InterviewDetailsDialog = ({ interview }: { interview: InterviewResponse }) => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Ver Detalhes Completos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Entrevista de {interview.doctor_name}
            </DialogTitle>
            <DialogDescription>
              Enviada em {new Date(interview.submitted_at).toLocaleDateString('pt-BR')} às {new Date(interview.submitted_at).toLocaleTimeString('pt-BR')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={
                interview.status === 'approved' ? 'default' :
                interview.status === 'rejected' ? 'destructive' : 'secondary'
              }>
                {interview.status === 'approved' ? 'Aprovada' :
                 interview.status === 'rejected' ? 'Rejeitada' : 
                 interview.status === 'in_progress' ? 'Em Andamento' : 
                 interview.status === 'available' ? 'Aguardando' : 'Pendente'}
              </Badge>
            </div>

            <Separator />

            {/* Verificar se há dados */}
            {Object.keys(interview.responses).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">Nenhum dado de entrevista submetido</p>
                <p className="text-sm mt-2">O profissional ainda não completou o preenchimento da entrevista.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Respostas da Entrevista */}
                {/* Motivação */}
                {interview.responses.motivation && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="text-sm font-semibold text-primary mb-2">
                      Por que você tem interesse em trabalhar conosco?
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {interview.responses.motivation}
                    </p>
                  </div>
                )}

                {/* Experiência */}
                {interview.responses.experience && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="text-sm font-semibold text-primary mb-2">
                      Experiência profissional na área médica
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {interview.responses.experience}
                    </p>
                  </div>
                )}

                {/* Experiência com Teleconsulta */}
                {interview.responses.expectations && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="text-sm font-semibold text-primary mb-2">
                      Experiência com teleconsulta
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {interview.responses.expectations}
                    </p>
                  </div>
                )}

                {/* WhatsApp */}
                {interview.responses.whatsapp && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      WhatsApp para contato
                    </h4>
                    <p className="text-sm text-foreground font-medium">
                      {interview.responses.whatsapp}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Disponibilidade */}
                {interview.responses.availability && typeof interview.responses.availability === 'object' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Disponibilidade de Horário
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(interview.responses.availability as Record<string, string[]>).map(([day, slots]) => {
                        if (!slots || !Array.isArray(slots) || slots.length === 0) return null;
                        return (
                          <div key={day} className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex items-start gap-3">
                              <div className="font-semibold text-sm min-w-[120px] text-primary">
                                {DAYS_OF_WEEK_MAP[day] || day}
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap gap-2">
                                  {slots.map((slot, index) => (
                                    <Badge
                                      key={`${day}-${slot}-${index}`}
                                      variant="secondary"
                                      className="bg-primary/10 text-primary"
                                    >
                                      {slot}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      // Buscar o status atual da entrevista
      const { data: currentData, error: fetchError } = await supabase
        .from('stage_progress')
        .select('status')
        .eq('application_id', applicationId)
        .eq('stage_number', 2)
        .single();

      if (fetchError) throw fetchError;

      const wasApproved = currentData?.status === 'approved';

      // Atualizar status do stage 2 (Entrevista)
      const { error: stageError } = await supabase
        .from('stage_progress')
        .update({ 
          status: newStatus,
          completed_at: new Date().toISOString()
        })
        .eq('application_id', applicationId)
        .eq('stage_number', 2);

      if (stageError) throw stageError;

      if (newStatus === 'approved') {
        // Liberar acesso aos próximos stages (Training e Documents)
        const { error: unlockError } = await supabase
          .from('stage_progress')
          .update({ status: 'available' })
          .eq('application_id', applicationId)
          .in('stage_number', [3, 4]); // Stage 3: Training, Stage 4: Documents

        if (unlockError) throw unlockError;

        // Atualizar stage atual da aplicação
        const { error: appError } = await supabase
          .from('applications')
          .update({ current_stage: 3 })
          .eq('id', applicationId);

        if (appError) throw appError;
      } else if (newStatus === 'rejected' && wasApproved) {
        // Se estava aprovado e agora foi rejeitado, bloquear acesso aos próximos stages
        const { error: lockError } = await supabase
          .from('stage_progress')
          .update({ status: 'locked' })
          .eq('application_id', applicationId)
          .in('stage_number', [3, 4, 5, 6]); // Bloquear Training, Documents, Interview Final, Final

        if (lockError) throw lockError;

        // Voltar stage atual da aplicação para 2
        const { error: appError } = await supabase
          .from('applications')
          .update({ current_stage: 2 })
          .eq('id', applicationId);

        if (appError) throw appError;
      }

      toast({
        title: "Sucesso",
        description: `Entrevista ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.${newStatus === 'approved' ? ' Acesso liberado para Treinamento e Documentos.' : wasApproved ? ' Acesso aos próximos stages foi removido.' : ''}`,
      });

      fetchInterviews();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da entrevista",
        variant: "destructive",
      });
    }
  };

  const renderInterviewCard = (interview: InterviewResponse) => (
    <Card key={interview.application_id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{interview.doctor_name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              interview.status === 'approved' ? 'default' :
              interview.status === 'rejected' ? 'destructive' : 'secondary'
            }>
              {interview.status === 'approved' ? 'Aprovada' :
               interview.status === 'rejected' ? 'Rejeitada' : 
               interview.status === 'in_progress' ? 'Em Andamento' : 
               interview.status === 'available' ? 'Aguardando' : 'Pendente'}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(interview.submitted_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Verificar se há dados preenchidos */}
        {Object.keys(interview.responses).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum dado de entrevista foi submetido ainda.</p>
            <p className="text-xs mt-2">O profissional iniciou mas não completou a entrevista.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mostrar campos de texto primeiro */}
            {Object.entries(interview.responses)
              .filter(([key]) => key !== 'availability')
              .map(([question, answer]) => (
                <div key={question} className="border-l-2 border-primary/20 pl-4">
                  <p className="font-medium text-sm text-muted-foreground mb-1">
                    {question === 'motivation' ? 'Motivação' : 
                     question === 'experience' ? 'Experiência' : 
                     question === 'expectations' ? 'Experiência com Teleconsulta' : 
                     question === 'whatsapp' ? 'WhatsApp' : question}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{String(answer)}</p>
                </div>
              ))}
            
            {/* Mostrar disponibilidade por último */}
            {interview.responses.availability && typeof interview.responses.availability === 'object' && (
              <div className="border-l-2 border-primary/20 pl-4">
                <p className="font-medium text-sm text-muted-foreground mb-2">
                  Disponibilidade de Horário
                </p>
                <div className="space-y-2">
                  {Object.entries(interview.responses.availability as Record<string, string[]>).map(([day, slots]) => {
                    if (!slots || !Array.isArray(slots) || slots.length === 0) return null;
                    return (
                      <div key={day} className="flex gap-2 text-sm">
                        <span className="font-medium min-w-[100px]">
                          {DAYS_OF_WEEK_MAP[day] || day}:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {slots.map((slot, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {slot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <InterviewDetailsDialog interview={interview} />
          
          {(interview.status === 'available' || interview.status === 'in_progress' || interview.status === 'rejected') && (
            <Button
              onClick={() => handleStatusUpdate(interview.application_id, 'approved')}
              className="flex items-center gap-2 bg-success hover:bg-success/90"
              size="sm"
            >
              <CheckCircle className="h-4 w-4" />
              Aprovar
            </Button>
          )}
          {(interview.status === 'available' || interview.status === 'in_progress' || interview.status === 'approved') && (
            <Button
              onClick={() => handleStatusUpdate(interview.application_id, 'rejected')}
              variant="destructive"
              className="flex items-center gap-2"
              size="sm"
            >
              <XCircle className="h-4 w-4" />
              Rejeitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Entrevistas</h1>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({interviews.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({interviews.filter(i => i.status === 'available' || i.status === 'in_progress').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovadas ({interviews.filter(i => i.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitadas ({interviews.filter(i => i.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {interviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma entrevista preenchida encontrada</p>
                <p className="text-sm text-muted-foreground mt-2">
                  As entrevistas aparecerão aqui assim que os profissionais de saúde preencherem o formulário
                </p>
              </CardContent>
            </Card>
          ) : (
            interviews.map((interview) => renderInterviewCard(interview))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {interviews.filter(i => i.status === 'available' || i.status === 'in_progress').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma entrevista pendente encontrada</p>
              </CardContent>
            </Card>
          ) : (
            interviews.filter(i => i.status === 'available' || i.status === 'in_progress').map((interview) => renderInterviewCard(interview))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {interviews.filter(i => i.status === 'approved').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma entrevista aprovada encontrada</p>
              </CardContent>
            </Card>
          ) : (
            interviews.filter(i => i.status === 'approved').map((interview) => renderInterviewCard(interview))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {interviews.filter(i => i.status === 'rejected').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma entrevista rejeitada encontrada</p>
              </CardContent>
            </Card>
          ) : (
            interviews.filter(i => i.status === 'rejected').map((interview) => renderInterviewCard(interview))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}