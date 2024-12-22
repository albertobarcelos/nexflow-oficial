import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KanbanHeader } from '@/components/crm/opportunities/KanbanHeader';
import { KanbanColumn } from '@/components/crm/opportunities/KanbanColumn';

export default function OpportunitiesKanban() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const { toast } = useToast();

  const { isLoading: isLoadingStages } = useQuery({
    queryKey: ['pipeline-stages', selectedPipelineId],
    queryFn: async () => {
      if (!selectedPipelineId) return;

      // Fetch stages with their opportunities
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', selectedPipelineId)
        .order('order_index');

      if (!stages) return;

      // Fetch opportunities with their categories
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select(`
          *,
          category:category_id (
            name,
            color
          )
        `)
        .eq('pipeline_id', selectedPipelineId);

      // Create columns with stages and their opportunities
      const newColumns = stages.map(stage => ({
        id: stage.id,
        title: stage.name,
        color: stage.color,
        opportunities: opportunities?.filter(opp => opp.stage_id === stage.id) || []
      }));

      setColumns(newColumns);
      return stages;
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

    const sourceCol = columns.find(col => col.id === source.droppableId);
    const destCol = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceCol || !destCol) return;

    const opportunity = sourceCol.opportunities[source.index];

    // Update columns locally
    const newColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        const newOpportunities = Array.from(col.opportunities);
        newOpportunities.splice(source.index, 1);
        return { ...col, opportunities: newOpportunities };
      }
      if (col.id === destination.droppableId) {
        const newOpportunities = Array.from(col.opportunities);
        newOpportunities.splice(destination.index, 0, opportunity);
        return { ...col, opportunities: newOpportunities };
      }
      return col;
    });

    setColumns(newColumns);

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

  if (isLoadingStages) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <KanbanHeader onPipelineSelect={setSelectedPipelineId} />

      {selectedPipelineId ? (
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
        <div className="text-center py-8 text-muted-foreground">
          Selecione um pipeline para visualizar as oportunidades
        </div>
      )}
    </div>
  );
}