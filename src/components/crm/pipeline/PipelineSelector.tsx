import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, CircleMinus } from "lucide-react";

export function PipelineSelector({ onSelect }: { onSelect: (pipelineId: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

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
        Nenhum Disponível
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between px-2 py-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Selecionar Pipeline</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute inset-x-0 top-0 mt-1 z-50">
          <div className="bg-popover border rounded-md shadow-md overflow-hidden">
            {pipelines.map((pipeline) => (
              <Button
                key={pipeline.id}
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto text-left"
                onClick={() => {
                  onSelect(pipeline.id);
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium">{pipeline.name}</div>
                  {pipeline.description && (
                    <div className="text-sm text-muted-foreground">
                      {pipeline.description}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}