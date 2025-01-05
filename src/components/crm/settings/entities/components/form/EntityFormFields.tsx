import { EntityFieldEditor } from "../field-editor/EntityFieldEditor";
import { ConfiguredFieldsTable } from "../ConfiguredFieldsTable";
import { Entity } from "../../types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface EntityFormFieldsProps {
  currentEntityId: string;
  setFields: (fields: any[]) => void;
  entities: Entity[];
}

export function EntityFormFields({ currentEntityId, setFields, entities }: EntityFormFieldsProps) {
  // Fetch entity fields
  const { data: entityFields, isLoading } = useQuery({
    queryKey: ['entity_fields', currentEntityId],
    enabled: !!currentEntityId,
    queryFn: async () => {
      console.log('Fetching fields for entity:', currentEntityId);
      const { data, error } = await supabase
        .from('entity_fields')
        .select('*')
        .eq('entity_id', currentEntityId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching entity fields:', error);
        throw error;
      }

      console.log('Fetched fields:', data);
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Campos da Entidade</h3>
      <EntityFieldEditor 
        fields={entityFields || []}
        onChange={setFields} 
        currentEntityId={currentEntityId}
        entities={entities || []}
      />
      
      {entityFields && entityFields.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Campos Configurados</h4>
          <ConfiguredFieldsTable fields={entityFields} />
        </div>
      )}
    </div>
  );
}