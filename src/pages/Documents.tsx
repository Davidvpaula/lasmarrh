import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Upload, CheckCircle, X, Download, FileSignature } from 'lucide-react';
import { z } from 'zod';

// Schema de validação com Zod
const documentFormSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  cpf: z.string().trim().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido'),
  rg: z.string().trim().min(5, 'RG inválido').max(20, 'RG muito longo'),
  birth_date: z.string().min(1, 'Data de nascimento obrigatória'),
  phone: z.string().trim().regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$|^\d{10,11}$/, 'Telefone inválido'),
  address: z.string().trim().min(10, 'Endereço muito curto').max(200, 'Endereço muito longo'),
  crm_number: z.string().trim().min(3, 'CRM inválido').max(20, 'CRM muito longo'),
  specialty: z.string().trim().min(2, 'Especialidade inválida').max(100, 'Especialidade muito longa'),
  graduation_year: z.string().regex(/^\d{4}$/, 'Ano inválido'),
  institution: z.string().trim().min(3, 'Nome da instituição muito curto').max(150, 'Nome da instituição muito longo')
});

interface DocumentForm {
  full_name: string;
  cpf: string;
  rg: string;
  birth_date: string;
  phone: string;
  address: string;
  crm_number: string;
  specialty: string;
  graduation_year: string;
  institution: string;
}

interface SignatureDocument {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  is_required: boolean;
}

interface SignedDocument {
  id: string;
  signature_document_id: string;
  status: string;
  signed_at?: string;
  signed_file_url?: string;
}

const REQUIRED_DOCUMENTS = [
  { type: 'rg', label: 'RG (Frente e Verso)' },
  { type: 'cpf', label: 'CPF' },
  { type: 'crm', label: 'CRM' },
  { type: 'diploma', label: 'Diploma de Medicina' },
  { type: 'residencia', label: 'Certificado de Residência (se aplicável)' },
  { type: 'curriculum', label: 'Currículo Atualizado' },
];

