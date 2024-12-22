import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CircleMinus } from "lucide-react";

export function PipelineSelector({ onSelect }: { onSelect: (pipelineId: string) => void }) {
  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data } = await supabase
        .from('pipeline_configs')
        .select('*')
        .eq('client_id', collaborator.client_id);

      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="px-2 py-1 text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (!pipelines?.length) {
    return (
      <div className="px-2 py-1 text-muted-foreground flex items-center gap-2">
        <CircleMinus className="h-4 w-4" />
        Nenhum Pipeline Disponível
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {pipelines.map((pipeline) => (
        <Button
          key={pipeline.id}
          variant="ghost"
          size="sm"
          className="w-full justify-start pl-8 h-8 text-sm"
          onClick={() => onSelect(pipeline.id)}
        >
          {pipeline.name}
        </Button>
      ))}
    </div>
  );
}