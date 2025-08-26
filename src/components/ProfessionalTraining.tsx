import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Play, CheckCircle, Clock, Award, FileSignature, ExternalLink, AlertTriangle, Youtube } from 'lucide-react';

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

// Mock data para desenvolvimento
const mockVideos: TrainingVideo[] = [
  {
    id: 'video-001',
    title: 'Introdução à Telemedicina',
    description: 'Conceitos básicos e regulamentações da telemedicina no Brasil',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_minutes: 15,
    order_index: 1
  },
  {
    id: 'video-002',
    title: 'Segurança e Privacidade',
    description: 'Protocolos de segurança e proteção de dados do paciente',
    video_url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    duration_minutes: 20,
    order_index: 2
  },
  {
    id: 'video-003',
    title: 'Uso da Plataforma',
    description: 'Como utilizar as ferramentas da plataforma de telemedicina',
    video_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    duration_minutes: 25,
    order_index: 3
  }
];

const ProfessionalTraining = () => {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [progress, setProgress] = useState<VideoProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [stageStatus, setStageStatus] = useState('in_progress');
  const [watchingVideo, setWatchingVideo] = useState<string | null>(null);
  const [confirmingSignature, setConfirmingSignature] = useState<string | null>(null);

  useEffect(() => {
    // Simulando carregamento para desenvolvimento
    setVideos(mockVideos);
    setProgress([
      {
        video_id: 'video-001',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:15:00Z',
        watch_time_minutes: 15,
        watched_percentage: 100
      },
      {
        video_id: 'video-002',
        started_at: '2024-01-16T09:00:00Z',
        completed_at: null,
        watch_time_minutes: 10,
        watched_percentage: 50
      }
    ]);
  }, []);

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

  const canSignVideo = (videoId: string) => {
    const watchedPercentage = getVideoWatchedPercentage(videoId);
    return watchedPercentage >= 80; // Precisa assistir pelo menos 80% do vídeo
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
        toast({
          title: "Vídeo assistido completamente!",
          description: "Agora você pode assinar para validar seu treinamento.",
        });
      }
    }, 2000); // A cada 2 segundos

    return interval;
  };

  const startVideo = async (videoId: string) => {
    const existingProgress = getVideoProgress(videoId);
    
    if (!existingProgress) {
      // Novo progresso
      const newProgress: VideoProgress = {
        video_id: videoId,
        started_at: new Date().toISOString(),
        completed_at: null,
        watch_time_minutes: 0,
        watched_percentage: 0
      };
      setProgress([...progress, newProgress]);
    }
    
    // Iniciar simulação de progresso
    simulateWatchProgress(videoId);
    
    toast({
      title: "Vídeo iniciado",
      description: "Acompanhe o progresso de visualização. Você poderá assinar após assistir pelo menos 80%.",
    });
  };

  const confirmSignVideo = async () => {
    if (!confirmingSignature) return;
    
    const video = videos.find(v => v.id === confirmingSignature);
    if (!video) return;

    if (!canSignVideo(confirmingSignature)) {
      toast({
        title: "Não é possível assinar ainda",
        description: "Você precisa assistir pelo menos 80% do vídeo antes de assinar.",
        variant: "destructive"
      });
      return;
    }

    // Marcar como completo
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
    
    // Verificar se todos os vídeos foram assinados
    const allCompleted = videos.every(v => {
      const prog = updatedProgress.find(p => p.video_id === v.id);
      return prog?.completed_at || v.id === confirmingSignature;
    });

    if (allCompleted) {
      setStageStatus('completed');
      toast({
        title: "🎉 Treinamento Concluído!",
        description: "Parabéns! Você assinou todos os vídeos obrigatórios e está qualificado!",
      });
    } else {
      toast({
        title: "✅ Vídeo Assinado!",
        description: `"${video.title}" foi assinado com sucesso. Treinamento validado!`,
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
              const canSign = canSignVideo(video.id);
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
                                {watchedPercentage < 80 && (
                                  <p className="text-xs text-muted-foreground">
                                    Assista pelo menos 80% para poder assinar
                                  </p>
                                )}
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
                            ✅ Assinado
                          </Badge>
                        ) : isStarted ? (
                          <Badge variant="secondary" className="bg-warning text-warning-foreground">
                            📺 Assistindo ({Math.round(watchedPercentage)}%)
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
                        {!isCompleted && (
                          <>
                            {/* Botão Assistir */}
                            <Button
                              onClick={() => {
                                startVideo(video.id);
                                setWatchingVideo(video.id);
                              }}
                              variant={isStarted ? "outline" : "default"}
                              className="flex-shrink-0"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {isStarted ? "Continuar Assistindo" : "▶️ Assistir Vídeo"}
                            </Button>
                            
                            {/* Botão YouTube Externo */}
                            <a 
                              href={video.video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button variant="secondary" className="flex-shrink-0">
                                <Youtube className="h-4 w-4 mr-2" />
                                Abrir no YouTube
                              </Button>
                            </a>
                            
                            {/* Botão Assinar com Dialog de Confirmação */}
                            <Dialog open={confirmingSignature === video.id} onOpenChange={(open) => !open && setConfirmingSignature(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => setConfirmingSignature(video.id)}
                                  variant="default"
                                  className={`flex-shrink-0 ${canSign 
                                    ? 'bg-gradient-primary hover:bg-primary-hover' 
                                    : 'opacity-50 cursor-not-allowed'
                                  }`}
                                  disabled={!canSign}
                                >
                                  <FileSignature className="h-4 w-4 mr-2" />
                                  ✋ Confirmar que Assisti
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmar Assinatura do Treinamento</DialogTitle>
                                  <DialogDescription>
                                    Você está prestes a assinar que assistiu completamente ao vídeo:
                                    <strong className="block mt-2">"{video.title}"</strong>
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {canSign ? (
                                  <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      ✅ Você assistiu {Math.round(watchedPercentage)}% do vídeo e pode assinar seu treinamento.
                                      <br />
                                      <strong>Ao confirmar, você declara ter compreendido o conteúdo apresentado.</strong>
                                    </AlertDescription>
                                  </Alert>
                                ) : (
                                  <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      ⚠️ Você precisa assistir pelo menos 80% do vídeo antes de assinar.
                                      <br />
                                      Progresso atual: {Math.round(watchedPercentage)}%
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                <div className="flex gap-3 pt-4">
                                  <Button
                                    onClick={confirmSignVideo}
                                    disabled={!canSign}
                                    className={canSign ? "bg-success hover:bg-success/90" : ""}
                                  >
                                    <FileSignature className="h-4 w-4 mr-2" />
                                    {canSign ? "✅ Confirmar Assinatura" : "Assistir mais para assinar"}
                                  </Button>
                                  <Button variant="outline" onClick={() => setConfirmingSignature(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        
                        {/* Status de Completo */}
                        {isCompleted && videoProgress?.completed_at && (
                          <div className="flex items-center gap-4 w-full bg-success/10 p-4 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-success">Treinamento Validado!</p>
                              <p className="text-xs text-muted-foreground">
                                Assinado em {new Date(videoProgress.completed_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-success text-success-foreground">
                              🏆 Certificado
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

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