const Documents = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<DocumentForm>({
    full_name: '',
    cpf: '',
    rg: '',
    birth_date: '',
    phone: '',
    address: '',
    crm_number: '',
    specialty: '',
    graduation_year: '',
    institution: ''
  });
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [stageStatus, setStageStatus] = useState('');
  const [signatureDocuments, setSignatureDocuments] = useState<SignatureDocument[]>([]);
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [signatureFiles, setSignatureFiles] = useState<{ [key: string]: File }>({});

  useEffect(() => {
    checkStageStatus();
  }, []);

  useEffect(() => {
    if (applicationId) {
      fetchSignatureDocuments();
    }
  }, [applicationId]);

  const checkStageStatus = async () => {
    try {
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
        setApplicationId(application.id);
        
        const { data: stage } = await supabase
          .from('stage_progress')
          .select('status, notes')
          .eq('application_id', application.id)
          .eq('stage_number', 3)
          .single();

        if (stage) {
          setStageStatus(stage.status);
          
          // Check if user has admin approval to access this stage
          if (stage.status === 'locked') {
            toast({
              title: "Acesso Bloqueado",
              description: "Aguardando liberação do administrador para continuar esta etapa.",
              variant: "destructive",
            });
            setTimeout(() => navigate('/interview'), 2000);
            return;
          }
          
          if (stage.notes) {
            try {
              const savedData = JSON.parse(stage.notes);
              if (savedData.form) setForm(savedData.form);
              if (savedData.uploadedDocs) setUploadedDocs(savedData.uploadedDocs);
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }

        // Load existing documents
        const { data: documents } = await supabase
          .from('documents')
          .select('document_type')
          .eq('application_id', application.id);

        if (documents) {
          setUploadedDocs(documents.map(doc => doc.document_type));
        }
      }
    } catch (error) {
      console.error('Error checking stage status:', error);
    }
  };

  const fetchSignatureDocuments = async () => {
    try {
      // Buscar documentos disponíveis para assinatura
      const { data: docs, error: docsError } = await supabase
        .from('signature_documents')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (docsError) throw docsError;

      setSignatureDocuments(docs || []);

      // Buscar documentos já assinados pelo candidato
      if (applicationId) {
        const { data: signed, error: signedError } = await supabase
          .from('signed_documents')
          .select('*')
          .eq('application_id', applicationId);

        if (signedError) throw signedError;

        setSignedDocuments(signed || []);
      }
    } catch (error) {
      console.error('Error fetching signature documents:', error);
    }
  };

  const handleSignatureFileChange = (docId: string, file: File | null) => {
    if (file) {
      setSignatureFiles({ ...signatureFiles, [docId]: file });
    } else {
      const newFiles = { ...signatureFiles };
      delete newFiles[docId];
      setSignatureFiles(newFiles);
    }
  };

  const handleSignatureUpload = async (docId: string) => {
    const file = signatureFiles[docId];
    
    if (!file || !applicationId) return;

    try {
      // Validar tipo de arquivo (apenas PDF)
      if (file.type !== 'application/pdf') {
        toast({
          title: "Erro",
          description: "Apenas arquivos PDF são permitidos",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo: 10MB",
          variant: "destructive",
        });
        return;
      }

      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `signed-docs/${applicationId}/${timestamp}-${sanitizedFileName}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('candidate-documents')
        .getPublicUrl(filePath);

      // Salvar registro do documento assinado
      const { error: insertError } = await supabase
        .from('signed_documents')
        .upsert({
          application_id: applicationId,
          signature_document_id: docId,
          signed_file_path: filePath,
          signed_file_url: urlData.publicUrl,
          signed_at: new Date().toISOString(),
          status: 'signed',
        });

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: "Documento assinado enviado com sucesso",
      });

      // Atualizar lista de documentos assinados
      fetchSignatureDocuments();
      
      // Limpar arquivo selecionado
      handleSignatureFileChange(docId, null);
    } catch (error) {
      console.error('Error uploading signed document:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar documento assinado",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (docType: string, file: File | null) => {
    if (file) {
      setFiles({ ...files, [docType]: file });
    } else {
      const newFiles = { ...files };
      delete newFiles[docType];
      setFiles(newFiles);
    }
  };

  const uploadFile = async (file: File, docType: string, applicationId: string) => {
    // Validar tamanho do arquivo (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo: 10MB');
    }

    // Validar tipo do arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.user_id}/${docType}_${Date.now()}.${fileExt}`;
    
    // Upload real para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    // Obter URL pública (mesmo sendo privado, para referência)
    const { data: { publicUrl } } = supabase.storage
      .from('candidate-documents')
      .getPublicUrl(fileName);
    
    // Salvar registro do documento no banco
    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        application_id: applicationId,
        document_type: docType,
        file_path: fileName,
        file_name: file.name,
        title: docType,
        file_url: publicUrl
      });

    if (dbError) {
      // Se falhar ao salvar no banco, deletar o arquivo do storage
      await supabase.storage.from('candidate-documents').remove([fileName]);
      throw new Error(`Erro ao salvar registro: ${dbError.message}`);
    }

    return fileName;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Validar formulário com Zod
      const validationResult = documentFormSchema.safeParse(form);
      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || 'Erro de validação';
        toast({
          title: "Erro de validação",
          description: firstError,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar se há arquivos para upload
      if (Object.keys(files).length === 0) {
        toast({
          title: "Atenção",
          description: "Anexe pelo menos um documento antes de enviar.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
        // Upload new files
        const newUploadedDocs = [...uploadedDocs];
        let uploadErrors = 0;
        
        for (const [docType, file] of Object.entries(files)) {
          try {
            await uploadFile(file, docType, application.id);
            if (!newUploadedDocs.includes(docType)) {
              newUploadedDocs.push(docType);
            }
          } catch (error) {
            uploadErrors++;
            toast({
              title: "Erro no upload",
              description: error instanceof Error ? error.message : `Erro ao fazer upload de ${docType}`,
              variant: "destructive",
            });
          }
        }

        if (uploadErrors === Object.keys(files).length) {
          toast({
            title: "Erro",
            description: "Não foi possível fazer upload de nenhum documento.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Update stage progress with validated form data
        const { error: updateError } = await supabase
          .from('stage_progress')
          .update({
            status: 'in_progress',
            notes: JSON.stringify({ form: validationResult.data, uploadedDocs: newUploadedDocs })
          })
          .eq('application_id', application.id)
          .eq('stage_number', 3);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Documentos enviados!",
          description: "Seus dados e documentos foram enviados para análise.",
        });

        navigate('/training/professional');
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar os documentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (stageStatus === 'locked') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-warning">
            <CardHeader>
              <div className="flex items-center gap-3">
                <X className="h-6 w-6 text-warning" />
                <div>
                  <CardTitle className="text-warning">Acesso Restrito</CardTitle>
                  <CardDescription>
                    Falta a liberação do administrador para continuar essa etapa.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Você será redirecionado para a página de entrevista. Aguarde a aprovação do administrador para prosseguir.
              </p>
              <Button onClick={() => navigate('/interview')} className="w-full">
                Voltar para Entrevista
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (stageStatus === 'completed' || stageStatus === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <Card className="border-success">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <CardTitle className="text-success">Documentos Enviados</CardTitle>
                  <CardDescription>Você já completou esta etapa com sucesso.</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          {/* Personal Information Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Etapa 3: Dados Pessoais e Profissionais</CardTitle>
                  <CardDescription>
                    Preencha seus dados e envie os documentos obrigatórios
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={form.cpf}
                      onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={form.rg}
                      onChange={(e) => setForm({ ...form, rg: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crm_number">Número do CRM</Label>
                    <Input
                      id="crm_number"
                      value={form.crm_number}
                      onChange={(e) => setForm({ ...form, crm_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidade</Label>
                    <Input
                      id="specialty"
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduation_year">Ano de Formatura</Label>
                    <Input
                      id="graduation_year"
                      type="number"
                      value={form.graduation_year}
                      onChange={(e) => setForm({ ...form, graduation_year: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution">Instituição de Ensino</Label>
                    <Input
                      id="institution"
                      value={form.institution}
                      onChange={(e) => setForm({ ...form, institution: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Download Section */}
          {signatureDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Download className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Download do Contrato</CardTitle>
                    <CardDescription>
                      Baixe os contratos disponibilizados pelo administrador
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {signatureDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-5 w-5 text-primary" />
                          <h4 className="font-medium">{doc.title}</h4>
                          {doc.is_required && (
                            <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">Obrigatório</span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground ml-7">{doc.description}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="flex-shrink-0 ml-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signature Documents - Available for Download and Signing */}
          {signatureDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileSignature className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Documentos para Assinatura</CardTitle>
                    <CardDescription>
                      Baixe, assine e envie os documentos obrigatórios
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {signatureDocuments.map((doc) => {
                    const signedDoc = signedDocuments.find(sd => sd.signature_document_id === doc.id);
                    const isSigned = signedDoc?.status === 'signed';

                    return (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{doc.title}</h4>
                              {doc.is_required && (
                                <span className="text-xs text-destructive">*Obrigatório</span>
                              )}
                              {isSigned && (
                                <CheckCircle className="h-5 w-5 text-success" />
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground">{doc.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          {/* Download original document */}
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.file_url, '_blank')}
                              className="flex-shrink-0"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar Documento
                            </Button>
                            <span className="text-xs text-muted-foreground">{doc.file_name}</span>
                          </div>

                          {/* Upload signed document */}
                          {!isSigned ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleSignatureFileChange(doc.id, e.target.files?.[0] || null)}
                                className="flex-1"
                              />
                              {signatureFiles[doc.id] && (
                                <>
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleSignatureUpload(doc.id)}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Enviar Assinado
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleSignatureFileChange(doc.id, null)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Documento assinado enviado em {new Date(signedDoc.signed_at!).toLocaleDateString()}</span>
                              {signedDoc.signed_file_url && (
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  onClick={() => window.open(signedDoc.signed_file_url, '_blank')}
                                >
                                  Ver documento assinado
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Upload de Documentos</CardTitle>
                  <CardDescription>
                    Envie os documentos obrigatórios (PDF, JPG, PNG - máx. 5MB cada)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {REQUIRED_DOCUMENTS.map((doc) => (
                  <div key={doc.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">{doc.label}</Label>
                      {uploadedDocs.includes(doc.type) && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(doc.type, e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {files[doc.type] && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleFileChange(doc.type, null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button at the end */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? "Enviando..." : "Enviar Documentos"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Documents;