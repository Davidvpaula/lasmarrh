import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GraduationCap, Plus, Edit, Trash2, Play, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export default function Training() {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<TrainingVideo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 0,
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    fetchVideos();

    // Configurar real-time para atualizações automáticas
    const channel = supabase
      .channel('training-videos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_videos' },
        () => fetchVideos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('training_videos')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar vídeos de treinamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('training_videos')
          .update(formData)
          .eq('id', editingVideo.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Vídeo atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('training_videos')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Vídeo criado com sucesso",
        });
      }

      resetForm();
      fetchVideos();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar vídeo",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;

    try {
      const { error } = await supabase
        .from('training_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vídeo excluído com sucesso",
      });

      fetchVideos();
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir vídeo",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (videoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('training_videos')
        .update({ is_active: !isActive })
        .eq('id', videoId);

      if (error) throw error;

      fetchVideos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do vídeo",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      duration_minutes: 0,
      order_index: videos.length,
      is_active: true
    });
    setEditingVideo(null);
  };

  const startEdit = (video: TrainingVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      duration_minutes: video.duration_minutes || 0,
      order_index: video.order_index,
      is_active: video.is_active
    });
    setIsCreateDialogOpen(true);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gerenciamento de Treinamento</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Vídeo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_url">URL do Vídeo</Label>
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Ordem</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Vídeo ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVideo ? 'Atualizar' : 'Criar'} Vídeo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {videos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum vídeo de treinamento cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          videos.map((video) => (
            <Card key={video.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Play className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      {video.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={video.is_active}
                      onCheckedChange={() => handleToggleActive(video.id, video.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(video)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {video.duration_minutes} min
                  </div>
                  <div>Ordem: {video.order_index}</div>
                  <div>Status: {video.is_active ? 'Ativo' : 'Inativo'}</div>
                </div>
                <div className="mt-2">
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {video.video_url}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}