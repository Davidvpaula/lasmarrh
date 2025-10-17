import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Edit, Trash2, Upload, File, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

interface FormField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: any;
  is_required: boolean;
  placeholder?: string;
  help_text?: string;
  order_index: number;
  is_active: boolean;
}

interface SignatureDocument {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_url: string;
  file_name: string;
  is_required: boolean;
  is_active: boolean;
  order_index: number;
}

const fieldTypeOptions = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'cpf', label: 'CPF' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção' },
];

const documentSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
});

export default function EditForms() {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [signatureDocuments, setSignatureDocuments] = useState<SignatureDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingDoc, setEditingDoc] = useState<SignatureDocument | null>(null);
  const { toast } = useToast();

  const [fieldFormData, setFieldFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    placeholder: '',
    help_text: '',
    is_active: true,
  });

  const [docFormData, setDocFormData] = useState({
    title: '',
    description: '',
    is_required: true,
    is_active: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fieldsRes, docsRes] = await Promise.all([
        supabase.from('form_fields').select('*').order('order_index'),
        supabase.from('signature_documents').select('*').order('order_index'),
      ]);

      if (fieldsRes.error) throw fieldsRes.error;
      if (docsRes.error) throw docsRes.error;

      setFormFields(fieldsRes.data || []);
      setSignatureDocuments(docsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do formulário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        ...fieldFormData,
        order_index: editingField ? editingField.order_index : formFields.length,
      };

      if (editingField) {
        const { error } = await supabase
          .from('form_fields')
          .update(dataToSave)
          .eq('id', editingField.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Campo atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('form_fields')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Campo criado com sucesso",
        });
      }

      resetFieldForm();
      fetchData();
      setIsFieldDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar campo",
        variant: "destructive",
      });
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar com Zod
      const validation = documentSchema.safeParse({
        title: docFormData.title,
        description: docFormData.description,
      });

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        toast({
          title: "Erro de Validação",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      // Se for novo documento, precisa de arquivo
      if (!editingDoc && !selectedFile) {
        toast({
          title: "Erro",
          description: "Selecione um arquivo para upload",
          variant: "destructive",
        });
        return;
      }

      let file_path = editingDoc?.file_path || '';
      let file_url = editingDoc?.file_url || '';
      let file_name = editingDoc?.file_name || '';

      // Upload do arquivo se houver
      if (selectedFile) {
        // Validar tipo de arquivo (apenas PDF)
        if (selectedFile.type !== 'application/pdf') {
          toast({
            title: "Erro",
            description: "Apenas arquivos PDF são permitidos",
            variant: "destructive",
          });
          return;
        }

        // Validar tamanho (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast({
            title: "Erro",
            description: "Arquivo muito grande. Máximo: 10MB",
            variant: "destructive",
          });
          return;
        }

        const timestamp = Date.now();
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        file_path = `signature-docs/${timestamp}-${sanitizedFileName}`;
        file_name = selectedFile.name;

        const { error: uploadError } = await supabase.storage
          .from('candidate-documents')
          .upload(file_path, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('candidate-documents')
          .getPublicUrl(file_path);

        file_url = urlData.publicUrl;
      }

      const dataToSave = {
        ...docFormData,
        file_path,
        file_url,
        file_name,
        order_index: editingDoc ? editingDoc.order_index : signatureDocuments.length,
      };

      if (editingDoc) {
        const { error } = await supabase
          .from('signature_documents')
          .update(dataToSave)
          .eq('id', editingDoc.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Documento atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('signature_documents')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Documento criado com sucesso",
        });
      }

      resetDocForm();
      fetchData();
      setIsDocDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar documento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return;

    try {
      const { error } = await supabase
        .from('form_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campo excluído com sucesso",
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao excluir campo:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir campo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const { error } = await supabase
        .from('signature_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso",
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir documento",
        variant: "destructive",
      });
    }
  };

  const handleToggleFieldActive = async (fieldId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('form_fields')
        .update({ is_active: !isActive })
        .eq('id', fieldId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleToggleDocActive = async (docId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('signature_documents')
        .update({ is_active: !isActive })
        .eq('id', docId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const resetFieldForm = () => {
    setFieldFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      placeholder: '',
      help_text: '',
      is_active: true,
    });
    setEditingField(null);
  };

  const resetDocForm = () => {
    setDocFormData({
      title: '',
      description: '',
      is_required: true,
      is_active: true,
    });
    setSelectedFile(null);
    setEditingDoc(null);
  };

  const startEditField = (field: FormField) => {
    setEditingField(field);
    setFieldFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      is_active: field.is_active,
    });
    setIsFieldDialogOpen(true);
  };

  const startEditDoc = (doc: SignatureDocument) => {
    setEditingDoc(doc);
    setDocFormData({
      title: doc.title,
      description: doc.description || '',
      is_required: doc.is_required,
      is_active: doc.is_active,
    });
    setIsDocDialogOpen(true);
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
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Editar Formulário e Documentos</h1>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="fields">Campos do Formulário</TabsTrigger>
          <TabsTrigger value="documents">Documentos para Assinatura</TabsTrigger>
        </TabsList>

        {/* TAB: Campos do Formulário */}
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Campos Personalizados</CardTitle>
                  <CardDescription>
                    Configure os campos que aparecerão no formulário de documentos
                  </CardDescription>
                </div>
                <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetFieldForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Campo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingField ? 'Editar Campo' : 'Novo Campo'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFieldSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="field_name">Nome do Campo (ID)</Label>
                          <Input
                            id="field_name"
                            value={fieldFormData.field_name}
                            onChange={(e) => setFieldFormData(prev => ({ ...prev, field_name: e.target.value }))}
                            placeholder="ex: endereco"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="field_label">Rótulo</Label>
                          <Input
                            id="field_label"
                            value={fieldFormData.field_label}
                            onChange={(e) => setFieldFormData(prev => ({ ...prev, field_label: e.target.value }))}
                            placeholder="ex: Endereço Completo"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="field_type">Tipo de Campo</Label>
                        <Select
                          value={fieldFormData.field_type}
                          onValueChange={(value) => setFieldFormData(prev => ({ ...prev, field_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypeOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="placeholder">Placeholder</Label>
                        <Input
                          id="placeholder"
                          value={fieldFormData.placeholder}
                          onChange={(e) => setFieldFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                          placeholder="Texto de exemplo"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="help_text">Texto de Ajuda</Label>
                        <Textarea
                          id="help_text"
                          value={fieldFormData.help_text}
                          onChange={(e) => setFieldFormData(prev => ({ ...prev, help_text: e.target.value }))}
                          placeholder="Informação adicional sobre o campo"
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_required"
                            checked={fieldFormData.is_required}
                            onCheckedChange={(checked) => setFieldFormData(prev => ({ ...prev, is_required: checked }))}
                          />
                          <Label htmlFor="is_required">Campo obrigatório</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active_field"
                            checked={fieldFormData.is_active}
                            onCheckedChange={(checked) => setFieldFormData(prev => ({ ...prev, is_active: checked }))}
                          />
                          <Label htmlFor="is_active_field">Campo ativo</Label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingField ? 'Atualizar' : 'Criar'} Campo
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum campo personalizado criado</p>
                  </div>
                ) : (
                  formFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{field.field_label}</h4>
                            {field.is_required && (
                              <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {fieldTypeOptions.find(o => o.value === field.field_type)?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {field.field_name}</p>
                          {field.help_text && (
                            <p className="text-xs text-muted-foreground mt-1">{field.help_text}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.is_active}
                          onCheckedChange={() => handleToggleFieldActive(field.id, field.is_active)}
                        />
                        <Button variant="outline" size="sm" onClick={() => startEditField(field)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteField(field.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Documentos para Assinatura */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Documentos para Assinatura</CardTitle>
                  <CardDescription>
                    Faça upload de documentos que os candidatos precisam assinar
                  </CardDescription>
                </div>
                <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetDocForm}>
                      <Upload className="h-4 w-4 mr-2" />
                      Novo Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDoc ? 'Editar Documento' : 'Novo Documento'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDocSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc_title">Título do Documento</Label>
                        <Input
                          id="doc_title"
                          value={docFormData.title}
                          onChange={(e) => setDocFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="ex: Termo de Compromisso"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doc_description">Descrição</Label>
                        <Textarea
                          id="doc_description"
                          value={docFormData.description}
                          onChange={(e) => setDocFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o documento"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doc_file">Arquivo PDF {!editingDoc && '*'}</Label>
                        <Input
                          id="doc_file"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Apenas arquivos PDF até 10MB
                        </p>
                        {editingDoc && (
                          <p className="text-xs text-muted-foreground">
                            Arquivo atual: {editingDoc.file_name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="doc_required"
                            checked={docFormData.is_required}
                            onCheckedChange={(checked) => setDocFormData(prev => ({ ...prev, is_required: checked }))}
                          />
                          <Label htmlFor="doc_required">Documento obrigatório</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active_doc"
                            checked={docFormData.is_active}
                            onCheckedChange={(checked) => setDocFormData(prev => ({ ...prev, is_active: checked }))}
                          />
                          <Label htmlFor="is_active_doc">Documento ativo</Label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDocDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingDoc ? 'Atualizar' : 'Criar'} Documento
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {signatureDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum documento para assinatura</p>
                  </div>
                ) : (
                  signatureDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <File className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{doc.title}</h4>
                            {doc.is_required && (
                              <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{doc.file_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          Ver
                        </Button>
                        <Switch
                          checked={doc.is_active}
                          onCheckedChange={() => handleToggleDocActive(doc.id, doc.is_active)}
                        />
                        <Button variant="outline" size="sm" onClick={() => startEditDoc(doc)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteDoc(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
