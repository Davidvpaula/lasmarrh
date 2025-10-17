import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Play, CheckCircle, Clock, Award, FileSignature, ExternalLink, AlertTriangle, Youtube, X } from 'lucide-react';

interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
}

interface VideoProgress {
  video_id: string;
  started_at: string | null;
  completed_at: string | null;
  watch_time_minutes: number;
  watched_percentage?: number;
}

const ProfessionalTraining = () => {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [progress, setProgress] = useState<VideoProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageStatus, setStageStatus] = useState('in_progress');
  const [watchingVideo, setWatchingVideo] = useState<string | null>(null);
  const [confirmingSignature, setConfirmingSignature] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    fetchVideosAndProgress();
  }, []);

  const fetchVideosAndProgress = async () => {
    try {
      // Buscar vídeos ativos do banco
      const { data: videosData, error: videosError } = await supabase
        .from('training_videos')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (videosError) throw videosError;
      setVideos(videosData || []);

      // Buscar application_id do profissional
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: appData } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', user.id)
        .single();

      if (appData) {
        setApplicationId(appData.id);

        // Buscar progresso dos vídeos
        const { data: progressData, error: progressError } = await supabase
          .from('training_progress')
          .select('*')
          .eq('application_id', appData.id);

        if (progressError) throw progressError;
        
        setProgress((progressData || []).map(p => ({
          video_id: p.video_id,
          started_at: p.started_at,
          completed_at: p.completed_at,
          watch_time_minutes: p.watch_time_minutes || 0,
          watched_percentage: p.completed_at ? 100 : ((p.watch_time_minutes || 0) / (videosData?.find(v => v.id === p.video_id)?.duration_minutes || 1)) * 100
        })));

        // Buscar status da stage 4
        const { data: stageData } = await supabase
          .from('stage_progress')
          .select('status')
          .eq('application_id', appData.id)
          .eq('stage_number', 4)
          .single();

        if (stageData) {
          setStageStatus(stageData.status);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar vídeos de treinamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVideoProgress = (videoId: string) => {
    return progress.find(p => p.video_id === videoId);
  };

  const isVideoCompleted = (videoId: string) => {
    const videoProgress = getVideoProgress(videoId);
    return videoProgress?.completed_at !== null;
  };

  const isVideoStarted = (videoId: string) => {
    const videoProgress = getVideoProgress(videoId);
    return videoProgress?.started_at !== null;
  };

  const getVideoWatchedPercentage = (videoId: string) => {
    const videoProgress = getVideoProgress(videoId);
    const video = videos.find(v => v.id === videoId);
    if (!videoProgress || !video) return 0;
    
    if (videoProgress.watched_percentage) return videoProgress.watched_percentage;
    
    // Calcular baseado no tempo assistido
    return Math.min((videoProgress.watch_time_minutes / video.duration_minutes) * 100, 100);
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const simulateWatchProgress = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    let currentProgress = getVideoWatchedPercentage(videoId);
    
    // Simular progresso de visualização (incrementar 20% a cada 2 segundos)
    const interval = setInterval(() => {
      currentProgress += 20;
      
      const updatedProgress = progress.map(p => 
        p.video_id === videoId 
          ? { ...p, watched_percentage: Math.min(currentProgress, 100), watch_time_minutes: Math.floor((currentProgress / 100) * video.duration_minutes) }
          : p
      );
      
      // Se não existir progresso, criar um novo
      if (!progress.find(p => p.video_id === videoId)) {
        updatedProgress.push({
          video_id: videoId,
          started_at: new Date().toISOString(),
          completed_at: null,
          watch_time_minutes: Math.floor((currentProgress / 100) * video.duration_minutes),
          watched_percentage: Math.min(currentProgress, 100)
        });
      }
      
      setProgress(updatedProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        // Removido: não marcar automaticamente como concluído
        toast({
          title: "Vídeo assistido completamente!",
          description: "Você pode marcar como concluído quando quiser.",
        });
      }
    }, 2000); // A cada 2 segundos

    return interval;
  };

  const startVideo = async (videoId: string) => {
    if (!applicationId) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar sua aplicação",
        variant: "destructive"
      });
      return;
    }

    const existingProgress = getVideoProgress(videoId);
    
    if (!existingProgress) {
      // Criar novo progresso no banco
      try {
        const { error } = await supabase
          .from('training_progress')
          .insert({
            application_id: applicationId,
            video_id: videoId,
            started_at: new Date().toISOString(),
            watch_time_minutes: 0
          });

        if (error) throw error;

        // Novo progresso local
        const newProgress: VideoProgress = {
          video_id: videoId,
          started_at: new Date().toISOString(),
          completed_at: null,
          watch_time_minutes: 0,
          watched_percentage: 0
        };
        setProgress([...progress, newProgress]);
      } catch (error) {
        console.error('Erro ao iniciar vídeo:', error);
        toast({
          title: "Erro",
          description: "Falha ao registrar início do vídeo",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Iniciar simulação de progresso
    simulateWatchProgress(videoId);
    
    toast({
      title: "Vídeo iniciado",
      description: "Assista o vídeo e marque como concluído quando terminar.",
    });
  };

  const confirmSignVideo = async () => {
    if (!confirmingSignature || !applicationId) return;
    
    const video = videos.find(v => v.id === confirmingSignature);
    if (!video) return;

    try {
      // Verificar se já existe progresso
      const existingProgress = getVideoProgress(confirmingSignature);
      
      if (existingProgress) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('training_progress')
          .update({
            completed_at: new Date().toISOString(),
            watch_time_minutes: video.duration_minutes
          })
          .eq('application_id', applicationId)
          .eq('video_id', confirmingSignature);

        if (error) throw error;
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('training_progress')
          .insert({
            application_id: applicationId,
            video_id: confirmingSignature,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            watch_time_minutes: video.duration_minutes
          });

        if (error) throw error;
      }

      // Marcar como completo localmente
      const updatedProgress = progress.map(p => 
        p.video_id === confirmingSignature 
          ? { ...p, completed_at: new Date().toISOString(), watch_time_minutes: video.duration_minutes, watched_percentage: 100 }
          : p
      );
      
      // Se não existir progresso, criar um completo
      if (!progress.find(p => p.video_id === confirmingSignature)) {
        updatedProgress.push({
          video_id: confirmingSignature,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          watch_time_minutes: video.duration_minutes,
          watched_percentage: 100
        });
      }
      
      setProgress(updatedProgress);
      setConfirmingSignature(null);
      
      toast({
        title: "✅ Vídeo Assinado!",
        description: `"${video.title}" foi assinado com sucesso. Treinamento validado!`,
      });
    } catch (error) {
      console.error('Erro ao assinar vídeo:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar assinatura do vídeo",
        variant: "destructive"
      });
    }
  };

  const unsignVideo = async (videoId: string) => {
    if (!applicationId) return;
    
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    try {
      // Remover completed_at do banco
      const { error } = await supabase
        .from('training_progress')
        .update({
          completed_at: null
        })
        .eq('application_id', applicationId)
        .eq('video_id', videoId);

      if (error) throw error;

      // Atualizar localmente
      const updatedProgress = progress.map(p => 
        p.video_id === videoId 
          ? { ...p, completed_at: null }
          : p
      );
      
      setProgress(updatedProgress);
      
      toast({
        title: "Assinatura removida",
        description: `Você pode reassistir e assinar "${video.title}" novamente.`,
      });
    } catch (error) {
      console.error('Erro ao desmarcar vídeo:', error);
      toast({
        title: "Erro",
        description: "Falha ao desmarcar vídeo",
        variant: "destructive"
      });
    }
  };

  const calculateOverallProgress = () => {
    if (videos.length === 0) return 0;
    const completedCount = videos.filter(v => isVideoCompleted(v.id)).length;
    return (completedCount / videos.length) * 100;
  };

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard/professional';
  };

  if (stageStatus === 'completed') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" onClick={handleBackToDashboard} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <Card className="border-success">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-success" />
                <div>
                  <CardTitle className="text-success">🏆 Treinamento Concluído</CardTitle>
                  <CardDescription>
                    Parabéns! Você assinou todos os vídeos de treinamento obrigatórios e está qualificado!
                  </CardDescription>
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
        <Button variant="outline" onClick={handleBackToDashboard} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Play className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Etapa 4: Treinamento</CardTitle>
                  <CardDescription>
                    Assista aos vídeos e confirme que assistiu para validar seu treinamento
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Progresso Geral do Treinamento</span>
                  <span>{Math.round(calculateOverallProgress())}% concluído</span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {videos.filter(v => isVideoCompleted(v.id)).length} de {videos.length} vídeos assinados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Training Videos */}
          <div className="space-y-6">
            {videos.map((video) => {
              const videoProgress = getVideoProgress(video.id);
              const isCompleted = isVideoCompleted(video.id);
              const isStarted = isVideoStarted(video.id);
              const watchedPercentage = getVideoWatchedPercentage(video.id);
              const youtubeId = getYouTubeVideoId(video.video_url);
              return (
                <Card key={video.id} className={`${isCompleted ? 'border-success bg-success/5' : isStarted ? 'border-warning bg-warning/5' : ''} transition-all duration-300`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-success" />
                          ) : isStarted ? (
                            <Clock className="h-6 w-6 text-warning" />
                          ) : (
                            <Play className="h-6 w-6 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{video.title}</CardTitle>
                            <CardDescription>{video.description}</CardDescription>
                            
                            {/* Progresso Individual do Vídeo */}
                            {isStarted && !isCompleted && (
                              <div className="mt-3 space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span>Progresso de visualização</span>
                                  <span>{Math.round(watchedPercentage)}%</span>
                                </div>
                                <Progress value={watchedPercentage} className="h-1.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {video.duration_minutes} min
                        </Badge>
                        {isCompleted ? (
                          <Badge variant="secondary" className="bg-success text-success-foreground">
                            ✅ Concluído
                          </Badge>
                        ) : isStarted ? (
                          <Badge variant="secondary" className="bg-warning text-warning-foreground">
                            📺 Assistindo
                          </Badge>
                        ) : (
                          <Badge variant="outline">⏸️ Não Iniciado</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Embed YouTube Player quando assistindo */}
                      {watchingVideo === video.id && youtubeId && (
                        <div className="w-full">
                          <div className="relative w-full h-0 pb-[56.25%]">
                            <iframe
                              className="absolute top-0 left-0 w-full h-full rounded-lg"
                              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                              title={video.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => setWatchingVideo(null)}
                            className="mt-2"
                          >
                            Fechar Player
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Botão Assistir - sempre disponível */}
                        <Button
                          onClick={() => {
                            startVideo(video.id);
                            setWatchingVideo(video.id);
                          }}
                          variant={isStarted ? "outline" : "default"}
                          className="flex-shrink-0"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {isCompleted ? "Reassistir Vídeo" : isStarted ? "Continuar Assistindo" : "▶️ Assistir Vídeo"}
                        </Button>
                        
                        {!isCompleted ? (
                          /* Botão Marcar como Concluído */
                          <Dialog open={confirmingSignature === video.id} onOpenChange={(open) => !open && setConfirmingSignature(null)}>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => setConfirmingSignature(video.id)}
                                variant="default"
                                className="flex-shrink-0 bg-success hover:bg-success/90"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                ✅ Marcar como Concluído
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmar Conclusão do Treinamento</DialogTitle>
                                <DialogDescription>
                                  Você está prestes a marcar como concluído o vídeo:
                                  <strong className="block mt-2">"{video.title}"</strong>
                                </DialogDescription>
                              </DialogHeader>
                              
                              <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Ao confirmar, você declara ter assistido e compreendido o conteúdo apresentado.</strong>
                                  <br />
                                  Você poderá desmarcar e reassistir o vídeo a qualquer momento.
                                </AlertDescription>
                              </Alert>
                              
                              <div className="flex gap-3 pt-4">
                                <Button
                                  onClick={confirmSignVideo}
                                  className="bg-success hover:bg-success/90"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  ✅ Confirmar Conclusão
                                </Button>
                                <Button variant="outline" onClick={() => setConfirmingSignature(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          /* Botão Desmarcar - quando já está completo */
                          <Button
                            onClick={() => unsignVideo(video.id)}
                            variant="outline"
                            className="flex-shrink-0 border-warning text-warning hover:bg-warning/10"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Desmarcar Conclusão
                          </Button>
                        )}
                        
                        {/* Status de Completo */}
                        {isCompleted && videoProgress?.completed_at && (
                          <div className="flex items-center gap-2 bg-success/10 px-3 py-2 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-success">Concluído</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(videoProgress.completed_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Completion Button - appears when all videos are completed */}
          {videos.length > 0 && videos.every(v => isVideoCompleted(v.id)) && stageStatus !== 'completed' && (
            <Card className="border-success bg-gradient-to-r from-success/10 to-success/5">
              <CardContent className="py-8">
                <div className="text-center">
                  <Award className="h-16 w-16 mx-auto mb-4 text-success" />
                  <h3 className="text-2xl font-bold text-success mb-2">
                    Parabéns! Todos os vídeos foram assistidos
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Você completou todos os vídeos de treinamento obrigatórios. 
                    Clique no botão abaixo para finalizar seu treinamento.
                  </p>
                  <Button 
                    onClick={() => {
                      setStageStatus('completed');
                      toast({
                        title: "🎉 Treinamento Finalizado!",
                        description: "Você concluiu com sucesso toda a capacitação obrigatória.",
                      });
                    }}
                    size="lg"
                    className="bg-gradient-primary hover:bg-primary-hover text-white px-8 py-3"
                  >
                    <Award className="h-5 w-5 mr-2" />
                    Finalizar Treinamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {videos.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum vídeo de treinamento está disponível no momento.</p>
                  <p className="text-sm">Entre em contato com o administrador.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTraining;