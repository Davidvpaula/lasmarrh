import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, Clock, CheckCircle, XCircle, Users } from "lucide-react"

interface Application {
  id: string
  doctor_id: string
  status: string
  current_stage: number
  created_at: string
  profiles: {
    full_name: string
    email: string
    phone?: string
    crm?: string
  }
}

interface StageProgress {
  id: string
  stage_number: number
  status: string
  started_at?: string
  completed_at?: string
  notes?: string
  approved_by?: string
}

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([])
  const [notes, setNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles!applications_doctor_id_fkey (
            full_name,
            email,
            phone,
            crm
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as candidaturas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStageProgress = async (applicationId: string) => {
    try {
      const { data, error } = await supabase
        .from('stage_progress')
        .select('*')
        .eq('application_id', applicationId)
        .order('stage_number', { ascending: true })

      if (error) throw error
      setStageProgress(data || [])
    } catch (error) {
      console.error('Error fetching stage progress:', error)
    }
  }

  const updateStageStatus = async (stageId: string, status: string) => {
    setActionLoading(true)
    try {
      const updates: any = {
        status,
        notes: notes || null
      }

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('stage_progress')
        .update(updates)
        .eq('id', stageId)

      if (error) throw error

      toast({
        title: "Status atualizado",
        description: `Etapa ${status === 'completed' ? 'aprovada' : 'rejeitada'} com sucesso.`,
      })

      if (selectedApp) {
        await fetchStageProgress(selectedApp.id)
      }
      await fetchApplications()
      setNotes("")
    } catch (error) {
      console.error('Error updating stage status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da etapa.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'active': { label: 'Ativo', variant: 'default' as const },
      'completed': { label: 'Concluído', variant: 'secondary' as const },
      'rejected': { label: 'Rejeitado', variant: 'destructive' as const },
      'pending': { label: 'Pendente', variant: 'outline' as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const }
  }

  const getStageStatusBadge = (status: string) => {
    const statusMap = {
      'locked': { label: 'Bloqueada', variant: 'secondary' as const, icon: null },
      'available': { label: 'Disponível', variant: 'default' as const, icon: Clock },
      'in_progress': { label: 'Em Progresso', variant: 'default' as const, icon: Clock },
      'completed': { label: 'Concluída', variant: 'outline' as const, icon: CheckCircle },
      'rejected': { label: 'Rejeitada', variant: 'destructive' as const, icon: XCircle },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const, icon: null }
  }

  const getStageTitle = (stageNumber: number) => {
    const stages = {
      1: 'Cadastro',
      2: 'Entrevista',
      3: 'Documentação',
      4: 'Treinamento',
      5: 'Aprovação Final'
    }
    return stages[stageNumber as keyof typeof stages] || `Etapa ${stageNumber}`
  }

  useEffect(() => {
    fetchApplications()
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
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Candidaturas</h1>
            <p className="text-muted-foreground">
              Gerencie as candidaturas dos profissionais de saúde
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => {
            const statusBadge = getStatusBadge(app.status)
            return (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{app.profiles.full_name}</CardTitle>
                      <CardDescription>{app.profiles.email}</CardDescription>
                    </div>
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Etapa Atual:</span>
                      <span className="font-medium">{app.current_stage}/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>CRM:</span>
                      <span className="font-medium">{app.profiles.crm || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Criado em:</span>
                      <span className="font-medium">
                        {new Date(app.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={() => {
                          setSelectedApp(app)
                          fetchStageProgress(app.id)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Candidatura</DialogTitle>
                        <DialogDescription>
                          Gerencie o progresso e aprovações de {selectedApp?.profiles.full_name}
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="progress" className="w-full">
                        <TabsList>
                          <TabsTrigger value="progress">Progresso</TabsTrigger>
                          <TabsTrigger value="info">Informações</TabsTrigger>
                        </TabsList>

                        <TabsContent value="progress" className="space-y-4">
                          {stageProgress.map((stage) => {
                            const stageBadge = getStageStatusBadge(stage.status)
                            const IconComponent = stageBadge.icon

                            return (
                              <Card key={stage.id}>
                                <CardHeader>
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">
                                      {getStageTitle(stage.stage_number)}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                      {IconComponent && <IconComponent className="h-4 w-4" />}
                                      <Badge variant={stageBadge.variant}>
                                        {stageBadge.label}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  {stage.notes && (
                                    <div className="mb-4">
                                      <Label>Observações:</Label>
                                      <p className="text-sm text-muted-foreground mt-1">{stage.notes}</p>
                                    </div>
                                  )}

                                  {(stage.status === 'available' || stage.status === 'in_progress') && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="notes">Observações</Label>
                                        <Textarea
                                          id="notes"
                                          value={notes}
                                          onChange={(e) => setNotes(e.target.value)}
                                          placeholder="Adicione observações sobre esta etapa..."
                                          className="mt-1"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => updateStageStatus(stage.id, 'completed')}
                                          disabled={actionLoading}
                                          className="flex-1"
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Aprovar
                                        </Button>
                                        <Button
                                          onClick={() => updateStageStatus(stage.id, 'rejected')}
                                          disabled={actionLoading}
                                          variant="destructive"
                                          className="flex-1"
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Rejeitar
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex justify-between text-sm text-muted-foreground mt-4">
                                    {stage.started_at && (
                                      <span>Iniciado: {new Date(stage.started_at).toLocaleDateString('pt-BR')}</span>
                                    )}
                                    {stage.completed_at && (
                                      <span>Concluído: {new Date(stage.completed_at).toLocaleDateString('pt-BR')}</span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </TabsContent>

                        <TabsContent value="info" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Informações do Candidato</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Nome Completo</Label>
                                <p className="font-medium">{selectedApp?.profiles.full_name}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="font-medium">{selectedApp?.profiles.email}</p>
                              </div>
                              <div>
                                <Label>Telefone</Label>
                                <p className="font-medium">{selectedApp?.profiles.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <Label>CRM</Label>
                                <p className="font-medium">{selectedApp?.profiles.crm || 'N/A'}</p>
                              </div>
                              <div>
                                <Label>Status da Candidatura</Label>
                                <p className="font-medium capitalize">{selectedApp?.status}</p>
                              </div>
                              <div>
                                <Label>Data de Cadastro</Label>
                                <p className="font-medium">
                                  {selectedApp && new Date(selectedApp.created_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {applications.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma candidatura encontrada</h3>
              <p className="text-muted-foreground">
                Quando houver candidaturas, elas aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Applications