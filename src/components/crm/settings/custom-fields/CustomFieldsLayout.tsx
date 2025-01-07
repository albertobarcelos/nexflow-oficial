import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { CustomField } from "./types";
import { toast } from "sonner";
import { fieldTypes } from "./data/fieldTypes";
import { FieldTypesHeader } from "./components/FieldTypesHeader";
import { CustomFieldDropZone } from "./components/CustomFieldDropZone";

export function CustomFieldsLayout() {
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({
    "entity-fields": []
  });

  console.log('🔄 CustomFieldsLayout render:', {
    stagedFields,
    fieldsCount: stagedFields["entity-fields"].length
  });

  const handleDragEnd = (result: DropResult) => {
    console.log('🎯 handleDragEnd called with:', result);
    
    const { source, destination, draggableId } = result;
    
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

      console.log('✨ Found field type:', fieldType);

      const newField: CustomField = {
        id: crypto.randomUUID(),
        name: fieldType.name,
        field_type: fieldType.id,
        description: fieldType.description,
        is_required: false,
        order_index: stagedFields["entity-fields"].length,
        client_id: "",
        pipeline_id: "entity-fields",
        stage_id: "entity-fields",
        options: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✨ Creating new field:', newField);

      setStagedFields(prev => {
        const updatedFields = {
          ...prev,
          "entity-fields": [...prev["entity-fields"], newField]
        };
        console.log('📝 Updated staged fields:', updatedFields);
        return updatedFields;
      });

      toast.success("Campo adicionado com sucesso!");
    }
  };

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-6">
          <FieldTypesHeader />
          <CustomFieldDropZone
            stageId="entity-fields"
            fields={stagedFields["entity-fields"]}
            onEditField={(field) => {
              console.log('✏️ Editing field:', field);
            }}
          />
        </div>
      </DragDropContext>
    </div>
  );
}