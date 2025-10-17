import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, CheckCircle2, Clock, PlayCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TrainingVideo {
  id: string;
  title: string;
  duration_minutes: number;
  order_index: number;
}

interface TrainingProgress {
  video_id: string;
  watch_time_minutes: number;
  completed_at: string | null;
  started_at: string | null;
}

interface CandidateProgress {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  application_id: string;
  progress: TrainingProgress[];
  total_videos: number;
  completed_videos: number;
  in_progress_videos: number;
  not_started_videos: number;
}

export default function Training() {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [candidates, setCandidates] = useState<CandidateProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainingData();

    // Configurar realtime subscription para atualizações automáticas
    const progressChannel = supabase
      .channel('training-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_progress'
        },
        (payload) => {
          console.log('Training progress changed:', payload);
          fetchTrainingData(); // Recarregar dados quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
    };
  }, []);

  const fetchTrainingData = async () => {
    try {
      // Buscar vídeos de treinamento
      const { data: videosData, error: videosError } = await supabase
        .from('training_videos')
        .select('id, title, duration_minutes, order_index')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (videosError) throw videosError;

      setVideos(videosData || []);

      // Buscar todas as aplicações
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('id, doctor_id');

      if (applicationsError) throw applicationsError;

      // Buscar perfis dos doctors
      const doctorIds = applicationsData?.map(app => app.doctor_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', doctorIds);

      if (profilesError) throw profilesError;

      // Criar mapa de perfis para acesso rápido
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      // Buscar progresso de treinamento de todos os candidatos
      const { data: progressData, error: progressError } = await supabase
        .from('training_progress')
        .select('application_id, video_id, watch_time_minutes, completed_at, started_at');

      if (progressError) throw progressError;

      // Organizar dados por candidato
      const candidatesMap = new Map<string, CandidateProgress>();

      applicationsData?.forEach((app: any) => {
        const profile = profilesMap.get(app.doctor_id);
        if (!profile) return; // Pular se não encontrar perfil

        const candidateProgress = progressData?.filter(p => p.application_id === app.id) || [];
        
        const completedVideos = candidateProgress.filter(p => p.completed_at !== null).length;
        const inProgressVideos = candidateProgress.filter(p => p.started_at !== null && p.completed_at === null).length;
        const notStartedVideos = (videosData?.length || 0) - candidateProgress.length;

        candidatesMap.set(app.id, {
          candidate_id: app.doctor_id,
          candidate_name: profile.full_name || 'Nome não informado',
          candidate_email: profile.email || 'Email não informado',
          application_id: app.id,
          progress: candidateProgress,
          total_videos: videosData?.length || 0,
          completed_videos: completedVideos,
          in_progress_videos: inProgressVideos,
          not_started_videos: notStartedVideos
        });
      });

      setCandidates(Array.from(candidatesMap.values()));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de treinamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVideoProgress = (candidateProgress: TrainingProgress[], videoId: string, videoDuration: number) => {
    const progress = candidateProgress.find(p => p.video_id === videoId);
    
    if (!progress) {
      return { status: 'not_started', percentage: 0, watchTime: 0 };
    }
    
    if (progress.completed_at) {
      return { status: 'completed', percentage: 100, watchTime: videoDuration };
    }
    
    const percentage = Math.min(100, Math.round((progress.watch_time_minutes / videoDuration) * 100));
    return { 
      status: 'in_progress', 
      percentage, 
      watchTime: progress.watch_time_minutes 
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Concluído</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-600">Em Progresso</Badge>;
      default:
        return <Badge variant="secondary">Não Iniciado</Badge>;
    }
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
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Progresso de Treinamento dos Candidatos</h1>
      </div>

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum candidato encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {candidates.map((candidate) => {
            const overallProgress = candidate.total_videos > 0 
              ? Math.round((candidate.completed_videos / candidate.total_videos) * 100)
              : 0;

            return (
              <Card key={candidate.application_id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{candidate.candidate_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {candidate.candidate_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {overallProgress}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {candidate.completed_videos} de {candidate.total_videos} concluídos
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={overallProgress} className="h-2" />
                  </div>
                  <div className="flex gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{candidate.completed_videos} Concluídos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                      <span>{candidate.in_progress_videos} Em Progresso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.not_started_videos} Não Iniciados</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {videos.map((video) => {
                      const videoProgress = getVideoProgress(
                        candidate.progress, 
                        video.id, 
                        video.duration_minutes
                      );

                      return (
                        <div 
                          key={video.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {getStatusIcon(videoProgress.status)}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium truncate">{video.title}</h4>
                              {getStatusBadge(videoProgress.status)}
                            </div>
                            <Progress value={videoProgress.percentage} className="h-1.5 mb-2" />
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {videoProgress.watchTime} / {video.duration_minutes} min
                                </span>
                              </div>
                              <span>{videoProgress.percentage}% completo</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
