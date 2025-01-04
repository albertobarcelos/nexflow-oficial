import { useState } from "react";
import { DropResult } from '@hello-pangea/dnd';
import { CustomField, FieldType } from "./types";
import { EditFieldDialog } from "./components/EditFieldDialog";
import { FieldConfigurationManager } from "./components/FieldConfigurationManager";
import { useCustomFields } from "./hooks/useCustomFields";
import { CustomFieldsHeader } from "./components/CustomFieldsHeader";
import { DragDropContainer } from "./components/DragDropContainer";

export function CustomFieldsLayout() {
  const {
    hasChanges,
    setHasChanges,
    stagedFields,
    setStagedFields,
    clientId,
    handleSave,
    handleRevert
  } = useCustomFields();

  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !clientId) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const stageId = destination.droppableId;
    
    setStagedFields(prev => {
      const stageFields = [...(prev[stageId] || [])];
      
      const newField: CustomField = {
        id: `temp-${Date.now()}`,
        client_id: clientId,
        field_type: draggableId as FieldType,
        name: `Novo campo ${draggableId}`,
        order_index: destination.index,
        stage_id: stageId,
        pipeline_id: '',
        options: [],
        history: [{
          timestamp: new Date().toISOString(),
          action: "created",
          user_id: "current_user_id"
        }]
      };

      stageFields.splice(destination.index, 0, newField);
      setEditingField(newField);
      setIsEditDialogOpen(true);

      return {
        ...prev,
        [stageId]: stageFields
      };
    });

    setHasChanges(true);
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setIsEditDialogOpen(true);
  };

  const handleSaveFieldEdit = (editedField: CustomField) => {
    if (!editedField) return;

    setStagedFields(prev => {
      const newStagedFields = { ...prev };
      const stageFields = newStagedFields[editedField.stage_id] || [];
      const fieldIndex = stageFields.findIndex(f => f.id === editedField.id);

      if (fieldIndex !== -1) {
        stageFields[fieldIndex] = editedField;
      }

      return newStagedFields;
    });

    setIsEditDialogOpen(false);
    setEditingField(null);
    setHasChanges(true);
  };

  const handleDuplicateField = (field: CustomField) => {
    const duplicatedField: CustomField = {
      ...field,
      id: `temp-${Date.now()}`,
      name: `${field.name} (cópia)`,
      history: [{
        timestamp: new Date().toISOString(),
        action: "created",
        user_id: "current_user_id"
      }]
    };

    setStagedFields(prev => {
      const stageFields = [...(prev[field.stage_id] || [])];
      const originalIndex = stageFields.findIndex(f => f.id === field.id);
      stageFields.splice(originalIndex + 1, 0, duplicatedField);

      return {
        ...prev,
        [field.stage_id]: stageFields
      };
    });

    setHasChanges(true);
  };

  const handleReorderFields = (stageId: string, reorderedFields: CustomField[]) => {
    setStagedFields(prev => ({
      ...prev,
      [stageId]: reorderedFields.map((field, index) => ({
        ...field,
        order_index: index
      }))
    }));
    setHasChanges(true);
  };

  const handleImportConfiguration = (importedFields: CustomField[]) => {
    const groupedFields = importedFields.reduce((acc, field) => {
      const stageFields = acc[field.stage_id] || [];
      return {
        ...acc,
        [field.stage_id]: [...stageFields, field]
      };
    }, {} as Record<string, CustomField[]>);

    setStagedFields(groupedFields);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <CustomFieldsHeader 
        hasChanges={hasChanges}
        onSave={handleSave}
        onRevert={handleRevert}
      />

      <FieldConfigurationManager
        fields={Object.values(stagedFields).flat()}
        onImport={handleImportConfiguration}
      />

      <DragDropContainer
        stagedFields={stagedFields}
        onDragEnd={onDragEnd}
        onChange={() => setHasChanges(true)}
        onEditField={handleEditField}
        onDuplicate={handleDuplicateField}
        onReorder={handleReorderFields}
      />

      <EditFieldDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        field={editingField}
        onSave={handleSaveFieldEdit}
        onDuplicate={handleDuplicateField}
      />
    </div>
  );
}