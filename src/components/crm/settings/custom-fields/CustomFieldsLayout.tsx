import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { CustomFieldDropZone } from "./components/CustomFieldDropZone";
import { CustomField } from "./types";
import { toast } from "sonner";
import { fieldTypes } from "./data/fieldTypes";

export function CustomFieldsLayout() {
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    console.log('🔄 Drag ended:', { source, destination, draggableId });
    console.log('📦 Current staged fields:', stagedFields);
    
    // Se não houver destino, retorna
    if (!destination) {
      console.log('❌ No destination, drag cancelled');
      return;
    }

    // Se o drag veio da lista de tipos de campo
    if (source.droppableId === 'field-types') {
      console.log('🎯 Dragging from field types list');
      const fieldType = fieldTypes.find(f => f.id === draggableId);
      if (!fieldType) {
        console.error('❌ Field type not found:', draggableId);
        return;
      }

      // Criar novo campo baseado no tipo arrastado
      const newField: CustomField = {
        id: crypto.randomUUID(),
        name: fieldType.name,
        field_type: fieldType.id,
        description: fieldType.description,
        is_required: false,
        order_index: (stagedFields[destination.droppableId] || []).length,
        client_id: "", // Será preenchido no backend
        pipeline_id: destination.droppableId,
        stage_id: destination.droppableId,
        options: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✨ Creating new field:', newField);

      // Adicionar o novo campo ao destino
      setStagedFields(prev => {
        const updatedFields = {
          ...prev,
          [destination.droppableId]: [
            ...(prev[destination.droppableId] || []),
            newField
          ]
        };
        console.log('📝 Updated staged fields:', updatedFields);
        return updatedFields;
      });

      toast.success("Campo adicionado com sucesso!");
      return;
    }

    // Reordenação normal dos campos existentes
    console.log('🔄 Reordering existing fields');
    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;

    const sourceFields = [...(stagedFields[sourceStageId] || [])];
    const destFields = sourceStageId === destStageId ? sourceFields : [...(stagedFields[destStageId] || [])];

    const [movedField] = sourceFields.splice(source.index, 1);
    destFields.splice(destination.index, 0, movedField);

    setStagedFields({
      ...stagedFields,
      [sourceStageId]: sourceFields,
      [destStageId]: destFields,
    });
  };

  const handleEditField = (field: CustomField) => {
    console.log('✏️ Editing field:', field);
  };

  return (
    <div className="grid grid-cols-[300px_1fr] gap-6 h-[calc(100vh-200px)]">
      <FieldTypesSidebar />
      <DragDropContext onDragEnd={handleDragEnd}>
        <CustomFieldDropZone
          stageId="entity-fields"
          fields={stagedFields["entity-fields"] || []}
          onEditField={handleEditField}
        />
      </DragDropContext>
    </div>
  );
}