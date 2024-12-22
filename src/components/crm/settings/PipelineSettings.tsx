import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewPipelineDialog } from "./pipeline/NewPipelineDialog";
import { PipelineCard } from "./pipeline/PipelineCard";

export function PipelineSettings() {
  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['pipeline_configs'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data: pipelineConfigs } = await supabase
        .from('pipeline_configs')
        .select(`
          *,
          pipeline_stages (
            *
          )
        `)
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: true });

      return pipelineConfigs;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pipelines</h2>
          <p className="text-muted-foreground">
            Configure seus pipelines de vendas
          </p>
        </div>
        <NewPipelineDialog />
      </div>

      <div className="space-y-4">
        {pipelines?.map((pipeline) => (
          <PipelineCard key={pipeline.id} pipeline={pipeline} />
        ))}
      </div>
    </div>
  );
}