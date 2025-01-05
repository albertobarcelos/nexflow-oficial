import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EntityList } from "../entities/components/EntityList";
import { FieldTypesSidebar } from "../custom-fields/FieldTypesSidebar";
import { EntityFormFields } from "../entities/components/form/EntityFormFields";

export function EntitiesCustomization() {
  const [selectedEntityId, setSelectedEntityId] = useState<string>();
  
  const { data: entities, isLoading } = useQuery({
    queryKey: ['custom_entities'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data } = await supabase
        .from('custom_entities')
        .select('*')
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: true });

      return data;
    }
  });

  return (
    <div className="grid grid-cols-[250px_300px_1fr] gap-6 h-[calc(100vh-300px)]">
      {/* Lista de Entidades */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Entidades</h3>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-40px)]">
          <EntityList
            entities={entities || []}
            onEdit={(entity) => setSelectedEntityId(entity.id)}
          />
        </ScrollArea>
      </div>

      {/* Tipos de Campos */}
      <FieldTypesSidebar />

      {/* Área de Configuração */}
      <ScrollArea className="border rounded-lg p-4">
        {selectedEntityId ? (
          <EntityFormFields
            currentEntityId={selectedEntityId}
            fields={[]}
            setFields={() => {}}
            entities={entities || []}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Selecione uma entidade para configurar
          </div>
        )}
      </ScrollArea>
    </div>
  );
}