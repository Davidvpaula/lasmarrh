import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, CheckCircle, Clock, ChevronDown, X } from 'lucide-react';

interface InterviewForm {
  motivation: string;
  experience: string;
  expectations: string;
  availability: {
    [day: string]: string[]; // Each day maps to an array of selected time slots
  };
}

const Interview = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const [form, setForm] = useState<InterviewForm>({
    motivation: '',
    experience: '',
    expectations: '',
    availability: {}
  });
  const [loading, setLoading] = useState(false);
  const [stageStatus, setStageStatus] = useState('');
  const [openPopovers, setOpenPopovers] = useState<Set<string>>(new Set());

  const DAYS_OF_WEEK = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  const TIME_SLOTS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  useEffect(() => {
    isMountedRef.current = true;
    checkStageStatus();
    
    return () => {
      isMountedRef.current = false;
    };
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
              if (savedForm.availability && (savedForm.availability.days || savedForm.availability.periods)) {
                setForm({
                  ...savedForm,
                  availability: {}
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

  const handleTimeSlotChange = useCallback((day: string, timeSlot: string, checked: boolean) => {
    if (!isMountedRef.current) return;
    
    setForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: checked
          ? [...(prev.availability[day] || []), timeSlot]
          : (prev.availability[day] || []).filter(slot => slot !== timeSlot)
      }
    }));
  }, []);

  const removeTimeSlot = useCallback((day: string, timeSlot: string) => {
    if (!isMountedRef.current) return;
    
    setForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: (prev.availability[day] || []).filter(slot => slot !== timeSlot)
      }
    }));
  }, []);

  const togglePopover = useCallback((dayValue: string, isOpen: boolean) => {
    if (!isMountedRef.current) return;
    
    setOpenPopovers(prev => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(dayValue);
      } else {
        newSet.delete(dayValue);
      }
      return newSet;
    });
  }, []);

  const hasAnyAvailability = () => {
    return Object.values(form.availability).some(slots => slots && slots.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate availability selection
    if (!hasAnyAvailability()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, selecione pelo menos um horário de disponibilidade.",
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
                  {/* Days of the week with time selection */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Selecione os dias e horários disponíveis</Label>
                    <div className="space-y-3">
                       {DAYS_OF_WEEK.map((day) => (
                         <div key={`day-${day.value}`} className="border rounded-lg p-4">
                           <div className="flex items-center justify-between mb-3">
                             <Label className="text-sm font-medium">{day.label}</Label>
                             <Popover 
                               open={openPopovers.has(day.value)}
                               onOpenChange={(open) => togglePopover(day.value, open)}
                             >
                               <PopoverTrigger asChild>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   className="h-8 px-3"
                                   type="button"
                                 >
                                   Selecionar Horários
                                   <ChevronDown className="ml-2 h-3 w-3" />
                                 </Button>
                               </PopoverTrigger>
                               <PopoverContent 
                                 className="w-80 bg-background border shadow-lg z-50"
                                 side="bottom"
                                 align="end"
                                 sideOffset={5}
                               >
                                 <div className="space-y-3">
                                   <Label className="text-sm font-medium">
                                     Horários disponíveis - {day.label}
                                   </Label>
                                   <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                     {TIME_SLOTS.map((timeSlot) => (
                                       <div key={`${day.value}-${timeSlot}`} className="flex items-center space-x-2">
                                         <Checkbox
                                           id={`checkbox-${day.value}-${timeSlot}`}
                                           checked={form.availability[day.value]?.includes(timeSlot) || false}
                                           onCheckedChange={(checked) =>
                                             handleTimeSlotChange(day.value, timeSlot, checked as boolean)
                                           }
                                         />
                                         <Label
                                           htmlFor={`checkbox-${day.value}-${timeSlot}`}
                                           className="text-xs cursor-pointer"
                                         >
                                           {timeSlot}
                                         </Label>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               </PopoverContent>
                             </Popover>
                           </div>
                          
                           {/* Display selected times for this day */}
                           {form.availability[day.value] && form.availability[day.value].length > 0 && (
                             <div className="flex flex-wrap gap-1 mt-2">
                               {form.availability[day.value].map((timeSlot, index) => (
                                 <Badge
                                   key={`badge-${day.value}-${timeSlot}-${index}`}
                                   variant="secondary"
                                   className="text-xs px-2 py-1 bg-primary/10 text-primary"
                                 >
                                   {timeSlot}
                                   <Button
                                     type="button"
                                     variant="ghost"
                                     size="sm"
                                     className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                                     onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       removeTimeSlot(day.value, timeSlot);
                                     }}
                                   >
                                     <X className="h-3 w-3 hover:text-destructive" />
                                   </Button>
                                 </Badge>
                               ))}
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {hasAnyAvailability() && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-medium">Resumo da Disponibilidade:</Label>
                      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {Object.entries(form.availability).map(([dayValue, timeSlots]) => {
                          if (!timeSlots || timeSlots.length === 0) return null;
                          const dayLabel = DAYS_OF_WEEK.find(d => d.value === dayValue)?.label;
                          return (
                            <p key={dayValue}>
                              <span className="font-medium">{dayLabel}:</span> {timeSlots.join(', ')}
                            </p>
                          );
                        })}
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