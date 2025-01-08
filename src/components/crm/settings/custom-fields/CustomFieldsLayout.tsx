import { useState } from "react";
import { CustomField } from "./types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Entity } from "../entities/types";
import { EntitySelector } from "./components/EntitySelector";
import { EntityFieldsEditor } from "./components/EntityFieldsEditor";
import { Json } from "@/types/database/json";

export function CustomFieldsLayout() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});

  const { data: entities, refetch } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data, error } = await supabase
        .from('custom_entities')
        .select(`
          *,
          entity_fields!entity_fields_entity_id_fkey(*)
        `)
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Entity[];
    }
  });

  const handleSelectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    const entity = entities?.find(e => e.id === entityId);
    if (entity?.entity_fields) {
      const mappedFields: CustomField[] = entity.entity_fields.map(field => ({
        id: field.id,
        name: field.name,
        field_type: field.field_type as CustomField['field_type'],
        description: field.description,
        is_required: field.is_required,
        order_index: field.order_index,
        client_id: field.client_id,
        pipeline_id: entityId,
        stage_id: entityId,
        options: field.options || [],
        created_at: field.created_at || new Date().toISOString(),
        updated_at: field.updated_at || new Date().toISOString(),
        layout_config: field.layout_config as unknown as CustomField['layout_config']
      }));

      setStagedFields({
        [entityId]: mappedFields
      });
    }
  };

  const handleSave = async () => {
    if (!selectedEntityId) return;
    
    try {
      const { error } = await supabase
        .from('entity_fields')
        .upsert(
          stagedFields[selectedEntityId].map(field => ({
            ...field,
            entity_id: selectedEntityId,
            // Convertendo layout_config para Json explicitamente
            layout_config: field.layout_config as unknown as Json
          }))
        );

      if (error) throw error;
      
      toast.success("Alterações salvas com sucesso!");
      await refetch();
    } catch (error) {
      console.error('Error saving fields:', error);
      toast.error("Erro ao salvar alterações");
    }
  };

  return (
    <div className="grid grid-cols-[250px_1fr] gap-4 h-full">
      <EntitySelector
        entities={entities}
        selectedEntityId={selectedEntityId}
        onSelectEntity={handleSelectEntity}
      />

      <EntityFieldsEditor
        selectedEntityId={selectedEntityId}
        stagedFields={stagedFields}
        setStagedFields={setStagedFields}
        onSave={handleSave}
      />
    </div>
  );
}