import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { CustomField } from "./types";
import { useToast } from "@/hooks/use-toast";

interface PipelineFieldsEditorProps {
  onChange: () => void;
}

export function PipelineFieldsEditor({ onChange }: PipelineFieldsEditorProps) {
  const [selectedPipeline, setSelectedPipeline] = useState<string>();
  const [fieldsCount, setFieldsCount] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pipelines, isLoading: isPipelinesLoading } = useQuery({
    queryKey: ['pipeline_configs'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data } = await supabase
        .from('pipeline_configs')
        .select(`
          id,
          name,
          pipeline_stages (
            id,
            name,
            order_index
          )
        `)
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: true });

      return data;
    }
  });

  const { data: customFields, isLoading: isFieldsLoading } = useQuery({
    queryKey: ['custom_fields', selectedPipeline],
    enabled: !!selectedPipeline,
    queryFn: async () => {
      const { data } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('pipeline_id', selectedPipeline)
        .order('order_index', { ascending: true });

      setFieldsCount(data?.length || 0);
      return data as CustomField[];
    }
  });

  const handleDrop = async (result: any) => {
    if (!result.destination || !selectedPipeline) return;

    try {
      const { draggableId, destination } = result;
      const stageId = destination.droppableId;

      // Get the field type from the draggableId
      const fieldType = draggableId;

      // Get client_id
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) return;

      const { error } = await supabase
        .from('custom_fields')
        .insert({
          client_id: collaborator.client_id,
          pipeline_id: selectedPipeline,
          stage_id: stageId,
          field_type: fieldType,
          name: `Novo campo ${fieldType}`,
          order_index: customFields?.length || 0,
        });

      if (error) {
        toast({
          title: "Erro ao adicionar campo",
          description: "Não foi possível adicionar o campo. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['custom_fields', selectedPipeline] });
      onChange();
      
      toast({
        title: "Campo adicionado",
        description: "O campo foi adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Error adding custom field:', error);
      toast({
        title: "Erro ao adicionar campo",
        description: "Ocorreu um erro ao adicionar o campo.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isPipelinesLoading || isFieldsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-250px)]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!pipelines?.length) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="font-medium text-lg">Nenhum Pipeline Encontrado</h3>
          <p className="text-muted-foreground">
            Crie um pipeline primeiro para começar a personalizar os campos.
          </p>
        </div>
      </Card>
    );
  }

  const selectedPipelineData = pipelines?.find(p => p.id === selectedPipeline);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select
          value={selectedPipeline}
          onValueChange={setSelectedPipeline}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Selecione um pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines?.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary">
          {fieldsCount} campos utilizados
        </Badge>
      </div>

      {selectedPipelineData && (
        <Card className="p-4">
          <Tabs defaultValue={selectedPipelineData.pipeline_stages[0]?.id}>
            <TabsList className="w-full justify-start">
              {selectedPipelineData.pipeline_stages
                .sort((a, b) => a.order_index - b.order_index)
                .map((stage) => (
                  <TabsTrigger key={stage.id} value={stage.id}>
                    {stage.name}
                  </TabsTrigger>
                ))}
            </TabsList>
            {selectedPipelineData.pipeline_stages.map((stage) => (
              <TabsContent key={stage.id} value={stage.id}>
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[500px] p-4 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? "bg-muted" : ""
                      }`}
                    >
                      {customFields?.filter(field => field.stage_id === stage.id)
                        .map((field, index) => (
                          <div key={field.id} className="p-2 mb-2 bg-white rounded border">
                            {field.name}
                          </div>
                        ))}
                      <div className="text-center text-muted-foreground">
                        Arraste campos aqui ou clique para adicionar
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}
    </div>
  );
}