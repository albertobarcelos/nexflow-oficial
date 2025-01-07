import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { CustomField } from "./types";
import { toast } from "sonner";
import { fieldTypes } from "./data/fieldTypes";
import { FieldTypesHeader } from "./components/FieldTypesHeader";
import { CustomFieldDropZone } from "./components/CustomFieldDropZone";
import { EntityList } from "../entities/components/EntityList";
import { Entity } from "../entities/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
        updated_at: field.updated_at || new Date().toISOString()
      }));

      setStagedFields({
        [entityId]: mappedFields
      });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    console.log('🎯 handleDragEnd called with:', result);
    
    const { source, destination, draggableId } = result;
    
    if (!destination || !selectedEntityId) {
      console.log('❌ No destination or no entity selected');
      return;
    }

    if (source.droppableId === 'field-types') {
      console.log('🎯 Dragging from field types list');
      const fieldType = fieldTypes.find(f => f.id === draggableId);
      
      if (!fieldType) {
        console.error('❌ Field type not found:', draggableId);
        return;
      }

      console.log('✨ Found field type:', fieldType);

      const newField: CustomField = {
        id: crypto.randomUUID(),
        name: fieldType.name,
        field_type: fieldType.id,
        description: fieldType.description,
        is_required: false,
        order_index: stagedFields[selectedEntityId]?.length || 0,
        client_id: "",
        pipeline_id: selectedEntityId,
        stage_id: selectedEntityId,
        options: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setStagedFields(prev => ({
        ...prev,
        [selectedEntityId]: [...(prev[selectedEntityId] || []), newField]
      }));

      toast.success("Campo adicionado com sucesso!");
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
            entity_id: selectedEntityId
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
    <div className="grid grid-cols-[250px_1fr] gap-6 h-full">
      {/* Coluna da esquerda - Lista de entidades */}
      <div className="h-full overflow-auto">
        <EntityList
          entities={entities || []}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
        />
      </div>

      {/* Coluna da direita - Área de edição */}
      <div className="flex flex-col gap-6 h-full">
        <div className={cn(
          "flex-1 overflow-auto",
          !selectedEntityId && "flex items-center justify-center text-muted-foreground"
        )}>
          {selectedEntityId ? (
            <CustomFieldDropZone
              stageId={selectedEntityId}
              fields={stagedFields[selectedEntityId] || []}
              onEditField={(field) => {
                console.log('✏️ Editing field:', field);
              }}
              onSave={handleSave}
              hasChanges={stagedFields[selectedEntityId]?.length > 0}
            />
          ) : (
            <p>Selecione uma entidade para começar a editar seus campos</p>
          )}
        </div>
        
        {selectedEntityId && <FieldTypesHeader />}
      </div>
    </div>
  );
}