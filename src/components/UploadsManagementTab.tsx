import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Users, FileText, Eye, Download, Upload, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Candidate {
  id: string;
  name: string;
  email: string;
  crm: string;
  phone: string;
  current_stage: number;
  documents: CandidateDocument[];
}

interface CandidateDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  is_required: boolean;
  created_at: string;
}

// Mock data para desenvolvimento - removido conforme solicitado
const mockCandidates: Candidate[] = [];

const mockDocumentTemplates: DocumentTemplate[] = [
  {
    id: 'template-001',
    name: 'RG (Documento de Identidade)',
    description: 'Documento de identidade válido e legível',
    is_required: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'template-002',
    name: 'CRM (Conselho Regional de Medicina)',
    description: 'Registro no Conselho Regional de Medicina',
    is_required: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'template-003',
    name: 'Diploma de Medicina',
    description: 'Diploma de graduação em Medicina',
    is_required: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'template-004',
    name: 'Comprovante de Residência',
    description: 'Comprovante de residência atualizado',
    is_required: false,
    created_at: '2024-01-01T00:00:00Z'
  }
];

const UploadsManagementTab = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    is_required: true
  });

  useEffect(() => {
    fetchRealCandidates();
  }, []);

  const fetchRealCandidates = async () => {
    try {
      setLoading(true);
      
      // Buscar applications com dados dos profiles e documentos
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          doctor_id,
          current_stage,
          profiles!applications_doctor_id_fkey (
            full_name,
            email,
            crm,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Buscar documentos para todas as applications
      const applicationIds = applicationsData?.map(app => app.id) || [];
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .in('application_id', applicationIds);

      if (docsError) throw docsError;

      // Transformar dados para o formato esperado
      const formattedCandidates: Candidate[] = applicationsData?.map(app => {
        const relatedDocs = documentsData?.filter(doc => doc.application_id === app.id) || [];
        
        return {
          id: app.id,
          name: app.profiles?.full_name || 'Nome não informado',
          email: app.profiles?.email || 'Email não informado',
          crm: app.profiles?.crm || 'CRM não informado',
          phone: app.profiles?.phone || 'Telefone não informado',
          current_stage: app.current_stage,
          documents: relatedDocs.map(doc => ({
            id: doc.id,
            document_type: doc.document_type,
            file_name: doc.file_name,
            file_path: doc.file_path,
            uploaded_at: doc.uploaded_at,
            status: 'pending' as 'pending' | 'approved' | 'rejected'
          }))
        };
      }) || [];

      setCandidates(formattedCandidates);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar candidatos do sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-success text-success-foreground">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pendente</Badge>;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      rg: 'RG (Frente e Verso)',
      cpf: 'CPF',
      crm: 'CRM',
      diploma: 'Diploma de Medicina',
      residencia: 'Certificado de Residência',
      curriculum: 'Currículo Atualizado',
      comprovante_residencia: 'Comprovante de Residência'
    };
    return labels[type] || type;
  };

  const updateDocumentStatus = async (candidateId: string, documentId: string, status: 'approved' | 'rejected') => {
    try {
      // Atualizar status no banco de dados se necessário
      // Por enquanto, apenas atualizar localmente
      const updatedCandidates = candidates.map(candidate => {
        if (candidate.id === candidateId) {
          return {
            ...candidate,
            documents: candidate.documents.map(doc => 
              doc.id === documentId ? { ...doc, status } : doc
            )
          };
        }
        return candidate;
      });
      setCandidates(updatedCandidates);
      
      toast({
        title: `Documento ${status === 'approved' ? 'aprovado' : 'rejeitado'}`,
        description: `Status do documento foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status do documento:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do documento.",
        variant: "destructive",
      });
    }
  };

  const addDocumentTemplate = () => {
    const newTemplate: DocumentTemplate = {
      id: `template-${Date.now()}`,
      ...templateData,
      created_at: new Date().toISOString()
    };
    
    setDocumentTemplates([...documentTemplates, newTemplate]);
    setIsTemplateDialogOpen(false);
    setTemplateData({ name: '', description: '', is_required: true });
    
    toast({
      title: "Template adicionado",
      description: "Novo template de documento foi criado com sucesso.",
    });
  };

  // Inicializar templates padrão
  useEffect(() => {
    setDocumentTemplates(mockDocumentTemplates);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Uploads e Documentos</CardTitle>
          <CardDescription>
            Gerencie candidatos, documentos enviados e templates de formulários
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidates and Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Candidatos e Documentos</CardTitle>
            <CardDescription>
              Visualize e aprove documentos enviados pelos candidatos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-8 bg-muted rounded"></div>
                        <div className="h-8 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <div key={candidate.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                        <p className="text-sm text-muted-foreground">{candidate.crm}</p>
                      </div>
                      <Badge variant="outline">
                        Etapa {candidate.current_stage}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Documentos Enviados:</h4>
                      {candidate.documents.length > 0 ? (
                        candidate.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{getDocumentTypeLabel(doc.document_type)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(doc.status)}
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              {doc.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    className="bg-success hover:bg-success/90"
                                    onClick={() => updateDocumentStatus(candidate.id, doc.id, 'approved')}
                                  >
                                    Aprovar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => updateDocumentStatus(candidate.id, doc.id, 'rejected')}
                                  >
                                    Rejeitar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum documento enviado</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum candidato encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Templates */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Templates de Documentos</CardTitle>
                <CardDescription>
                  Configure quais documentos os candidatos devem enviar
                </CardDescription>
              </div>
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Template de Documento</DialogTitle>
                    <DialogDescription>
                      Configure um novo tipo de documento que os candidatos devem enviar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template_name">Nome do Documento</Label>
                      <Input
                        id="template_name"
                        value={templateData.name}
                        onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                        placeholder="Ex: Diploma de Medicina"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template_description">Descrição</Label>
                      <Textarea
                        id="template_description"
                        value={templateData.description}
                        onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                        placeholder="Descreva o que deve conter no documento"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_required"
                        checked={templateData.is_required}
                        onChange={(e) => setTemplateData({...templateData, is_required: e.target.checked})}
                      />
                      <Label htmlFor="is_required">Documento obrigatório</Label>
                    </div>
                    <Button onClick={addDocumentTemplate} className="w-full">
                      Adicionar Template
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documentTemplates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.is_required ? "default" : "outline"}>
                      {template.is_required ? "Obrigatório" : "Opcional"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {documentTemplates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum template configurado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadsManagementTab;