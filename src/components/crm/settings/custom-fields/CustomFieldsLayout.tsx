import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { PipelineFieldsEditor } from "./PipelineFieldsEditor";
import { CustomField } from "./types";
import { toast } from "sonner";
import { fieldTypes } from "./data/fieldTypes";

export function CustomFieldsLayout() {
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Se não houver destino, retorna
    if (!destination) return;

    // Se o drag veio da lista de tipos de campo
    if (source.droppableId === 'field-types') {
      const fieldType = fieldTypes.find(f => f.id === draggableId);
      if (!fieldType) return;

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

      // Adicionar o novo campo ao destino
      setStagedFields(prev => ({
        ...prev,
        [destination.droppableId]: [
          ...(prev[destination.droppableId] || []),
          newField
        ]
      }));

      toast.success("Campo adicionado com sucesso!");
      return;
    }

    // Reordenação normal dos campos existentes
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

  const handleFieldsChange = () => {
    // This function will be called when fields change in PipelineFieldsEditor
  };

  const handleEditField = (field: CustomField) => {
    console.log('Editing field:', field);
  };

  const handleDuplicate = (field: CustomField) => {
    console.log('Duplicating field:', field);
  };

  const handleReorder = (stageId: string, reorderedFields: CustomField[]) => {
    setStagedFields(prev => ({
      ...prev,
      [stageId]: reorderedFields
    }));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-[300px_1fr] gap-6 h-[calc(100vh-200px)]">
        <FieldTypesSidebar />
        <PipelineFieldsEditor 
          stagedFields={stagedFields}
          onChange={handleFieldsChange}
          onEditField={handleEditField}
          onDuplicate={handleDuplicate}
          onReorder={handleReorder}
        />
      </div>
    </DragDropContext>
  );
}