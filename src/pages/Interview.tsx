import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, CheckCircle, Clock } from 'lucide-react';

interface InterviewForm {
  motivation: string;
  experience: string;
  expectations: string;
  availability: {
    days: string[];
    periods: string[];
  };
}

const Interview = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<InterviewForm>({
    motivation: '',
    experience: '',
    expectations: '',
    availability: {
      days: [],
      periods: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [stageStatus, setStageStatus] = useState('');

  const DAYS_OF_WEEK = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  const TIME_PERIODS = [
    { value: 'manha', label: 'Manhã (06:00 - 12:00)' },
    { value: 'tarde', label: 'Tarde (12:00 - 18:00)' },
    { value: 'noite', label: 'Noite (18:00 - 00:00)' },
    { value: 'madrugada', label: 'Madrugada (00:00 - 06:00)' }
  ];

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
              // Ensure backward compatibility with old format
              if (typeof savedForm.availability === 'string') {
                setForm({
                  ...savedForm,
                  availability: {
                    days: [],
                    periods: []
                  }
                });
              } else {
                setForm(savedForm);
              }
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

  const handleDayChange = (day: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        days: checked 
          ? [...prev.availability.days, day]
          : prev.availability.days.filter(d => d !== day)
      }
    }));
  };

  const handlePeriodChange = (period: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        periods: checked
          ? [...prev.availability.periods, period]
          : prev.availability.periods.filter(p => p !== period)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate availability selection
    if (form.availability.days.length === 0 || form.availability.periods.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, selecione pelo menos um dia da semana e um período de disponibilidade.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
        // Save form data to stage_progress - this goes to admin for review
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
          title: "Formulário enviado!",
          description: "Suas respostas foram enviadas para análise do administrador.",
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

              {/* Availability Section - Moved to the end */}
              <Card className="border-muted">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Disponibilidade de Horário</CardTitle>
                  </div>
                  <CardDescription>
                    Selecione os dias da semana e períodos em que você está disponível
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Days of the week */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Dias da Semana</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.value}
                            checked={form.availability.days.includes(day.value)}
                            onCheckedChange={(checked) => 
                              handleDayChange(day.value, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={day.value}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time periods */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Períodos do Dia</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {TIME_PERIODS.map((period) => (
                        <div key={period.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={period.value}
                            checked={form.availability.periods.includes(period.value)}
                            onCheckedChange={(checked) => 
                              handlePeriodChange(period.value, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={period.value}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {period.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {(form.availability.days.length > 0 || form.availability.periods.length > 0) && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-medium">Resumo da Disponibilidade:</Label>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {form.availability.days.length > 0 && (
                          <p>
                            <span className="font-medium">Dias:</span> {
                              form.availability.days
                                .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label)
                                .join(', ')
                            }
                          </p>
                        )}
                        {form.availability.periods.length > 0 && (
                          <p>
                            <span className="font-medium">Períodos:</span> {
                              form.availability.periods
                                .map(period => TIME_PERIODS.find(p => p.value === period)?.label)
                                .join(', ')
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Enviando..." : "Enviar Formulário para Análise"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Interview;