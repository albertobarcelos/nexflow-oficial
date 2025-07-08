import { useQuery } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { KanbanHeader } from '@/components/crm/opportunities/KanbanHeader';
import { KanbanColumn } from '@/components/crm/opportunities/KanbanColumn';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function OpportunitiesKanban() {
  const { pipelineId } = useParams();
  const { toast } = useToast();

  // Configuração dos sensores para @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: columns = [], isLoading: isLoadingStages } = useQuery({
    queryKey: ['pipeline-stages', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return [];

      // First get the client_id
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      // Fetch stages first
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('order_index');

      if (stagesError) {
        toast({
          title: "Erro ao carregar etapas",
          description: "Não foi possível carregar as etapas do pipeline.",
          variant: "destructive",
        });
        return [];
      }

      if (!stages?.length) return [];

      // Then fetch opportunities with assigned collaborator data
      const { data: opportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select(`
          *,
          category:opportunity_categories(
            name,
            color
          ),
          assigned_collaborator:collaborators!opportunities_assigned_to_fkey(
            name,
            auth_user_id
          )
        `)
        .eq('pipeline_id', pipelineId)
        .eq('client_id', collaborator.client_id);

      if (oppsError) {
        toast({
          title: "Erro ao carregar oportunidades",
          description: "Não foi possível carregar as oportunidades.",
          variant: "destructive",
        });
        return [];
      }

      // Transform opportunities to match the expected type
      const transformedOpportunities = opportunities?.map(opp => ({
        ...opp,
        assigned_to: opp.assigned_collaborator ? {
          name: opp.assigned_collaborator.name,
          avatar_url: undefined
        } : undefined,
        category: opp.category ? {
          name: opp.category.name,
          color: opp.category.color
        } : undefined
      }));

      // Create columns with stages and their opportunities
      return stages.map(stage => ({
        id: stage.id,
        title: stage.name,
        color: stage.color,
        opportunities: transformedOpportunities?.filter(opp => opp.stage_id === stage.id) || []
      }));
    },
    enabled: !!pipelineId
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Se foi solto sobre uma coluna (stage)
    if (overId && activeId !== overId) {
      try {
        const { error } = await supabase
          .from('opportunities')
          .update({ stage_id: overId })
          .eq('id', activeId);

        if (error) throw error;

        toast({
          title: "Status atualizado",
          description: "O status da oportunidade foi atualizado com sucesso.",
        });
      } catch (error) {
        console.error('Error updating opportunity status:', error);
        toast({
          title: "Erro ao atualizar status",
          description: "Não foi possível atualizar o status da oportunidade.",
          variant: "destructive",
        });
      }
    }
  };

  if (!pipelineId) {
    return (
      <Alert>
        <AlertDescription>
          Selecione um pipeline para visualizar as oportunidades
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <KanbanHeader />

      {isLoadingStages ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : columns.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex gap-4 overflow-x-auto p-4 pb-8">
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                opportunities={column.opportunities}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <Alert>
          <AlertDescription>
            Nenhuma etapa configurada para este pipeline. Configure as etapas nas configurações.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
