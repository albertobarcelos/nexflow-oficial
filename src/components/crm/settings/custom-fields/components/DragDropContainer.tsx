// import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { FieldTypesSidebar } from "../FieldTypesSidebar";
import { PipelineFieldsEditor } from "../PipelineFieldsEditor";
import { CustomField } from "../types";

interface DragDropContainerProps {
  stagedFields: Record<string, CustomField[]>;
  onDragEnd: (result: DropResult) => void;
  onChange: () => void;
  onEditField: (field: CustomField) => void;
  onDuplicate: (field: CustomField) => void;
  onReorder: (stageId: string, reorderedFields: CustomField[]) => void;
}

export function DragDropContainer({
  stagedFields,
  onDragEnd,
  onChange,
  onEditField,
  onDuplicate,
  onReorder
}: DragDropContainerProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-[300px_1fr] gap-6">
        <FieldTypesSidebar />
        <PipelineFieldsEditor 
          stagedFields={stagedFields}
          onChange={onChange}
          onEditField={onEditField}
          onDuplicate={onDuplicate}
          onReorder={onReorder}
        />
      </div>
    </DragDropContext>
  );
}
