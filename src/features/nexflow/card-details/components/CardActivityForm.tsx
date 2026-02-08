import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { UserSelector } from '@/components/ui/user-selector';
import { useFlowActivityTypes, useCreateFlowActivityType } from '@/hooks/useFlowActivityTypes';
import { useCreateCardActivity, useUpdateCardActivity } from '@/hooks/useCardActivities';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';
import type { CardActivity, CreateCardActivityInput, UpdateCardActivityInput } from '@/types/activities';
import type { NexflowCard } from '@/types/nexflow';

const activityFormSchema = z.object({
  activity_type_id: z.string().min(1, 'Tipo de atividade é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  start_date: z.date({ required_error: 'Data de início é obrigatória' }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida (use formato HH:MM)'),
  end_date: z.date({ required_error: 'Data de término é obrigatória' }),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida (use formato HH:MM)'),
  assignee_id: z.string().optional(),
}).refine((data) => {
  // Validar que end_at > start_at
  const startAt = new Date(data.start_date);
  const [startHour, startMinute] = data.start_time.split(':').map(Number);
  startAt.setHours(startHour, startMinute, 0, 0);

  const endAt = new Date(data.end_date);
  const [endHour, endMinute] = data.end_time.split(':').map(Number);
  endAt.setHours(endHour, endMinute, 0, 0);

  return endAt > startAt;
}, {
  message: 'A data/hora de término deve ser posterior à data/hora de início',
  path: ['end_time'],
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

interface CardActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: NexflowCard | null;
  activity?: CardActivity | null;
  onSuccess?: () => void;
  /** Título pré-preenchido ao criar nova atividade (ex.: título do processo) */
  defaultTitle?: string;
  /** ID do step_action para vincular a atividade ao processo que a gerou */
  stepActionId?: string | null;
}

export function CardActivityForm({
  open,
  onOpenChange,
  card,
  activity,
  onSuccess,
  defaultTitle,
  stepActionId,
}: CardActivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateTypeDialogOpen, setIsCreateTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const { data: activityTypes = [], isLoading: isLoadingTypes, error: typesError } = useFlowActivityTypes(card?.flowId || null);
  const { data: users = [] } = useUsers();
  const createActivity = useCreateCardActivity();
  const updateActivity = useUpdateCardActivity();
  const createType = useCreateFlowActivityType();

  const activeActivityTypes = activityTypes.filter((type) => type.active);

  const handleCreateType = async () => {
    if (!card?.flowId || !newTypeName.trim()) return;

    try {
      const newType = await createType.mutateAsync({
        flow_id: card.flowId,
        name: newTypeName.trim(),
        color: '#3B82F6',
        icon: 'Calendar',
        active: true,
      });

      // Selecionar o novo tipo automaticamente
      form.setValue('activity_type_id', newType.id);
      setIsCreateTypeDialogOpen(false);
      setNewTypeName('');
    } catch (error) {
      console.error('Erro ao criar tipo:', error);
    }
  };

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activity_type_id: '',
      title: '',
      description: '',
      start_date: new Date(),
      start_time: '09:00',
      end_date: new Date(),
      end_time: '10:00',
      assignee_id: undefined,
    },
  });

  // Preencher formulário quando editar atividade existente
  useEffect(() => {
    if (activity && open) {
      const startAt = parseISO(activity.start_at);
      const endAt = parseISO(activity.end_at);

      form.reset({
        activity_type_id: activity.activity_type_id,
        title: activity.title,
        description: activity.description || '',
        start_date: startAt,
        start_time: format(startAt, 'HH:mm'),
        end_date: endAt,
        end_time: format(endAt, 'HH:mm'),
        assignee_id: activity.assignee_id || undefined,
      });
    } else if (!activity && open) {
      // Resetar para valores padrão quando criar nova (usa defaultTitle se fornecido)
      form.reset({
        activity_type_id: '',
        title: defaultTitle ?? '',
        description: '',
        start_date: new Date(),
        start_time: '09:00',
        end_date: new Date(),
        end_time: '10:00',
        assignee_id: undefined,
      });
    }
  }, [activity, open, form, defaultTitle]);

  const onSubmit = async (values: ActivityFormValues) => {
    if (!card) return;

    setIsSubmitting(true);
    try {
      // Combinar data e hora
      const startAt = new Date(values.start_date);
      const [startHour, startMinute] = values.start_time.split(':').map(Number);
      startAt.setHours(startHour, startMinute, 0, 0);

      const endAt = new Date(values.end_date);
      const [endHour, endMinute] = values.end_time.split(':').map(Number);
      endAt.setHours(endHour, endMinute, 0, 0);

      if (activity) {
        // Atualizar atividade existente
        const updateData: UpdateCardActivityInput = {
          activity_type_id: values.activity_type_id,
          title: values.title,
          description: values.description || null,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          assignee_id: values.assignee_id || null,
        };

        await updateActivity.mutateAsync({
          id: activity.id,
          cardId: card.id,
          input: updateData,
        });
      } else {
        // Criar nova atividade
        const createData: CreateCardActivityInput = {
          card_id: card.id,
          activity_type_id: values.activity_type_id,
          title: values.title,
          description: values.description || null,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          assignee_id: values.assignee_id || undefined,
          step_action_id: stepActionId ?? undefined,
        };

        await createActivity.mutateAsync(createData);
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('[CardActivityForm] Erro ao salvar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Converter usuários para formato do UserSelector
  const usersForSelector = users.map((user) => ({
    id: user.id,
    first_name: user.name,
    last_name: user.surname,
    avatar_url: user.avatar_url,
    avatar_type: user.avatar_type,
    avatar_seed: user.avatar_seed,
    custom_avatar_url: user.custom_avatar_url,
  }));

  const selectedAssignee = usersForSelector.find((u) => u.id === form.watch('assignee_id'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
          <DialogDescription>
            {activity
              ? 'Atualize os detalhes da atividade'
              : 'Crie uma nova atividade para este card'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de Atividade */}
          <div className="space-y-2">
            <Label htmlFor="activity_type_id">
              Tipo de Atividade <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch('activity_type_id')}
              onValueChange={(value) => form.setValue('activity_type_id', value)}
              disabled={isLoadingTypes}
            >
              <SelectTrigger>
                <SelectValue 
                  placeholder={
                    isLoadingTypes 
                      ? "Carregando tipos..." 
                      : activeActivityTypes.length === 0
                      ? "Nenhum tipo disponível"
                      : "Selecione o tipo de atividade"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTypes ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Carregando tipos de atividade...
                  </div>
                ) : (
                  <>
                    {activeActivityTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {type.icon && (
                            <span className="text-sm">{type.icon}</span>
                          )}
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {card?.flowId && (
                      <div className="border-t mt-1 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsCreateTypeDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          Criar novo tipo
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.activity_type_id && (
              <p className="text-sm text-red-500">
                {form.formState.errors.activity_type_id.message}
              </p>
            )}
            {typesError && (
              <p className="text-sm text-yellow-600">
                Aviso: Não foi possível carregar os tipos de atividade. Verifique se as migrations foram aplicadas.
              </p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Ex: Reunião com cliente"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Detalhes da atividade..."
              rows={4}
            />
          </div>

          {/* Data/Hora de Início */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Data de Início <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('start_date') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('start_date') ? (
                      format(form.watch('start_date'), 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('start_date')}
                    onSelect={(date) => date && form.setValue('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.start_date && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Hora de Início <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  {...form.register('start_time')}
                  className="pl-10"
                />
              </div>
              {form.formState.errors.start_time && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.start_time.message}
                </p>
              )}
            </div>
          </div>

          {/* Data/Hora de Término */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Data de Término <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('end_date') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('end_date') ? (
                      format(form.watch('end_date'), 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('end_date')}
                    onSelect={(date) => date && form.setValue('end_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.end_date && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Hora de Término <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  {...form.register('end_time')}
                  className="pl-10"
                />
              </div>
              {form.formState.errors.end_time && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.end_time.message}
                </p>
              )}
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            <UserSelector
              users={usersForSelector}
              value={form.watch('assignee_id')}
              onChange={(userId) => form.setValue('assignee_id', userId)}
              placeholder="Selecione o responsável (opcional)"
            />
            <p className="text-xs text-muted-foreground">
              Se não selecionado, você será o responsável por padrão
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : activity
                  ? 'Atualizar Atividade'
                  : 'Criar Atividade'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Diálogo para criar novo tipo de atividade */}
      <Dialog open={isCreateTypeDialogOpen} onOpenChange={setIsCreateTypeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Tipo de Atividade</DialogTitle>
            <DialogDescription>
              Crie um novo tipo de atividade para este flow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-type-name">
                Nome do Tipo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Ex: Reunião, Visita, Ligação..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTypeName.trim()) {
                    handleCreateType();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateTypeDialogOpen(false);
                  setNewTypeName('');
                }}
                disabled={createType.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateType}
                disabled={!newTypeName.trim() || createType.isPending}
              >
                {createType.isPending ? 'Criando...' : 'Criar Tipo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
