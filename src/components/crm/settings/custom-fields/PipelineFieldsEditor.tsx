import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomField } from "./types";
import { defaultFields } from "./components/DefaultFields";
import { StageTabContent } from "./components/StageTabContent";
import { PipelineSelector } from "./components/PipelineSelector";

interface PipelineFieldsEditorProps {
  onChange: () => void;
}

export function PipelineFieldsEditor({ onChange }: PipelineFieldsEditorProps) {
  const [selectedPipeline, setSelectedPipeline] = useState<string>();
  const [fieldsCount, setFieldsCount] = useState<number>(0);
  const { toast } = useToast();

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
          *,
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

      setFieldsCount((data?.length || 0) + defaultFields.length);
      return data as CustomField[];
    }
  });

  const handleDrop = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const stageId = destination.droppableId;

    try {
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
          field_type: draggableId,
          name: `Novo campo ${draggableId}`,
          order_index: customFields?.length || 0,
        });

      if (error) throw error;

      toast({
        title: "Campo adicionado",
        description: "O campo foi adicionado com sucesso à etapa.",
      });
      
      onChange();
    } catch (error) {
      console.error('Error adding custom field:', error);
      toast({
        title: "Erro ao adicionar campo",
        description: "Não foi possível adicionar o campo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const selectedPipelineData = pipelines?.find(p => p.id === selectedPipeline);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <PipelineSelector
          pipelines={pipelines || []}
          selectedPipeline={selectedPipeline}
          onPipelineChange={setSelectedPipeline}
        />
        <Badge variant="secondary">
          {fieldsCount} campos utilizados
        </Badge>
      </div>

      {selectedPipelineData && (
        <Card className="overflow-hidden">
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
            {selectedPipelineData.pipeline_stages.map((stage, index) => (
              <TabsContent key={stage.id} value={stage.id} className="m-0">
                <StageTabContent
                  stageId={stage.id}
                  fields={[
                    ...(index === 0 ? defaultFields : []),
                    ...(customFields?.filter(field => field.stage_id === stage.id) || [])
                  ]}
                  isFirstStage={index === 0}
                />
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}
    </div>
  );
}