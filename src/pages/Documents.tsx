import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Upload, CheckCircle, X } from 'lucide-react';

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

  useEffect(() => {
    checkStageStatus();
  }, []);

  const checkStageStatus = async () => {
    try {
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
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
    const fileExt = file.name.split('.').pop();
    const fileName = `${applicationId}/${docType}_${Date.now()}.${fileExt}`;
    
    // For now, we'll simulate file upload and store document records
    // In a real implementation, you would upload to Supabase Storage
    await supabase
      .from('documents')
      .insert({
        application_id: applicationId,
        document_type: docType,
        file_path: `documents/${fileName}`,
        file_name: file.name
      });

    return fileName;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
        // Upload new files
        const newUploadedDocs = [...uploadedDocs];
        for (const [docType, file] of Object.entries(files)) {
          try {
            await uploadFile(file, docType, application.id);
            if (!newUploadedDocs.includes(docType)) {
              newUploadedDocs.push(docType);
            }
          } catch (error) {
            console.error(`Error uploading ${docType}:`, error);
          }
        }

        // Update stage progress
        await supabase
          .from('stage_progress')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            notes: JSON.stringify({ form, uploadedDocs: newUploadedDocs })
          })
          .eq('application_id', application.id)
          .eq('stage_number', 3);

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