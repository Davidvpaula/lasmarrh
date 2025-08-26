import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Play, CheckCircle, Clock, Award, FileSignature } from 'lucide-react';

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
}

// Mock data para desenvolvimento
const mockVideos: TrainingVideo[] = [
  {
    id: 'video-001',
    title: 'Introdução à Telemedicina',
    description: 'Conceitos básicos e regulamentações da telemedicina no Brasil',
    video_url: 'https://www.youtube.com/watch?v=example1',
    duration_minutes: 15,
    order_index: 1
  },
  {
    id: 'video-002',
    title: 'Segurança e Privacidade',
    description: 'Protocolos de segurança e proteção de dados do paciente',
    video_url: 'https://www.youtube.com/watch?v=example2',
    duration_minutes: 20,
    order_index: 2
  },
  {
    id: 'video-003',
    title: 'Uso da Plataforma',
    description: 'Como utilizar as ferramentas da plataforma de telemedicina',
    video_url: 'https://www.youtube.com/watch?v=example3',
    duration_minutes: 25,
    order_index: 3
  }
];

const ProfessionalTraining = () => {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [progress, setProgress] = useState<VideoProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [stageStatus, setStageStatus] = useState('in_progress');

  useEffect(() => {
    // Simulando carregamento para desenvolvimento
    setVideos(mockVideos);
    setProgress([
      {
        video_id: 'video-001',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:15:00Z',
        watch_time_minutes: 15
      },
      {
        video_id: 'video-002',
        started_at: '2024-01-16T09:00:00Z',
        completed_at: null,
        watch_time_minutes: 10
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

  const startVideo = async (videoId: string) => {
    const existingProgress = getVideoProgress(videoId);
    
    if (!existingProgress) {
      // Novo progresso
      const newProgress: VideoProgress = {
        video_id: videoId,
        started_at: new Date().toISOString(),
        completed_at: null,
        watch_time_minutes: 0
      };
      setProgress([...progress, newProgress]);
    }
    
    toast({
      title: "Vídeo iniciado",
      description: "Você pode assistir ao vídeo e depois assiná-lo.",
    });
  };

  const signVideo = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    // Marcar como completo
    const updatedProgress = progress.map(p => 
      p.video_id === videoId 
        ? { ...p, completed_at: new Date().toISOString(), watch_time_minutes: video.duration_minutes }
        : p
    );
    
    // Se não existir progresso, criar um completo
    if (!progress.find(p => p.video_id === videoId)) {
      updatedProgress.push({
        video_id: videoId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        watch_time_minutes: video.duration_minutes
      });
    }
    
    setProgress(updatedProgress);
    
    // Verificar se todos os vídeos foram assinados
    const allCompleted = videos.every(v => {
      const prog = updatedProgress.find(p => p.video_id === v.id);
      return prog?.completed_at || v.id === videoId;
    });

    if (allCompleted) {
      setStageStatus('completed');
      toast({
        title: "Treinamento Concluído!",
        description: "Você assinou todos os vídeos obrigatórios!",
      });
    } else {
      toast({
        title: "Vídeo Assinado!",
        description: `"${video.title}" foi assinado com sucesso.`,
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
                  <CardTitle className="text-success">Treinamento Concluído</CardTitle>
                  <CardDescription>
                    Parabéns! Você assinou todos os vídeos de treinamento obrigatórios.
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
                    Assista aos vídeos e assine para validar seu treinamento
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
          <div className="space-y-4">
            {videos.map((video) => {
              const videoProgress = getVideoProgress(video.id);
              const isCompleted = isVideoCompleted(video.id);
              const isStarted = isVideoStarted(video.id);

              return (
                <Card key={video.id} className={isCompleted ? 'border-success' : ''}>
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {video.duration_minutes} min
                        </Badge>
                        {isCompleted ? (
                          <Badge variant="secondary" className="bg-success text-success-foreground">
                            Assinado
                          </Badge>
                        ) : isStarted ? (
                          <Badge variant="secondary" className="bg-warning text-warning-foreground">
                            Em Andamento
                          </Badge>
                        ) : (
                          <Badge variant="outline">Não Iniciado</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {!isCompleted && (
                        <>
                          <Button
                            onClick={() => startVideo(video.id)}
                            variant={isStarted ? "outline" : "default"}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {isStarted ? "Continuar Assistindo" : "Assistir Vídeo"}
                          </Button>
                          
                          <a 
                            href={video.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button variant="secondary">
                              Ver no YouTube
                            </Button>
                          </a>
                          
                          <Button
                            onClick={() => signVideo(video.id)}
                            variant="default"
                            className="bg-gradient-primary hover:bg-primary-hover"
                          >
                            <FileSignature className="h-4 w-4 mr-2" />
                            Assinar Treinamento
                          </Button>
                        </>
                      )}
                      {isCompleted && videoProgress?.completed_at && (
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-muted-foreground">
                            Assinado em {new Date(videoProgress.completed_at).toLocaleString('pt-BR')}
                          </p>
                          <Badge variant="secondary" className="bg-success text-success-foreground">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Validado
                          </Badge>
                        </div>
                      )}
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