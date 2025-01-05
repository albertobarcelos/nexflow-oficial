import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewPipelineDialog } from "../pipeline/NewPipelineDialog";
import { PipelineCard } from "../pipeline/PipelineCard";
import { FieldTypesSidebar } from "../custom-fields/FieldTypesSidebar";

export function PipelinesCustomization() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>();

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
          *,
          pipeline_stages (
            *
          )
        `)
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: true });

      return data;
    }
  });

  return (
    <div className="grid grid-cols-[250px_300px_1fr] gap-6 h-[calc(100vh-300px)]">
      {/* Lista de Pipelines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Pipelines</h3>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="space-y-2">
            {pipelines?.map((pipeline) => (
              <div
                key={pipeline.id}
                className={`p-3 cursor-pointer rounded-lg hover:bg-muted ${
                  selectedPipelineId === pipeline.id ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedPipelineId(pipeline.id)}
              >
                {pipeline.name}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Tipos de Campos */}
      <FieldTypesSidebar />

      {/* Área de Configuração */}
      <ScrollArea className="border rounded-lg p-4">
        {selectedPipelineId ? (
          <div className="space-y-4">
            {pipelines?.find(p => p.id === selectedPipelineId)?.pipeline_stages.map((stage) => (
              <div key={stage.id} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{stage.name}</h4>
                {/* Área para os campos da etapa */}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Selecione um pipeline para configurar
          </div>
        )}
      </ScrollArea>
    </div>
  );
}