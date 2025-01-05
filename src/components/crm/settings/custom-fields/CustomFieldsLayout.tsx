import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { CustomFieldDropZone } from "./components/CustomFieldDropZone";
import { CustomField } from "./types";
import { toast } from "sonner";
import { fieldTypes } from "./data/fieldTypes";

export function CustomFieldsLayout() {
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({
    "entity-fields": []
  });

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    console.log('🎯 Drag ended:', { source, destination, draggableId });
    
    if (!destination) {
      console.log('❌ No destination, drag cancelled');
      return;
    }

    if (source.droppableId === 'field-types') {
      console.log('🎯 Dragging from field types list');
      const fieldType = fieldTypes.find(f => f.id === draggableId);
      
      if (!fieldType) {
        console.error('❌ Field type not found:', draggableId);
        return;
      }

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
    <div className="h-[calc(100vh-200px)]">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[300px_1fr] gap-6 h-full">
          <div className="h-full">
            <FieldTypesSidebar />
          </div>
          <div className="h-full">
            <CustomFieldDropZone
              stageId="entity-fields"
              fields={stagedFields["entity-fields"]}
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