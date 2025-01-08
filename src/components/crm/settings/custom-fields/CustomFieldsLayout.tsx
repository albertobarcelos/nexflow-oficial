import { useState } from "react";
import { EntityField } from "./types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Entity } from "../entities/types";
import { EntitySelector } from "./components/EntitySelector";
import { EntityFieldsEditor } from "./components/EntityFieldsEditor";
import { Json } from "@/types/database/json";

export function CustomFieldsLayout() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [stagedFields, setStagedFields] = useState<Record<string, EntityField[]>>({});

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
    if (!entityId) {
      toast.error("ID da entidade inválido");
      return;
    }
    
    setSelectedEntityId(entityId);
    const entity = entities?.find(e => e.id === entityId);
    if (entity?.entity_fields) {
      const mappedFields: EntityField[] = entity.entity_fields.map((field, index) => ({
        ...field,
        field_type: field.field_type as EntityField['field_type'],
        order_index: index,
        created_at: field.created_at || new Date().toISOString(),
        updated_at: field.updated_at || new Date().toISOString(),
        layout_config: field.layout_config || {
          width: 'full'
        }
      }));

      setStagedFields({
        [entityId]: mappedFields
      });
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!selectedEntityId || !fieldId) {
      toast.error("Dados inválidos para exclusão");
      return;
    }
    
    try {
      // Delete related records one by one
      const { error: relError } = await supabase
        .from('entity_field_relationships')
        .delete()
        .eq('source_field_id', fieldId);

      if (relError) throw relError;

      const { error } = await supabase
        .from('entity_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      const updatedFields = stagedFields[selectedEntityId].filter(f => f.id !== fieldId);
      setStagedFields({
        ...stagedFields,
        [selectedEntityId]: updatedFields
      });
      
      toast.success("Campo removido com sucesso!");
      await refetch();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error("Erro ao remover campo");
    }
  };

  const handleSave = async () => {
    if (!selectedEntityId) {
      toast.error("Nenhuma entidade selecionada");
      return;
    }
    
    try {
      const fieldsToSave = stagedFields[selectedEntityId].map((field, index) => ({
        ...field,
        order_index: index,
        entity_id: selectedEntityId,
        layout_config: field.layout_config as unknown as Json
      }));

      // Delete related records one by one
      for (const field of fieldsToSave) {
        if (!field.id) continue;
        const { error: relError } = await supabase
          .from('entity_field_relationships')
          .delete()
          .eq('source_field_id', field.id);

        if (relError) throw relError;
      }

      // Delete existing fields
      const { error: deleteError } = await supabase
        .from('entity_fields')
        .delete()
        .eq('entity_id', selectedEntityId);

      if (deleteError) throw deleteError;

      // Insert new fields
      const { error: insertError } = await supabase
        .from('entity_fields')
        .insert(fieldsToSave);

      if (insertError) throw insertError;
      
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
        onDeleteField={handleDeleteField}
      />
    </div>
  );
}