import { useState } from 'react';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Edit,
  Trash2,
  User,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useGroupedCardActivities, useDeleteCardActivity, useCompleteCardActivity } from '@/hooks/useCardActivities';
import { CardActivityForm } from './CardActivityForm';
import { cn } from '@/lib/utils';
import type { CardActivity, ActivityFilter } from '@/types/activities';
import type { NexflowCard } from '@/types/nexflow';
import { toast } from 'sonner';

interface CardActivitiesTabProps {
  card: NexflowCard | null;
}

export function CardActivitiesTab({ card }: CardActivitiesTabProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CardActivity | null>(null);

  const { data: groupedActivities = [], activities = [] } = useGroupedCardActivities(
    card?.id || null,
    filter
  );
  const deleteActivity = useDeleteCardActivity();
  const completeActivity = useCompleteCardActivity();

  const handleCreateActivity = () => {
    setEditingActivity(null);
    setIsFormOpen(true);
  };

  const handleEditActivity = (activity: CardActivity) => {
    setEditingActivity(activity);
    setIsFormOpen(true);
  };

  const handleDeleteActivity = async (activity: CardActivity) => {
    if (!card) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja deletar a atividade "${activity.title}"?`
    );
    if (!confirmed) return;

    try {
      await deleteActivity.mutateAsync({
        id: activity.id,
        cardId: card.id,
      });
    } catch (error) {
      console.error('[CardActivitiesTab] Erro ao deletar:', error);
    }
  };

  const handleToggleComplete = async (activity: CardActivity) => {
    if (!card) return;

    try {
      await completeActivity.mutateAsync({
        id: activity.id,
        cardId: card.id,
        completed: !activity.completed,
      });
    } catch (error) {
      console.error('[CardActivitiesTab] Erro ao atualizar:', error);
    }
  };

  const getActivityTypeColor = (activity: CardActivity) => {
    return activity.activity_type?.color || '#3B82F6';
  };

  const getActivityTypeIcon = (activity: CardActivity) => {
    // Por enquanto, retornar um ícone padrão
    // Futuramente, podemos usar o nome do ícone do lucide-react
    return activity.activity_type?.icon || 'Calendar';
  };

  const formatActivityDateTime = (activity: CardActivity) => {
    const startAt = parseISO(activity.start_at);
    const endAt = parseISO(activity.end_at);

    const isSameDay = format(startAt, 'yyyy-MM-dd') === format(endAt, 'yyyy-MM-dd');

    if (isSameDay) {
      return {
        date: format(startAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        time: `${format(startAt, 'HH:mm', { locale: ptBR })} - ${format(endAt, 'HH:mm', { locale: ptBR })}`,
      };
    }

    return {
      date: `${format(startAt, "dd 'de' MMMM", { locale: ptBR })} - ${format(endAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
      time: `${format(startAt, 'HH:mm', { locale: ptBR })} - ${format(endAt, 'HH:mm', { locale: ptBR })}`,
    };
  };

  if (!card) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Nenhum card selecionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com filtros e botão de criar */}
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as ActivityFilter)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={handleCreateActivity} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Atividade
        </Button>
      </div>

      {/* Lista de atividades */}
      {groupedActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Nenhuma atividade encontrada
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {filter === 'all'
              ? 'Crie uma nova atividade para começar'
              : `Nenhuma atividade ${filter === 'pending' ? 'pendente' : filter === 'completed' ? 'concluída' : filter === 'today' ? 'hoje' : 'próxima'}`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedActivities.map((group) => {
            const groupDate = parseISO(group.date);
            const isGroupToday = isToday(groupDate);

            return (
              <div key={group.date} className="space-y-3">
                {/* Cabeçalho do grupo (data) */}
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      'text-sm font-semibold',
                      isGroupToday
                        ? 'text-primary'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {isGroupToday
                      ? 'Hoje'
                      : format(groupDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {group.activities.length}
                  </Badge>
                </div>

                {/* Atividades do grupo */}
                <div className="space-y-2">
                  {group.activities.map((activity) => {
                    const { date, time } = formatActivityDateTime(activity);
                    const activityColor = getActivityTypeColor(activity);
                    const startAt = parseISO(activity.start_at);
                    const isActivityPast = isPast(startAt) && !isToday(startAt);
                    const isActivityToday = isToday(startAt);
                    const isActivityUpcoming = isFuture(startAt);

                    return (
                      <div
                        key={activity.id}
                        className={cn(
                          'rounded-lg border p-4 transition-all hover:shadow-md',
                          activity.completed
                            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-75'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                          isActivityPast && !activity.completed && 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Indicador de tipo (cor) */}
                          <div
                            className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: activityColor }}
                          />

                          {/* Conteúdo principal */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Título e tipo */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4
                                    className={cn(
                                      'text-sm font-semibold',
                                      activity.completed && 'line-through text-muted-foreground'
                                    )}
                                  >
                                    {activity.title}
                                  </h4>
                                  {activity.activity_type && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        borderColor: activityColor,
                                        color: activityColor,
                                      }}
                                    >
                                      {activity.activity_type.name}
                                    </Badge>
                                  )}
                                  {activity.completed && (
                                    <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400">
                                      Concluída
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleComplete(activity)}
                                  className="h-8 w-8 p-0"
                                >
                                  {activity.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditActivity(activity)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteActivity(activity)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Descrição */}
                            {activity.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {activity.description}
                              </p>
                            )}

                            {/* Data e hora */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{time}</span>
                              </div>
                            </div>

                            {/* Responsável */}
                            {activity.assignee && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <UserAvatar
                                  user={{
                                    first_name: activity.assignee.name || undefined,
                                    last_name: activity.assignee.surname || undefined,
                                    avatar_url: activity.assignee.avatar_url,
                                  }}
                                  size="sm"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {activity.assignee.name} {activity.assignee.surname}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de formulário */}
      <CardActivityForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingActivity(null);
          }
        }}
        card={card}
        activity={editingActivity}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingActivity(null);
        }}
      />
    </div>
  );
}
