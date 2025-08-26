import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

// Mock data para desenvolvimento
const mockVideos: TrainingVideo[] = [
  {
    id: 'video-001',
    title: 'Introdução à Telemedicina',
    description: 'Conceitos básicos e regulamentações da telemedicina no Brasil',
    video_url: 'https://www.youtube.com/watch?v=example1',
    duration_minutes: 15,
    order_index: 1,
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'video-002',
    title: 'Segurança e Privacidade',
    description: 'Protocolos de segurança e proteção de dados do paciente',
    video_url: 'https://www.youtube.com/watch?v=example2',
    duration_minutes: 20,
    order_index: 2,
    is_active: true,
    created_at: '2024-01-01T11:00:00Z'
  },
  {
    id: 'video-003',
    title: 'Uso da Plataforma',
    description: 'Como utilizar as ferramentas da plataforma de telemedicina',
    video_url: 'https://www.youtube.com/watch?v=example3',
    duration_minutes: 25,
    order_index: 3,
    is_active: false,
    created_at: '2024-01-01T12:00:00Z'
  }
];

const TrainingManagementTab = () => {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(false);
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
    // Simulando carregamento para desenvolvimento
    setVideos(mockVideos);
  }, []);

  const saveVideo = async () => {
    try {
      if (editingVideo) {
        // Update existing video (mock)
        const updatedVideos = videos.map(v => 
          v.id === editingVideo.id 
            ? { ...v, ...videoData }
            : v
        );
        setVideos(updatedVideos);
        
        toast({
          title: "Vídeo atualizado (DEMO)",
          description: "Em desenvolvimento - mudanças não são persistidas.",
        });
      } else {
        // Create new video (mock)
        const newVideo: TrainingVideo = {
          id: `video-${Date.now()}`,
          ...videoData,
          order_index: videos.length + 1,
          created_at: new Date().toISOString()
        };
        setVideos([...videos, newVideo]);
        
        toast({
          title: "Vídeo adicionado (DEMO)",
          description: "Em desenvolvimento - mudanças não são persistidas.",
        });
      }

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
    const updatedVideos = videos.map(v => 
      v.id === videoId ? { ...v, is_active: isActive } : v
    );
    setVideos(updatedVideos);
    
    toast({
      title: isActive ? "Vídeo ativado (DEMO)" : "Vídeo desativado (DEMO)",
      description: "Em desenvolvimento - mudanças não são persistidas.",
    });
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;

    const updatedVideos = videos.filter(v => v.id !== videoId);
    setVideos(updatedVideos);
    
    toast({
      title: "Vídeo excluído (DEMO)",
      description: "Em desenvolvimento - mudanças não são persistidas.",
    });
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
                    <Label htmlFor="video_url">URL do Vídeo (YouTube)</Label>
                    <Input
                      id="video_url"
                      value={videoData.video_url}
                      onChange={(e) => setVideoData({...videoData, video_url: e.target.value})}
                      placeholder="https://www.youtube.com/watch?v=..."
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
            {videos.map((video) => (
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
                      <a 
                        href={video.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Ver vídeo
                      </a>
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
    </div>
  );
};

export default TrainingManagementTab;