import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

interface InterviewField {
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

const fieldTypeOptions = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'select', label: 'Seleção (Dropdown)' },
  { value: 'radio', label: 'Múltipla Escolha (Radio)' },
];

const fieldSchema = z.object({
  field_name: z.string().min(2, "Nome do campo muito curto").regex(/^[a-z_]+$/, "Use apenas letras minúsculas e underscore"),
  field_label: z.string().min(3, "Rótulo muito curto"),
  field_type: z.string().min(1, "Selecione um tipo"),
});

export default function EditInterview() {
  const [fields, setFields] = useState<InterviewField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<InterviewField | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    placeholder: '',
    help_text: '',
    is_active: true,
    field_options: '',
  });

  useEffect(() => {
    fetchFields();

    // Configurar real-time para atualizações automáticas
    const channel = supabase
      .channel('interview-fields-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interview_fields' },
        () => fetchFields()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_fields')
        .select('*')
        .order('order_index');

      if (error) throw error;

      setFields(data || []);
    } catch (error) {
      console.error('Erro ao carregar campos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar campos da entrevista",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar com Zod
      const validation = fieldSchema.safeParse({
        field_name: formData.field_name,
        field_label: formData.field_label,
        field_type: formData.field_type,
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

      // Parse field_options se for select ou radio
      let field_options = null;
      if ((formData.field_type === 'select' || formData.field_type === 'radio') && formData.field_options) {
        try {
          const options = formData.field_options.split('\n').filter(opt => opt.trim());
          field_options = { options };
        } catch (e) {
          toast({
            title: "Erro",
            description: "Opções inválidas. Use uma opção por linha.",
            variant: "destructive",
          });
          return;
        }
      }

      const dataToSave = {
        field_name: formData.field_name,
        field_label: formData.field_label,
        field_type: formData.field_type,
        is_required: formData.is_required,
        placeholder: formData.placeholder || null,
        help_text: formData.help_text || null,
        is_active: formData.is_active,
        field_options,
        order_index: editingField ? editingField.order_index : fields.length,
      };

      if (editingField) {
        const { error } = await supabase
          .from('interview_fields')
          .update(dataToSave)
          .eq('id', editingField.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Campo atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('interview_fields')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Campo criado com sucesso",
        });
      }

      resetForm();
      fetchFields();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar campo:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar campo",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return;

    try {
      const { error } = await supabase
        .from('interview_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campo excluído com sucesso",
      });

      fetchFields();
    } catch (error) {
      console.error('Erro ao excluir campo:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir campo",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (fieldId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('interview_fields')
        .update({ is_active: !isActive })
        .eq('id', fieldId);

      if (error) throw error;
      fetchFields();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      placeholder: '',
      help_text: '',
      is_active: true,
      field_options: '',
    });
    setEditingField(null);
  };

  const startEdit = (field: InterviewField) => {
    setEditingField(field);
    
    let field_options_str = '';
    if (field.field_options && field.field_options.options) {
      field_options_str = field.field_options.options.join('\n');
    }

    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      is_active: field.is_active,
      field_options: field_options_str,
    });
    setIsDialogOpen(true);
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
        <h1 className="text-3xl font-bold">Editar Campos da Entrevista</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Campos Personalizados da Entrevista</CardTitle>
              <CardDescription>
                Configure os campos que aparecerão na página de entrevista para os profissionais
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="field_name">Nome do Campo (ID)</Label>
                      <Input
                        id="field_name"
                        value={formData.field_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value.toLowerCase().replace(/[^a-z_]/g, '_') }))}
                        placeholder="ex: motivo_interesse"
                        required
                        disabled={!!editingField}
                      />
                      <p className="text-xs text-muted-foreground">
                        Apenas letras minúsculas e underscore
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field_type">Tipo de Campo</Label>
                      <Select
                        value={formData.field_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, field_type: value }))}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field_label">Pergunta / Rótulo</Label>
                    <Textarea
                      id="field_label"
                      value={formData.field_label}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))}
                      placeholder="Ex: Por que você quer fazer parte da nossa equipe?"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placeholder">Placeholder</Label>
                    <Input
                      id="placeholder"
                      value={formData.placeholder}
                      onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                      placeholder="Texto de exemplo no campo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="help_text">Texto de Ajuda</Label>
                    <Input
                      id="help_text"
                      value={formData.help_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, help_text: e.target.value }))}
                      placeholder="Informação adicional sobre o campo"
                    />
                  </div>

                  {(formData.field_type === 'select' || formData.field_type === 'radio') && (
                    <div className="space-y-2">
                      <Label htmlFor="field_options">Opções (uma por linha)</Label>
                      <Textarea
                        id="field_options"
                        value={formData.field_options}
                        onChange={(e) => setFormData(prev => ({ ...prev, field_options: e.target.value }))}
                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                        rows={5}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_required"
                        checked={formData.is_required}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                      />
                      <Label htmlFor="is_required">Campo obrigatório</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Campo ativo</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum campo personalizado criado</p>
              </div>
            ) : (
              fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{field.field_label}</h4>
                        {field.is_required && (
                          <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {fieldTypeOptions.find(o => o.value === field.field_type)?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>ID: {field.field_name}</span>
                        {field.placeholder && (
                          <span>• Placeholder: {field.placeholder}</span>
                        )}
                      </div>
                      {field.help_text && (
                        <p className="text-xs text-muted-foreground mt-1">{field.help_text}</p>
                      )}
                      {field.field_options && field.field_options.options && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Opções: {field.field_options.options.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.is_active}
                      onCheckedChange={() => handleToggleActive(field.id, field.is_active)}
                    />
                    <Button variant="outline" size="sm" onClick={() => startEdit(field)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(field.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Os campos criados aqui aparecerão automaticamente na página de entrevista do profissional</p>
          <p>• Use IDs descritivos e únicos para cada campo (ex: experiencia_clinica, motivo_interesse)</p>
          <p>• Campos marcados como obrigatórios devem ser preenchidos antes do envio</p>
          <p>• Campos inativos não aparecerão para os profissionais</p>
          <p>• A ordem dos campos pode ser ajustada arrastando-os (funcionalidade futura)</p>
        </CardContent>
      </Card>
    </div>
  );
}
