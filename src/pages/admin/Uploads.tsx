import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Download, Eye, Calendar, User } from "lucide-react"

interface Document {
  id: string
  document_type: string
  file_name: string
  file_path: string
  uploaded_at: string
  application_id: string
  applications: {
    profiles: {
      full_name: string
      email: string
    }
  }
}

const Uploads = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          applications!inner (
            profiles!applications_doctor_id_fkey (
              full_name,
              email
            )
          )
        `)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDocumentTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: any }> = {
      'diploma': { label: 'Diploma', variant: 'default' },
      'crm': { label: 'CRM', variant: 'secondary' },
      'rg': { label: 'RG', variant: 'outline' },
      'cpf': { label: 'CPF', variant: 'outline' },
      'comprovante_residencia': { label: 'Comprovante de Residência', variant: 'secondary' },
      'foto': { label: 'Foto', variant: 'default' },
      'curriculum': { label: 'Currículo', variant: 'secondary' },
      'outros': { label: 'Outros', variant: 'outline' }
    }
    return typeMap[type] || { label: type, variant: 'default' }
  }

  const downloadDocument = async (document: Document) => {
    try {
      // Em um ambiente real, você implementaria o download do arquivo
      // Por enquanto, apenas mostramos uma mensagem
      toast({
        title: "Download",
        description: `Download do arquivo ${document.file_name} iniciado.`,
      })
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: "Erro",
        description: "Não foi possível fazer o download do documento.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Upload className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documentos Enviados</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os documentos enviados pelos candidatos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const typeBadge = getDocumentTypeBadge(doc.document_type)
            
            return (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg line-clamp-1">
                          {doc.file_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3" />
                          {doc.applications.profiles.full_name}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={typeBadge.variant}>
                      {typeBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">Candidato: </span>
                      <span className="font-medium">{doc.applications.profiles.email}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(doc)}
                        className="flex-1"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Em um ambiente real, abriria o documento para visualização
                          toast({
                            title: "Visualizar",
                            description: "Funcionalidade de visualização será implementada.",
                          })
                        }}
                        className="flex-1"
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        Visualizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {documents.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground">
                Quando os candidatos enviarem documentos, eles aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Uploads