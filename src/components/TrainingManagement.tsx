import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Play, Plus, Edit, Trash2, Upload, FileText } from 'lucide-react';

interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

const TrainingManagement = () => {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TrainingVideo | null>(null);
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 0,
    is_active: true
  });

  useEffect(() => {
    fetchVideos();
    fetchDocuments();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('training_videos')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os vídeos de treinamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'template')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const saveVideo = async () => {
    try {
      if (editingVideo) {
        // Update existing video
        const { error } = await supabase
          .from('training_videos')
          .update({
            title: videoData.title,
            description: videoData.description,
            video_url: videoData.video_url,
            duration_minutes: videoData.duration_minutes,
            is_active: videoData.is_active
          })
          .eq('id', editingVideo.id);

        if (error) throw error;
        
        toast({
          title: "Vídeo atualizado",
          description: "O vídeo de treinamento foi atualizado com sucesso.",
        });
      } else {
        // Create new video
        const maxOrderIndex = Math.max(...videos.map(v => v.order_index), 0);
        
        const { error } = await supabase
          .from('training_videos')
          .insert({
            title: videoData.title,
            description: videoData.description,
            video_url: videoData.video_url,
            duration_minutes: videoData.duration_minutes,
            is_active: videoData.is_active,
            order_index: maxOrderIndex + 1
          });

        if (error) throw error;
        
        toast({
          title: "Vídeo adicionado",
          description: "Novo vídeo de treinamento foi adicionado com sucesso.",
        });
      }

      fetchVideos();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o vídeo.",
        variant: "destructive",
      });
    }
  };

  const toggleVideoStatus = async (videoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('training_videos')
        .update({ is_active: isActive })
        .eq('id', videoId);

      if (error) throw error;
      
      toast({
        title: isActive ? "Vídeo ativado" : "Vídeo desativado",
        description: `O vídeo foi ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });
      
      fetchVideos();
    } catch (error) {
      console.error('Error toggling video status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do vídeo.",
        variant: "destructive",
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;

    try {
      const { error } = await supabase
        .from('training_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      
      toast({
        title: "Vídeo excluído",
        description: "O vídeo foi removido com sucesso.",
      });
      
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o vídeo.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setVideoData({
      title: '',
      description: '',
      video_url: '',
      duration_minutes: 0,
      is_active: true
    });
    setEditingVideo(null);
  };

  const openEditDialog = (video: TrainingVideo) => {
    setEditingVideo(video);
    setVideoData({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      duration_minutes: video.duration_minutes || 0,
      is_active: video.is_active
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestão de Treinamentos</CardTitle>
              <CardDescription>
                Configure vídeos e materiais de treinamento para os profissionais
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Vídeo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingVideo ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do vídeo de treinamento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título do Vídeo</Label>
                    <Input
                      id="title"
                      value={videoData.title}
                      onChange={(e) => setVideoData({...videoData, title: e.target.value})}
                      placeholder="Digite o título do vídeo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={videoData.description}
                      onChange={(e) => setVideoData({...videoData, description: e.target.value})}
                      placeholder="Descreva o conteúdo do vídeo"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="video_url">URL do Vídeo</Label>
                    <Input
                      id="video_url"
                      value={videoData.video_url}
                      onChange={(e) => setVideoData({...videoData, video_url: e.target.value})}
                      placeholder="https://... (YouTube, Vimeo, etc.)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={videoData.duration_minutes}
                      onChange={(e) => setVideoData({...videoData, duration_minutes: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={videoData.is_active}
                      onCheckedChange={(checked) => setVideoData({...videoData, is_active: checked})}
                    />
                    <Label htmlFor="is_active">Vídeo ativo</Label>
                  </div>
                  <Button onClick={saveVideo} className="w-full">
                    {editingVideo ? 'Atualizar Vídeo' : 'Adicionar Vídeo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle>Vídeos de Treinamento</CardTitle>
          <CardDescription>
            Gerencie os vídeos disponíveis para treinamento dos profissionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {videos.map((video, index) => (
              <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground">{video.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {video.duration_minutes} min
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Ordem: {video.order_index}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={video.is_active ? "secondary" : "outline"}>
                    {video.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Switch
                    checked={video.is_active}
                    onCheckedChange={(checked) => toggleVideoStatus(video.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(video)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteVideo(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {videos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum vídeo de treinamento encontrado</p>
                <p className="text-sm">Adicione vídeos para que os profissionais possam acessar os treinamentos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Templates */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Documentos para Assinatura</CardTitle>
              <CardDescription>
                Templates de documentos que os profissionais devem assinar
              </CardDescription>
            </div>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-secondary/10 rounded-full">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{doc.file_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Tipo: {doc.document_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento template encontrado</p>
                <p className="text-sm">Faça upload dos documentos que os profissionais devem assinar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingManagement;