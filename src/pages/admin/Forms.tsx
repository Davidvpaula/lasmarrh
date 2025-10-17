import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderOpen, User, Calendar, CheckCircle, XCircle, FileText, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

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
      // Buscar stage_progress da etapa 3
      const { data: stageData, error: stageError } = await supabase
        .from('stage_progress')
        .select('application_id, notes, status, created_at')
        .eq('stage_number', 3);

      if (stageError) throw stageError;

      // Buscar TODOS os documentos (mesmo sem stage_progress)
      const { data: allDocs, error: docsError } = await supabase
        .from('documents')
        .select('*');

      if (docsError) throw docsError;

      // Extrair application_ids únicos de ambas as fontes
      const stageAppIds = (stageData || []).map(s => s.application_id);
      const docsAppIds = [...new Set((allDocs || []).map(d => d.application_id).filter(Boolean))];
      const allAppIds = [...new Set([...stageAppIds, ...docsAppIds])];

      if (allAppIds.length === 0) {
        setForms([]);
        setLoading(false);
        return;
      }

      // Buscar applications e profiles
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('id, doctor_id')
        .in('id', allAppIds);

      if (appsError) throw appsError;

      const doctorIds = (appsData || []).map(a => a.doctor_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', doctorIds);

      if (profilesError) throw profilesError;

      const appMap = new Map((appsData || []).map(a => [a.id, a.doctor_id]));
      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p.full_name]));
      const stageMap = new Map((stageData || []).map(s => [s.application_id, s]));

      // Montar formattedData para cada application_id
      const formattedData: FormResponse[] = allAppIds.map(appId => {
        const stage = stageMap.get(appId);
        const relatedDocs = (allDocs || []).filter(doc => doc.application_id === appId);
        const doctorId = appMap.get(appId);
        const doctorName = profileMap.get(doctorId) || 'Nome não informado';
        
        let parsed: any = {};
        if (stage?.notes) {
          try { parsed = JSON.parse(stage.notes); } catch {}
        }

        return {
          application_id: appId,
          doctor_name: doctorName,
          form_data: parsed,
          documents: relatedDocs,
          submitted_at: stage?.created_at || relatedDocs[0]?.created_at || new Date().toISOString(),
          status: stage?.status || (relatedDocs.length > 0 ? 'in_progress' : 'pending')
        };
      });

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

  const FormDetailsDialog = ({ form }: { form: FormResponse }) => {
    const docTypeLabels: { [key: string]: string } = {
      rg: 'RG (Frente e Verso)',
      cpf: 'CPF',
      crm: 'CRM',
      diploma: 'Diploma de Medicina',
      residencia: 'Certificado de Residência',
      curriculum: 'Currículo Atualizado'
    };

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

    const handleDownloadDocument = async (doc: any) => {
      try {
        // Baixar arquivo do storage
        const { data, error } = await supabase.storage
          .from('candidate-documents')
          .download(doc.file_path);

        if (error) {
          throw error;
        }

        // Criar URL blob e fazer download
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Download concluído",
          description: `${doc.file_name} foi baixado com sucesso.`,
        });
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Erro ao baixar",
          description: "Não foi possível baixar o documento.",
          variant: "destructive",
        });
      }
    };

    const handleViewDocument = async (doc: any) => {
      try {
        // Obter URL assinada temporária (válida por 1 hora)
        const { data, error } = await supabase.storage
          .from('candidate-documents')
          .createSignedUrl(doc.file_path, 3600);

        if (error) {
          throw error;
        }

        // Abrir em nova aba
        window.open(data.signedUrl, '_blank');
      } catch (error) {
        console.error('View error:', error);
        toast({
          title: "Erro ao visualizar",
          description: "Não foi possível visualizar o documento.",
          variant: "destructive",
        });
      }
    };

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
              <User className="h-5 w-5" />
              Formulário de {form.doctor_name}
            </DialogTitle>
            <DialogDescription>
              Enviado em {new Date(form.submitted_at).toLocaleDateString('pt-BR')} às {new Date(form.submitted_at).toLocaleTimeString('pt-BR')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={
                form.status === 'approved' ? 'default' :
                form.status === 'rejected' ? 'destructive' : 'secondary'
              }>
                {form.status === 'approved' ? 'Aprovado' :
                 form.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
              </Badge>
            </div>

            <Separator />

            {/* Informações Pessoais */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </h3>
              {form.form_data?.form && Object.keys(form.form_data.form).length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(form.form_data.form).map(([field, value]) => (
                    <div key={field} className="border rounded-lg p-3 bg-muted/30">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {fieldLabels[field] || field}
                      </span>
                      <p className="text-sm font-medium mt-1">
                        {field === 'birth_date' && value ? 
                          new Date(value as string).toLocaleDateString('pt-BR') :
                          String(value || 'Não informado')
                        }
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum dado pessoal preenchido ainda</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Documentos Anexados */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos Anexados ({form.documents.length})
              </h3>
              
              {form.documents.length > 0 ? (
                <div className="space-y-3">
                  {form.documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-primary/10 rounded">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {docTypeLabels[doc.document_type] || doc.document_type}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {doc.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Enviado: {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhum documento anexado</p>
                </div>
              )}
            </div>

            {/* Documentos Marcados como Enviados */}
            {form.form_data?.uploadedDocs && form.form_data.uploadedDocs.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Documentos Registrados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {form.form_data.uploadedDocs.map((docType: string) => (
                      <Badge key={docType} variant="secondary">
                        {docTypeLabels[docType] || docType}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
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
                  
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <FormDetailsDialog form={form} />
                    
                    {(form.status === 'pending' || form.status === 'in_progress') && (
                      <>
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
                      </>
                    )}
                  </div>
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
                    <FormDetailsDialog form={form} />
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
                  
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <FormDetailsDialog form={form} />
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
                  
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <FormDetailsDialog form={form} />
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