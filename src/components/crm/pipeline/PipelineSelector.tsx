import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export function PipelineSelector({ onSelect }: { onSelect: (pipelineId: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: pipelines } = useQuery({
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

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        Selecionar Pipeline
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-2 border rounded-lg divide-y">
          {pipelines?.map((pipeline) => (
            <Button
              key={pipeline.id}
              variant="ghost"
              className="w-full justify-start p-4 h-auto"
              onClick={() => {
                onSelect(pipeline.id);
                setIsOpen(false);
              }}
            >
              <div>
                <h3 className="font-medium text-left">{pipeline.name}</h3>
                {pipeline.description && (
                  <p className="text-sm text-muted-foreground text-left">
                    {pipeline.description}
                  </p>
                )}
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}