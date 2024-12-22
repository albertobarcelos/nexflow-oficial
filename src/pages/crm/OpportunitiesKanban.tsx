import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KanbanHeader } from '@/components/crm/opportunities/KanbanHeader';
import { KanbanColumn } from '@/components/crm/opportunities/KanbanColumn';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function OpportunitiesKanban() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: columns = [], isLoading: isLoadingStages } = useQuery({
    queryKey: ['pipeline-stages', selectedPipelineId],
    queryFn: async () => {
      if (!selectedPipelineId) return [];

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
        .eq('pipeline_id', selectedPipelineId)
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

      // Then fetch opportunities
      const { data: opportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select(`
          *,
          category:category_id (
            name,
            color
          )
        `)
        .eq('pipeline_id', selectedPipelineId)
        .eq('client_id', collaborator.client_id);

      if (oppsError) {
        toast({
          title: "Erro ao carregar oportunidades",
          description: "Não foi possível carregar as oportunidades.",
          variant: "destructive",
        });
        return [];
      }

      // Create columns with stages and their opportunities
      return stages.map(stage => ({
        id: stage.id,
        title: stage.name,
        color: stage.color,
        opportunities: opportunities?.filter(opp => opp.stage_id === stage.id) || []
      }));
    },
    enabled: !!selectedPipelineId
  });

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update in database
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ stage_id: destination.droppableId })
        .eq('id', draggableId);

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
  };

  return (
    <div className="space-y-4">
      <KanbanHeader onPipelineSelect={setSelectedPipelineId} />

      {isLoadingStages ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : selectedPipelineId ? (
        columns.length > 0 ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
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
          </DragDropContext>
        ) : (
          <Alert>
            <AlertDescription>
              Nenhuma etapa configurada para este pipeline. Configure as etapas nas configurações.
            </AlertDescription>
          </Alert>
        )
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Selecione um pipeline para visualizar as oportunidades
        </div>
      )}
    </div>
  );
}