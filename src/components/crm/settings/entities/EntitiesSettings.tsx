import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityList } from "./components/EntityList";
import { EntityFormFields } from "./components/form/EntityFormFields";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Entity } from "./types";

export function EntitiesSettings() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const { data: entities, isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data: entities } = await supabase
        .from('custom_entities')
        .select(`
          *,
          entity_fields (*)
        `)
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: false });

      return entities as Entity[];
    }
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Entidades</h1>
        <p className="text-muted-foreground">
          Gerencie as entidades e seus campos personalizados
        </p>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        <EntityList 
          entities={entities || []} 
          selectedEntityId={selectedEntityId}
          onSelectEntity={setSelectedEntityId}
        />

        {selectedEntityId ? (
          <Card className="p-4">
            <EntityFormFields 
              entityId={selectedEntityId} 
              entities={entities || []}
            />
          </Card>
        ) : (
          <Card className="p-4 flex items-center justify-center text-muted-foreground">
            Selecione uma entidade para configurar seus campos
          </Card>
        )}
      </div>
    </div>
  );
}