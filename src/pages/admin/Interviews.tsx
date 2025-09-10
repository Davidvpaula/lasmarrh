import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('stage_progress')
        .select(`
          application_id,
          notes,
          status,
          created_at,
          applications!inner(
            doctor_id,
            profiles!inner(full_name)
          )
        `)
        .eq('stage_number', 2)
        .not('notes', 'is', null);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        application_id: item.application_id,
        doctor_name: item.applications.profiles.full_name,
        responses: item.notes ? JSON.parse(item.notes) : {},
        submitted_at: item.created_at,
        status: item.status
      })) || [];

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

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('stage_progress')
        .update({ 
          status: newStatus,
          completed_at: new Date().toISOString()
        })
        .eq('application_id', applicationId)
        .eq('stage_number', 2);

      if (error) throw error;

      // Atualizar status da aplicação se aprovado
      if (newStatus === 'approved') {
        await supabase
          .from('applications')
          .update({ current_stage: 3 })
          .eq('id', applicationId);
      }

      toast({
        title: "Sucesso",
        description: `Entrevista ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`,
      });

      fetchInterviews();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      });
    }
  };

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
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {interviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma entrevista encontrada</p>
              </CardContent>
            </Card>
          ) : (
            interviews.map((interview) => (
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
                         interview.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(interview.submitted_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(interview.responses).map(([question, answer]) => (
                      <div key={question} className="border-l-2 border-primary/20 pl-4">
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          {question === 'motivation' ? 'Motivação' : 
                           question === 'experience' ? 'Experiência' : 
                           question === 'expectations' ? 'Expectativas' : 
                           question === 'whatsapp' ? 'WhatsApp' :
                           question === 'availability' ? 'Disponibilidade' : question}
                        </p>
                        {question === 'availability' && typeof answer === 'object' ? (
                          <div className="space-y-2">
                            {Object.entries(answer as Record<string, string[]>).map(([day, slots]) => (
                              <div key={day} className="text-sm">
                                <span className="font-medium">{day}: </span>
                                <span>{Array.isArray(slots) ? slots.join(', ') : 'Não disponível'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm">{String(answer)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {interview.status === 'pending' && (
                    <div className="flex gap-2 mt-6 pt-4 border-t">
                      <Button
                        onClick={() => handleStatusUpdate(interview.application_id, 'approved')}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(interview.application_id, 'rejected')}
                        variant="destructive"
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

                        <TabsContent value="pending">
                          {interviews.filter(i => i.status === 'pending').map((interview) => (
                            <Card key={interview.application_id} className="hover:shadow-md transition-shadow">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">{interview.doctor_name}</CardTitle>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">Pendente</Badge>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(interview.submitted_at).toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {Object.entries(interview.responses).map(([question, answer]) => (
                                    <div key={question} className="border-l-2 border-primary/20 pl-4">
                                      <p className="font-medium text-sm text-muted-foreground mb-1">
                                        {question === 'motivation' ? 'Motivação' : 
                                         question === 'experience' ? 'Experiência' : 
                                         question === 'expectations' ? 'Expectativas' : 
                                         question === 'whatsapp' ? 'WhatsApp' :
                                         question === 'availability' ? 'Disponibilidade' : question}
                                      </p>
                                      {question === 'availability' && typeof answer === 'object' ? (
                                        <div className="space-y-2">
                                          {Object.entries(answer as Record<string, string[]>).map(([day, slots]) => (
                                            <div key={day} className="text-sm">
                                              <span className="font-medium">{day}: </span>
                                              <span>{Array.isArray(slots) ? slots.join(', ') : 'Não disponível'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm">{String(answer)}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex gap-2 mt-6 pt-4 border-t">
                                  <Button
                                    onClick={() => handleStatusUpdate(interview.application_id, 'approved')}
                                    className="flex items-center gap-2"
                                    size="sm"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    onClick={() => handleStatusUpdate(interview.application_id, 'rejected')}
                                    variant="destructive"
                                    className="flex items-center gap-2"
                                    size="sm"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </TabsContent>

                        <TabsContent value="approved">
                          {interviews.filter(i => i.status === 'approved').map((interview) => (
                            <Card key={interview.application_id} className="hover:shadow-md transition-shadow">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">{interview.doctor_name}</CardTitle>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default">Aprovada</Badge>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(interview.submitted_at).toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {Object.entries(interview.responses).map(([question, answer]) => (
                                    <div key={question} className="border-l-2 border-primary/20 pl-4">
                                      <p className="font-medium text-sm text-muted-foreground mb-1">
                                        {question === 'motivation' ? 'Motivação' : 
                                         question === 'experience' ? 'Experiência' : 
                                         question === 'expectations' ? 'Expectativas' : 
                                         question === 'whatsapp' ? 'WhatsApp' :
                                         question === 'availability' ? 'Disponibilidade' : question}
                                      </p>
                                      {question === 'availability' && typeof answer === 'object' ? (
                                        <div className="space-y-2">
                                          {Object.entries(answer as Record<string, string[]>).map(([day, slots]) => (
                                            <div key={day} className="text-sm">
                                              <span className="font-medium">{day}: </span>
                                              <span>{Array.isArray(slots) ? slots.join(', ') : 'Não disponível'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm">{String(answer)}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </TabsContent>

                        <TabsContent value="rejected">
                          {interviews.filter(i => i.status === 'rejected').map((interview) => (
                            <Card key={interview.application_id} className="hover:shadow-md transition-shadow">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">{interview.doctor_name}</CardTitle>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="destructive">Rejeitada</Badge>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(interview.submitted_at).toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {Object.entries(interview.responses).map(([question, answer]) => (
                                    <div key={question} className="border-l-2 border-primary/20 pl-4">
                                      <p className="font-medium text-sm text-muted-foreground mb-1">
                                        {question === 'motivation' ? 'Motivação' : 
                                         question === 'experience' ? 'Experiência' : 
                                         question === 'expectations' ? 'Expectativas' : 
                                         question === 'whatsapp' ? 'WhatsApp' :
                                         question === 'availability' ? 'Disponibilidade' : question}
                                      </p>
                                      {question === 'availability' && typeof answer === 'object' ? (
                                        <div className="space-y-2">
                                          {Object.entries(answer as Record<string, string[]>).map(([day, slots]) => (
                                            <div key={day} className="text-sm">
                                              <span className="font-medium">{day}: </span>
                                              <span>{Array.isArray(slots) ? slots.join(', ') : 'Não disponível'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm">{String(answer)}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </TabsContent>
      </Tabs>
    </div>
  );
}