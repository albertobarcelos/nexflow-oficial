import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { PipelineFieldsEditor } from "./PipelineFieldsEditor";
import { CustomField } from "./types";

export function CustomFieldsLayout() {
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
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
    // You can add additional logic here if needed
  };

  const handleEditField = (field: CustomField) => {
    // Handle editing a field
    console.log('Editing field:', field);
  };

  const handleDuplicate = (field: CustomField) => {
    // Handle duplicating a field
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