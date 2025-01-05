import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { CustomFieldDropZone } from "./components/CustomFieldDropZone";
import { CustomField } from "./types";
import { toast } from "sonner";
import { fieldTypes } from "./data/fieldTypes";

export function CustomFieldsLayout() {
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});

  useEffect(() => {
    console.log('🔄 stagedFields changed:', {
      stagedFields,
      entityFields: stagedFields["entity-fields"],
      fieldsLength: stagedFields["entity-fields"]?.length || 0
    });
  }, [stagedFields]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    console.log('🎯 Drag ended:', { source, destination, draggableId });
    
    // Se não houver destino, o usuário soltou fora da área válida
    if (!destination) {
      console.log('❌ No destination, drag cancelled');
      return;
    }

    // Se a origem for a lista de tipos de campo
    if (source.droppableId === 'field-types') {
      console.log('🎯 Dragging from field types list');
      const fieldType = fieldTypes.find(f => f.id === draggableId);
      
      if (!fieldType) {
        console.error('❌ Field type not found:', draggableId);
        return;
      }

      // Criar novo campo com ID único
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

      // Atualizar estado com o novo campo
      setStagedFields(prev => {
        const existingFields = prev[destination.droppableId] || [];
        const updatedFields = {
          ...prev,
          [destination.droppableId]: [...existingFields, newField]
        };
        console.log('📝 Updated staged fields:', updatedFields);
        return updatedFields;
      });

      toast.success("Campo adicionado com sucesso!");
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[300px_1fr] gap-6 w-full h-full">
          <div className="h-full overflow-hidden">
            <FieldTypesSidebar />
          </div>
          <div className="h-full overflow-hidden">
            <CustomFieldDropZone
              stageId="entity-fields"
              fields={stagedFields["entity-fields"] || []}
              onEditField={(field) => {
                console.log('✏️ Editing field:', field);
              }}
            />
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}