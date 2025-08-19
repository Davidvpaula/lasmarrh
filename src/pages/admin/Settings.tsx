import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Settings as SettingsIcon, Save, Plus, Trash2, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface TrainingVideo {
  id: string
  title: string
  description?: string
  video_url: string
  duration_minutes?: number
  order_index: number
  is_active: boolean
  created_at: string
}

const Settings = () => {
  const [videos, setVideos] = useState<TrainingVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<TrainingVideo | null>(null)
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: '',
    order_index: ''
  })
  const { toast } = useToast()

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('training_videos')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Error fetching videos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os vídeos de treinamento.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveVideo = async () => {
    if (!videoForm.title || !videoForm.video_url) {
      toast({
        title: "Erro",
        description: "Título e URL são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setSaveLoading(true)
    try {
      const videoData = {
        title: videoForm.title,
        description: videoForm.description || null,
        video_url: videoForm.video_url,
        duration_minutes: videoForm.duration_minutes ? parseInt(videoForm.duration_minutes) : null,
        order_index: videoForm.order_index ? parseInt(videoForm.order_index) : videos.length + 1,
        is_active: true
      }

      let error
      if (editingVideo) {
        const { error: updateError } = await supabase
          .from('training_videos')
          .update(videoData)
          .eq('id', editingVideo.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('training_videos')
          .insert(videoData)
        error = insertError
      }

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Vídeo ${editingVideo ? 'atualizado' : 'criado'} com sucesso.`,
      })

      setVideoForm({ title: '', description: '', video_url: '', duration_minutes: '', order_index: '' })
      setEditingVideo(null)
      setIsDialogOpen(false)
      fetchVideos()
    } catch (error) {
      console.error('Error saving video:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o vídeo.",
        variant: "destructive",
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const toggleVideoStatus = async (video: TrainingVideo) => {
    try {
      const { error } = await supabase
        .from('training_videos')
        .update({ is_active: !video.is_active })
        .eq('id', video.id)

      if (error) throw error

      toast({
        title: "Status atualizado",
        description: `Vídeo ${!video.is_active ? 'ativado' : 'desativado'} com sucesso.`,
      })

      fetchVideos()
    } catch (error) {
      console.error('Error updating video status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do vídeo.",
        variant: "destructive",
      })
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return

    try {
      const { error } = await supabase
        .from('training_videos')
        .delete()
        .eq('id', videoId)

      if (error) throw error

      toast({
        title: "Vídeo excluído",
        description: "O vídeo foi removido com sucesso.",
      })

      fetchVideos()
    } catch (error) {
      console.error('Error deleting video:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o vídeo.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (video: TrainingVideo) => {
    setEditingVideo(video)
    setVideoForm({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      duration_minutes: video.duration_minutes?.toString() || '',
      order_index: video.order_index.toString()
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingVideo(null)
    setVideoForm({ title: '', description: '', video_url: '', duration_minutes: '', order_index: '' })
    setIsDialogOpen(true)
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
              <p className="text-muted-foreground">
                Gerencie as configurações do sistema e vídeos de treinamento
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Vídeo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingVideo ? 'Editar Vídeo' : 'Novo Vídeo de Treinamento'}
                </DialogTitle>
                <DialogDescription>
                  {editingVideo ? 'Atualize' : 'Adicione'} as informações do vídeo de treinamento
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={videoForm.title}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do vídeo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={videoForm.duration_minutes}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      placeholder="Ex: 15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url">URL do Vídeo *</Label>
                  <Input
                    id="video_url"
                    value={videoForm.video_url}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={videoForm.description}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do conteúdo do vídeo"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_index">Ordem de Exibição</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={videoForm.order_index}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, order_index: e.target.value }))}
                    placeholder={`Ex: ${videos.length + 1}`}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={saveVideo} 
                    disabled={saveLoading}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saveLoading ? "Salvando..." : editingVideo ? "Atualizar" : "Criar Vídeo"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={saveLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vídeos de Treinamento</CardTitle>
            <CardDescription>
              Gerencie os vídeos que serão exibidos para os candidatos durante o treinamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{video.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        Ordem: {video.order_index}
                      </span>
                      {video.duration_minutes && (
                        <span className="text-sm text-muted-foreground">
                          {video.duration_minutes} min
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em: {new Date(video.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${video.id}`} className="text-sm">
                        {video.is_active ? 'Ativo' : 'Inativo'}
                      </Label>
                      <Switch
                        id={`active-${video.id}`}
                        checked={video.is_active}
                        onCheckedChange={() => toggleVideoStatus(video)}
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(video)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteVideo(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {videos.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum vídeo de treinamento cadastrado.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Novo Vídeo" para adicionar o primeiro vídeo.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Settings