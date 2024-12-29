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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PipelineFieldsEditorProps {
  onChange: () => void;
}

export function PipelineFieldsEditor({ onChange }: PipelineFieldsEditorProps) {
  const [selectedPipeline, setSelectedPipeline] = useState<string>();

  const { data: pipelines, isLoading } = useQuery({
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
      <Select
        value={selectedPipeline}
        onValueChange={setSelectedPipeline}
      >
        <SelectTrigger>
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
                <div className="min-h-[500px] p-4">
                  <div className="text-center text-muted-foreground">
                    Arraste campos aqui ou clique para adicionar
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}
    </div>
  );
}