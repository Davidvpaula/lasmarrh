import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Play, CheckCircle, Clock, Award } from 'lucide-react';

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
  completed_at: string | null;
  watch_time_minutes: number;
}

const Training = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [progress, setProgress] = useState<VideoProgress[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageStatus, setStageStatus] = useState('');
  const [applicationId, setApplicationId] = useState<string>('');

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      // Get application
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
        setApplicationId(application.id);

        // Check stage status
        const { data: stage } = await supabase
          .from('stage_progress')
          .select('status')
          .eq('application_id', application.id)
          .eq('stage_number', 4)
          .single();

        if (stage) {
          setStageStatus(stage.status);
          
          // Check if user has admin approval to access this stage
          if (stage.status === 'locked') {
            toast({
              title: "Acesso Bloqueado",
              description: "Aguardando liberação do administrador para continuar esta etapa.",
              variant: "destructive",
            });
            setTimeout(() => navigate('/interview'), 2000);
            return;
          }
        }

        // Load videos
        const { data: videosData } = await supabase
          .from('training_videos')
          .select('*')
          .eq('is_active', true)
          .order('order_index');

        if (videosData) {
          setVideos(videosData);
        }

        // Load progress
        const { data: progressData } = await supabase
          .from('training_progress')
          .select('*')
          .eq('application_id', application.id);

        if (progressData) {
          setProgress(progressData);
        }
      }
    } catch (error) {
      console.error('Error loading training data:', error);
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
    return !!videoProgress;
  };

  const startVideo = async (videoId: string) => {
    if (!applicationId) return;

    try {
      const existingProgress = getVideoProgress(videoId);
      
      if (!existingProgress) {
        await supabase
          .from('training_progress')
          .insert({
            application_id: applicationId,
            video_id: videoId,
            started_at: new Date().toISOString(),
            watch_time_minutes: 0
          });
      } else if (!existingProgress.started_at) {
        await supabase
          .from('training_progress')
          .update({
            started_at: new Date().toISOString()
          })
          .eq('application_id', applicationId)
          .eq('video_id', videoId);
      }

      setCurrentVideo(videoId);
      await loadTrainingData();
    } catch (error) {
      console.error('Error starting video:', error);
    }
  };

  const completeVideo = async (videoId: string) => {
    if (!applicationId) return;

    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      await supabase
        .from('training_progress')
        .update({
          completed_at: new Date().toISOString(),
          watch_time_minutes: video.duration_minutes
        })
        .eq('application_id', applicationId)
        .eq('video_id', videoId);

      await loadTrainingData();

      toast({
        title: "Vídeo Concluído!",
        description: `"${video.title}" foi marcado como assistido.`,
      });
    } catch (error) {
      console.error('Error completing video:', error);
    }
  };

  const calculateOverallProgress = () => {
    if (videos.length === 0) return 0;
    const completedCount = videos.filter(v => isVideoCompleted(v.id)).length;
    return (completedCount / videos.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (stageStatus === 'locked') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-warning">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-warning" />
                <div>
                  <CardTitle className="text-warning">Acesso Restrito</CardTitle>
                  <CardDescription>
                    Falta a liberação do administrador para continuar essa etapa.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Você será redirecionado para a página de entrevista. Aguarde a aprovação do administrador para prosseguir.
              </p>
              <Button onClick={() => navigate('/interview')} className="w-full">
                Voltar para Entrevista
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (stageStatus === 'completed' || stageStatus === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate('/dashboard/professional')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Painel Profissional
          </Button>

          <Card className="border-success">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-success" />
                <div>
                  <CardTitle className="text-success">Treinamento Concluído</CardTitle>
                  <CardDescription>
                    Parabéns! Você completou todos os vídeos de treinamento obrigatórios.
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
        <Button variant="outline" onClick={() => navigate('/dashboard/professional')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Painel Profissional
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
                    Assista aos vídeos obrigatórios para completar sua capacitação
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
                  {videos.filter(v => isVideoCompleted(v.id)).length} de {videos.length} vídeos concluídos
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
                            Concluído
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
                            {isStarted ? "Continuar Assistindo" : "Iniciar Vídeo"}
                          </Button>
                          {isStarted && (
                            <Button
                              onClick={() => completeVideo(video.id)}
                              variant="secondary"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Concluído
                            </Button>
                          )}
                        </>
                      )}
                      {isCompleted && videoProgress?.completed_at && (
                        <p className="text-sm text-muted-foreground">
                          Concluído em {new Date(videoProgress.completed_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Completion Button - appears when all videos are completed */}
          {videos.length > 0 && videos.every(v => isVideoCompleted(v.id)) && (
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
                    onClick={async () => {
                      try {
                        await supabase
                          .from('stage_progress')
                          .update({
                            status: 'completed',
                            completed_at: new Date().toISOString()
                          })
                          .eq('application_id', applicationId)
                          .eq('stage_number', 4);

                        toast({
                          title: "🎉 Treinamento Finalizado!",
                          description: "Você concluiu com sucesso toda a capacitação obrigatória.",
                        });
                        
                        setTimeout(() => navigate('/dashboard'), 2000);
                      } catch (error) {
                        console.error('Error completing training:', error);
                        toast({
                          title: "Erro",
                          description: "Erro ao finalizar treinamento. Tente novamente.",
                          variant: "destructive"
                        });
                      }
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

export default Training;