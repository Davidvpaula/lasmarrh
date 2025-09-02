import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Edit, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface FormField {
  id: number
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string[]
}

const Uploads = () => {
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      name: 'Contrato de Trabalho.pdf',
      type: 'contract',
      uploadDate: '2024-01-15',
      status: 'active'
    },
    {
      id: 2,
      name: 'Código de Ética.pdf',
      type: 'ethics',
      uploadDate: '2024-01-10',
      status: 'active'
    }
  ])

  const [formFields, setFormFields] = useState<FormField[]>([
    {
      id: 1,
      label: 'Nome Completo',
      type: 'text',
      required: true,
      placeholder: 'Digite seu nome completo'
    },
    {
      id: 2,
      label: 'CRM',
      type: 'text',
      required: true,
      placeholder: 'Digite seu número do CRM'
    },
    {
      id: 3,
      label: 'Especialidade',
      type: 'select',
      required: true,
      options: ['Cardiologia', 'Neurologia', 'Pediatria', 'Ginecologia']
    }
  ])

  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: ''
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const newFile = {
        id: uploadedFiles.length + 1,
        name: file.name,
        type: 'document',
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'active'
      }
      setUploadedFiles([...uploadedFiles, newFile])
      toast.success('Arquivo enviado com sucesso!')
    }
  }

  const handleDeleteFile = (id: number) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id))
    toast.success('Arquivo removido com sucesso!')
  }

  const handleAddField = () => {
    if (!newField.label.trim()) {
      toast.error('Digite um rótulo para o campo')
      return
    }

    const field = {
      id: formFields.length + 1,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      placeholder: newField.placeholder,
      ...(newField.type === 'select' && { 
        options: newField.options.split(',').map(opt => opt.trim()).filter(Boolean) 
      })
    }

    setFormFields([...formFields, field])
    setNewField({
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: ''
    })
    toast.success('Campo adicionado com sucesso!')
  }

  const handleDeleteField = (id: number) => {
    setFormFields(formFields.filter(field => field.id !== id))
    toast.success('Campo removido com sucesso!')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Uploads e Formulários</h1>
          <p className="text-muted-foreground">Gerencie documentos para assinatura e edite formulários dos profissionais</p>
        </div>
      </div>

      <Tabs defaultValue="uploads" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="uploads">Documentos para Assinatura</TabsTrigger>
          <TabsTrigger value="forms">Edição de Formulários</TabsTrigger>
        </TabsList>

        <TabsContent value="uploads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Enviar Documentos
              </CardTitle>
              <CardDescription>
                Envie documentos que precisam ser assinados pelos profissionais de saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Selecionar Arquivo</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatos aceitos: PDF, DOC, DOCX
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos Enviados</CardTitle>
              <CardDescription>
                Lista de documentos disponíveis para os profissionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">Enviado em {file.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={file.status === 'active' ? 'default' : 'secondary'}>
                        {file.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Novo Campo
              </CardTitle>
              <CardDescription>
                Adicione novos campos ao formulário dos profissionais de saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="field-label">Rótulo do Campo</Label>
                  <Input
                    id="field-label"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="Ex: Número do CRM"
                  />
                </div>
                <div>
                  <Label htmlFor="field-type">Tipo do Campo</Label>
                  <select
                    id="field-type"
                    className="w-full p-2 border rounded-md"
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                  >
                    <option value="text">Texto</option>
                    <option value="email">Email</option>
                    <option value="tel">Telefone</option>
                    <option value="select">Seleção</option>
                    <option value="textarea">Área de Texto</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="field-placeholder">Placeholder</Label>
                  <Input
                    id="field-placeholder"
                    value={newField.placeholder}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="Texto de ajuda"
                  />
                </div>
                {newField.type === 'select' && (
                  <div>
                    <Label htmlFor="field-options">Opções (separadas por vírgula)</Label>
                    <Input
                      id="field-options"
                      value={newField.options}
                      onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                      placeholder="Opção 1, Opção 2, Opção 3"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="field-required"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  />
                  <Label htmlFor="field-required">Campo obrigatório</Label>
                </div>
              </div>
              <Button onClick={handleAddField} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Campo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Campos do Formulário
              </CardTitle>
              <CardDescription>
                Gerencie os campos existentes no formulário dos profissionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{field.label}</h4>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {field.type} | Placeholder: {field.placeholder || 'Nenhum'}
                      </p>
                      {'options' in field && field.options && (
                        <p className="text-sm text-muted-foreground">
                          Opções: {(field.options as string[]).join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Uploads