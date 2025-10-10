import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, User, Calendar, CheckCircle, XCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormResponse {
  application_id: string;
  doctor_name: string;
  form_data: any;
  documents: any[];
  submitted_at: string;
  status: string;
}

export default function Forms() {
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      // Buscar dados do formulário da etapa 3 (documentos)
      const { data: stageData, error: stageError } = await supabase
        .from('stage_progress')
        .select(`
          application_id,
          notes,
          status,
          created_at,
          applications!inner(
            doctor_id,
            profiles!applications_doctor_id_fkey(full_name)
          )
        `)
        .eq('stage_number', 3)
        .not('notes', 'is', null);

      if (stageError) throw stageError;

      // Buscar documentos relacionados
      const applicationIds = stageData?.map(item => item.application_id) || [];
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('application_id', applicationIds);

      if (documentsError) throw documentsError;

      const formattedData = stageData?.map(item => {
        const relatedDocs = documentsData?.filter(doc => doc.application_id === item.application_id) || [];
        const appData = item.applications as any;
        
        return {
          application_id: item.application_id,
          doctor_name: appData?.profiles?.full_name || 'Nome não informado',
          form_data: item.notes ? JSON.parse(item.notes) : {},
          documents: relatedDocs,
          submitted_at: item.created_at,
          status: item.status
        };
      }) || [];

      setForms(formattedData);
    } catch (error) {
      console.error('Erro ao buscar formulários:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar formulários",
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
        .eq('stage_number', 3);

      if (error) throw error;

      // Atualizar status da aplicação se aprovado
      if (newStatus === 'approved') {
        // Desbloquear próxima etapa (Treinamento - stage 4)
        await supabase
          .from('stage_progress')
          .update({ status: 'available' })
          .eq('application_id', applicationId)
          .eq('stage_number', 4);
          
        await supabase
          .from('applications')
          .update({ current_stage: 4 })
          .eq('id', applicationId);
      }

      toast({
        title: "Sucesso",
        description: `Formulário ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`,
      });

      fetchForms();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do formulário",
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
        <FolderOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Formulários de Documentos</h1>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {forms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum formulário encontrado</p>
              </CardContent>
            </Card>
          ) : (
            forms.map((form) => (
              <Card key={form.application_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{form.doctor_name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        form.status === 'approved' ? 'default' :
                        form.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {form.status === 'approved' ? 'Aprovado' :
                         form.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(form.submitted_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Dados do formulário */}
                    <div>
                      <h4 className="font-semibold mb-3">Informações Pessoais</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {form.form_data?.form && Object.entries(form.form_data.form).map(([field, value]) => {
                          const fieldLabels: { [key: string]: string } = {
                            full_name: 'Nome Completo',
                            cpf: 'CPF',
                            rg: 'RG',
                            birth_date: 'Data de Nascimento',
                            phone: 'Telefone',
                            address: 'Endereço',
                            crm_number: 'Número do CRM',
                            specialty: 'Especialidade',
                            graduation_year: 'Ano de Formatura',
                            institution: 'Instituição de Ensino'
                          };
                          
                          return (
                            <div key={field}>
                              <span className="font-medium text-muted-foreground">
                                {fieldLabels[field] || field}:
                              </span>
                              <p className="text-foreground">{String(value || 'Não informado')}</p>
                            </div>
                          );
                        })}
                        
                        {form.form_data?.uploadedDocs && (
                          <div className="col-span-2">
                            <span className="font-medium text-muted-foreground">Documentos Enviados:</span>
                            <p className="text-foreground">{form.form_data.uploadedDocs.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documentos anexados */}
                    {form.documents.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Documentos Anexados</h4>
                        <div className="space-y-2">
                           {form.documents.map((doc) => {
                            const docTypeLabels: { [key: string]: string } = {
                              rg: 'RG (Frente e Verso)',
                              cpf: 'CPF',
                              crm: 'CRM',
                              diploma: 'Diploma de Medicina',
                              residencia: 'Certificado de Residência',
                              curriculum: 'Currículo Atualizado'
                            };
                            
                            return (
                              <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{docTypeLabels[doc.document_type] || doc.document_type}</p>
                                  <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Documento",
                                      description: `Visualizando ${docTypeLabels[doc.document_type] || doc.document_type}`,
                                    });
                                  }}
                                >
                                  Ver
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {(form.status === 'pending' || form.status === 'in_progress') && (
                    <div className="flex gap-2 mt-6 pt-4 border-t">
                      <Button
                        onClick={() => handleStatusUpdate(form.application_id, 'approved')}
                        className="flex items-center gap-2 bg-success hover:bg-success/90"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aprovar Formulário
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(form.application_id, 'rejected')}
                        variant="destructive"
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeitar Formulário
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {forms.filter(f => f.status === 'pending' || f.status === 'in_progress').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum formulário pendente</p>
              </CardContent>
            </Card>
          ) : (
            forms.filter(f => f.status === 'pending' || f.status === 'in_progress').map((form) => (
              <Card key={form.application_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{form.doctor_name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pendente</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(form.submitted_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Dados do formulário */}
                    <div>
                      <h4 className="font-semibold mb-3">Informações Pessoais</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {form.form_data?.form && Object.entries(form.form_data.form).map(([field, value]) => {
                          const fieldLabels: { [key: string]: string } = {
                            full_name: 'Nome Completo',
                            cpf: 'CPF',
                            rg: 'RG',
                            birth_date: 'Data de Nascimento',
                            phone: 'Telefone',
                            address: 'Endereço',
                            crm_number: 'Número do CRM',
                            specialty: 'Especialidade',
                            graduation_year: 'Ano de Formatura',
                            institution: 'Instituição de Ensino'
                          };
                          
                          return (
                            <div key={field}>
                              <span className="font-medium text-muted-foreground">
                                {fieldLabels[field] || field}:
                              </span>
                              <p className="text-foreground">{String(value || 'Não informado')}</p>
                            </div>
                          );
                        })}
                        
                        {form.form_data?.uploadedDocs && (
                          <div className="col-span-2">
                            <span className="font-medium text-muted-foreground">Documentos Enviados:</span>
                            <p className="text-foreground">{form.form_data.uploadedDocs.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documentos anexados */}
                    {form.documents.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Documentos Anexados</h4>
                        <div className="space-y-2">
                          {form.documents.map((doc) => {
                            const docTypeLabels: { [key: string]: string } = {
                              rg: 'RG (Frente e Verso)',
                              cpf: 'CPF',
                              crm: 'CRM',
                              diploma: 'Diploma de Medicina',
                              residencia: 'Certificado de Residência',
                              curriculum: 'Currículo Atualizado'
                            };
                            
                            return (
                              <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{docTypeLabels[doc.document_type] || doc.document_type}</p>
                                  <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Documento",
                                      description: `Visualizando ${docTypeLabels[doc.document_type] || doc.document_type}`,
                                    });
                                  }}
                                >
                                  Ver
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button
                      onClick={() => handleStatusUpdate(form.application_id, 'approved')}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(form.application_id, 'rejected')}
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
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {forms.filter(f => f.status === 'approved').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum formulário aprovado</p>
              </CardContent>
            </Card>
          ) : (
            forms.filter(f => f.status === 'approved').map((form) => (
              <Card key={form.application_id} className="hover:shadow-md transition-shadow border-success">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{form.doctor_name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Aprovado</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(form.submitted_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Dados do formulário */}
                    <div>
                      <h4 className="font-semibold mb-3">Informações Pessoais</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {form.form_data?.form && Object.entries(form.form_data.form).map(([field, value]) => {
                          const fieldLabels: { [key: string]: string } = {
                            full_name: 'Nome Completo',
                            cpf: 'CPF',
                            rg: 'RG',
                            birth_date: 'Data de Nascimento',
                            phone: 'Telefone',
                            address: 'Endereço',
                            crm_number: 'Número do CRM',
                            specialty: 'Especialidade',
                            graduation_year: 'Ano de Formatura',
                            institution: 'Instituição de Ensino'
                          };
                          
                          return (
                            <div key={field}>
                              <span className="font-medium text-muted-foreground">
                                {fieldLabels[field] || field}:
                              </span>
                              <p className="text-foreground">{String(value || 'Não informado')}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Documentos anexados */}
                    {form.documents.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Documentos Anexados</h4>
                        <div className="space-y-2">
                          {form.documents.map((doc) => {
                            const docTypeLabels: { [key: string]: string } = {
                              rg: 'RG (Frente e Verso)',
                              cpf: 'CPF',
                              crm: 'CRM',
                              diploma: 'Diploma de Medicina',
                              residencia: 'Certificado de Residência',
                              curriculum: 'Currículo Atualizado'
                            };
                            
                            return (
                              <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{docTypeLabels[doc.document_type] || doc.document_type}</p>
                                  <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Documento",
                                      description: `Visualizando ${docTypeLabels[doc.document_type] || doc.document_type}`,
                                    });
                                  }}
                                >
                                  Ver
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {forms.filter(f => f.status === 'rejected').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum formulário rejeitado</p>
              </CardContent>
            </Card>
          ) : (
            forms.filter(f => f.status === 'rejected').map((form) => (
              <Card key={form.application_id} className="hover:shadow-md transition-shadow border-destructive">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{form.doctor_name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Rejeitado</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(form.submitted_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Dados do formulário */}
                    <div>
                      <h4 className="font-semibold mb-3">Informações Pessoais</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {form.form_data?.form && Object.entries(form.form_data.form).map(([field, value]) => {
                          const fieldLabels: { [key: string]: string } = {
                            full_name: 'Nome Completo',
                            cpf: 'CPF',
                            rg: 'RG',
                            birth_date: 'Data de Nascimento',
                            phone: 'Telefone',
                            address: 'Endereço',
                            crm_number: 'Número do CRM',
                            specialty: 'Especialidade',
                            graduation_year: 'Ano de Formatura',
                            institution: 'Instituição de Ensino'
                          };
                          
                          return (
                            <div key={field}>
                              <span className="font-medium text-muted-foreground">
                                {fieldLabels[field] || field}:
                              </span>
                              <p className="text-foreground">{String(value || 'Não informado')}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Documentos anexados */}
                    {form.documents.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Documentos Anexados</h4>
                        <div className="space-y-2">
                          {form.documents.map((doc) => {
                            const docTypeLabels: { [key: string]: string } = {
                              rg: 'RG (Frente e Verso)',
                              cpf: 'CPF',
                              crm: 'CRM',
                              diploma: 'Diploma de Medicina',
                              residencia: 'Certificado de Residência',
                              curriculum: 'Currículo Atualizado'
                            };
                            
                            return (
                              <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{docTypeLabels[doc.document_type] || doc.document_type}</p>
                                  <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Documento",
                                      description: `Visualizando ${docTypeLabels[doc.document_type] || doc.document_type}`,
                                    });
                                  }}
                                >
                                  Ver
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}