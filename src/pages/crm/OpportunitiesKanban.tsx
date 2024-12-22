import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { PipelineSelector } from '@/components/crm/pipeline/PipelineSelector';

type Opportunity = {
  id: string;
  title: string;
  value: number | null;
  assigned_to: string | null;
  expected_close_date: string | null;
  stage_id: string;
};

type Column = {
  id: string;
  title: string;
  color: string;
  opportunities: Opportunity[];
};

export default function OpportunitiesKanban() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { isLoading: isLoadingStages } = useQuery({
    queryKey: ['pipeline-stages', selectedPipelineId],
    queryFn: async () => {
      if (!selectedPipelineId) return;

      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', selectedPipelineId)
        .order('order_index');

      if (!stages) return;

      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .eq('pipeline_id', selectedPipelineId);

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipelines</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/opportunities/list')}
          >
            <List className="h-4 w-4 mr-2" />
            Visualizar Lista
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      <PipelineSelector onSelect={setSelectedPipelineId} />

      {selectedPipelineId ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map(column => (
              <div key={column.id} className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 bg-${column.color}-500`}
                  />
                  {column.title}
                </h3>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 min-h-[200px]"
                    >
                      {column.opportunities.map((opportunity, index) => (
                        <Draggable
                          key={opportunity.id}
                          draggableId={opportunity.id}
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing"
                              onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
                            >
                              <CardContent className="p-4">
                                <h4 className="font-medium">{opportunity.title}</h4>
                                {opportunity.value && (
                                  <p className="text-sm text-muted-foreground">
                                    R$ {opportunity.value.toLocaleString('pt-BR')}
                                  </p>
                                )}
                                {opportunity.expected_close_date && (
                                  <p className="text-sm text-muted-foreground">
                                    Previsão: {new Date(opportunity.expected_close_date).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
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