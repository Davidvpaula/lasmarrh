import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';

interface InterviewForm {
  motivation: string;
  experience: string;
  availability: string;
  expectations: string;
}

const Interview = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<InterviewForm>({
    motivation: '',
    experience: '',
    availability: '',
    expectations: ''
  });
  const [loading, setLoading] = useState(false);
  const [stageStatus, setStageStatus] = useState('');

  useEffect(() => {
    checkStageStatus();
  }, []);

  const checkStageStatus = async () => {
    try {
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
        const { data: stage } = await supabase
          .from('stage_progress')
          .select('status, notes')
          .eq('application_id', application.id)
          .eq('stage_number', 2)
          .single();

        if (stage) {
          setStageStatus(stage.status);
          if (stage.notes) {
            try {
              const savedForm = JSON.parse(stage.notes);
              setForm(savedForm);
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking stage status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
        await supabase
          .from('stage_progress')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            notes: JSON.stringify(form)
          })
          .eq('application_id', application.id)
          .eq('stage_number', 2);

        toast({
          title: "Formulário salvo!",
          description: "Suas respostas foram enviadas para análise.",
        });

        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o formulário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (stageStatus === 'completed' || stageStatus === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <Card className="border-success">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <CardTitle className="text-success">Entrevista Concluída</CardTitle>
                  <CardDescription>Você já completou esta etapa com sucesso.</CardDescription>
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
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Etapa 2: Entrevista</CardTitle>
                <CardDescription>
                  Preencha o formulário de entrevista para prosseguir no processo seletivo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="motivation">
                  Por que você tem interesse em trabalhar conosco?
                </Label>
                <Textarea
                  id="motivation"
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                  placeholder="Descreva sua motivação..."
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">
                  Fale sobre sua experiência profissional na área médica
                </Label>
                <Textarea
                  id="experience"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  placeholder="Descreva sua experiência..."
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">
                  Qual sua disponibilidade de horário?
                </Label>
                <Input
                  id="availability"
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  placeholder="Ex: Manhã, tarde, noite, finais de semana..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectations">
                  Quais são suas expectativas para esta oportunidade?
                </Label>
                <Textarea
                  id="expectations"
                  value={form.expectations}
                  onChange={(e) => setForm({ ...form, expectations: e.target.value })}
                  placeholder="Descreva suas expectativas..."
                  required
                  className="min-h-[100px]"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Salvando..." : "Enviar Formulário"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Interview;