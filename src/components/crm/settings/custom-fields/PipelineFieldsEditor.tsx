import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CustomField } from "./types";
import { defaultFields } from "./components/DefaultFields";
import { StageTabContent } from "./components/StageTabContent";
import { PipelineSelector } from "./components/PipelineSelector";

interface PipelineFieldsEditorProps {
  stagedFields: Record<string, CustomField[]>;
  onChange: () => void;
}

export function PipelineFieldsEditor({ stagedFields, onChange }: PipelineFieldsEditorProps) {
  const [selectedPipeline, setSelectedPipeline] = useState<string>();
  const [fieldsCount, setFieldsCount] = useState<number>(0);

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

      return data as CustomField[];
    }
  });

  const selectedPipelineData = pipelines?.find(p => p.id === selectedPipeline);

  // Combina os campos existentes com os campos staged
  const getFieldsForStage = (stageId: string) => {
    const existingFields = customFields?.filter(field => field.stage_id === stageId) || [];
    const stagedFieldsForStage = stagedFields[stageId] || [];
    return [...existingFields, ...stagedFieldsForStage];
  };

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
                    ...getFieldsForStage(stage.id)
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