import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, CheckCircle, Clock, ChevronDown, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';

interface InterviewField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: { options: string[] };
  is_required: boolean;
  placeholder?: string;
  help_text?: string;
  order_index: number;
}

// Schema de validação dinâmica será criada baseado nos campos
const createDynamicSchema = (fields: InterviewField[]) => {
  const schemaFields: any = {};
  
  fields.forEach(field => {
    if (field.is_required) {
      if (field.field_type === 'textarea' || field.field_type === 'text') {
        schemaFields[field.field_name] = z.string().trim().min(1, `${field.field_label} é obrigatório`);
      } else if (field.field_type === 'email') {
        schemaFields[field.field_name] = z.string().email('E-mail inválido');
      } else if (field.field_type === 'phone') {
        schemaFields[field.field_name] = z.string().regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$|^\d{10,11}$/, 'Telefone inválido');
      } else {
        schemaFields[field.field_name] = z.string().min(1, `${field.field_label} é obrigatório`);
      }
    } else {
      schemaFields[field.field_name] = z.string().optional();
    }
  });
  
  // Availability permanece obrigatório
  schemaFields.availability = z.record(z.string(), z.array(z.string())).refine(
    (data) => {
      const allSlots = Object.values(data).flat();
      return allSlots.length > 0;
    },
    { message: 'Selecione pelo menos um horário de disponibilidade' }
  );
  
  return z.object(schemaFields);
};

interface InterviewForm {
  [key: string]: any;
  availability: {
    [day: string]: string[];
  };
}

const Interview = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const [form, setForm] = useState<InterviewForm>({
    availability: {}
  });
  const [loading, setLoading] = useState(false);
  const [stageStatus, setStageStatus] = useState('');
  const [openPopovers, setOpenPopovers] = useState<Set<string>>(new Set());
  const [interviewFields, setInterviewFields] = useState<InterviewField[]>([]);

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
    fetchInterviewFields();
    checkStageStatus();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchInterviewFields = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_fields')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;

      const fields = (data || []).map(field => ({
        ...field,
        field_options: field.field_options as any
      })) as InterviewField[];

      setInterviewFields(fields);
      
      // Inicializar form com campos vazios
      const initialForm: InterviewForm = { availability: {} };
      fields?.forEach(field => {
        initialForm[field.field_name] = '';
      });
      setForm(prev => ({ ...prev, ...initialForm }));
    } catch (error) {
      console.error('Erro ao carregar campos da entrevista:', error);
    }
  };

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
              const savedForm = JSON.parse(String(stage.notes));
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

    // Criar schema dinâmico baseado nos campos
    const dynamicSchema = createDynamicSchema(interviewFields);
    
    // Validar com Zod
    const validationResult = dynamicSchema.safeParse(form);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError = Object.entries(errors)[0];
      if (firstError) {
        toast({
          title: "Erro de validação",
          description: firstError[1]?.[0] || 'Por favor, revise os campos do formulário',
          variant: "destructive",
        });
      }
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
        // Save validated form data to stage_progress
        const { error: updateError } = await supabase
          .from('stage_progress')
          .update({
            status: 'in_progress',
            notes: JSON.stringify(validationResult.data)
          })
          .eq('application_id', application.id)
          .eq('stage_number', 2);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Obrigado por querer fazer parte da nossa equipe!",
          description: "Em breve entraremos em contato com você.",
        });

        navigate('/dashboard/professional');
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
          <Button variant="outline" onClick={() => navigate('/dashboard/professional')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Painel Profissional
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
        <Button variant="outline" onClick={() => navigate('/dashboard/professional')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Painel Profissional
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
              {/* Campos Dinâmicos da Entrevista */}
              {interviewFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.field_name}>
                    {field.field_label}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  
                  {field.field_type === 'textarea' && (
                    <Textarea
                      id={field.field_name}
                      value={form[field.field_name] || ''}
                      onChange={(e) => setForm({ ...form, [field.field_name]: e.target.value })}
                      placeholder={field.placeholder || ''}
                      required={field.is_required}
                      className="min-h-[100px]"
                    />
                  )}
                  
                  {field.field_type === 'text' && (
                    <Input
                      id={field.field_name}
                      value={form[field.field_name] || ''}
                      onChange={(e) => setForm({ ...form, [field.field_name]: e.target.value })}
                      placeholder={field.placeholder || ''}
                      required={field.is_required}
                    />
                  )}
                  
                  {field.field_type === 'email' && (
                    <Input
                      id={field.field_name}
                      type="email"
                      value={form[field.field_name] || ''}
                      onChange={(e) => setForm({ ...form, [field.field_name]: e.target.value })}
                      placeholder={field.placeholder || ''}
                      required={field.is_required}
                    />
                  )}
                  
                  {field.field_type === 'phone' && (
                    <Input
                      id={field.field_name}
                      type="tel"
                      value={form[field.field_name] || ''}
                      onChange={(e) => setForm({ ...form, [field.field_name]: e.target.value })}
                      placeholder={field.placeholder || ''}
                      required={field.is_required}
                    />
                  )}
                  
                  {field.field_type === 'select' && field.field_options?.options && (
                    <Select
                      value={form[field.field_name] || ''}
                      onValueChange={(value) => setForm({ ...form, [field.field_name]: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || 'Selecione uma opção'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.field_options.options.map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.field_type === 'radio' && field.field_options?.options && (
                    <RadioGroup
                      value={form[field.field_name] || ''}
                      onValueChange={(value) => setForm({ ...form, [field.field_name]: value })}
                    >
                      {field.field_options.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${field.field_name}-${index}`} />
                          <Label htmlFor={`${field.field_name}-${index}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {field.help_text && (
                    <p className="text-xs text-muted-foreground">{field.help_text}</p>
                  )}
                </div>
              ))}

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