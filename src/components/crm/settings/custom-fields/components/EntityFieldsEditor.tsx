import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { EntityField } from "../types";
import { CustomFieldDropZone } from "./CustomFieldDropZone";
import { useState } from "react";
import { AddFieldDialog } from "./AddFieldDialog";

interface EntityFieldsEditorProps {
  selectedEntityId: string | null;
  stagedFields: Record<string, EntityField[]>;
  setStagedFields: (fields: Record<string, EntityField[]>) => void;
  onSave: () => Promise<void>;
  onDeleteField: (fieldId: string) => void;
}

export function EntityFieldsEditor({ 
  selectedEntityId, 
  stagedFields, 
  setStagedFields,
  onSave,
  onDeleteField
}: EntityFieldsEditorProps) {
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedEntityId) return;

    const currentFields = stagedFields[selectedEntityId] || [];
    const items = Array.from(currentFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedFields = items.map((field, index) => ({
      ...field,
      order_index: index
    }));

    setStagedFields({
      ...stagedFields,
      [selectedEntityId]: updatedFields
    });
  };

  const handleAddField = (newField: EntityField) => {
    if (!selectedEntityId) return;
    
    const currentFields = stagedFields[selectedEntityId] || [];
    newField.order_index = currentFields.length;
    
    setStagedFields({
      ...stagedFields,
      [selectedEntityId]: [...currentFields, newField]
    });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <AnimatePresence>
        {selectedEntityId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Button
              onClick={() => setIsAddFieldOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Campo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-h-0">
        {selectedEntityId ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <CustomFieldDropZone
              stageId={selectedEntityId}
              fields={stagedFields[selectedEntityId] || []}
              onEditField={(field) => {
                console.log('✏️ Editing field:', field);
              }}
              onDeleteField={onDeleteField}
              onSave={onSave}
              hasChanges={stagedFields[selectedEntityId]?.length > 0}
            />
          </DragDropContext>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground h-full">
            <p>Selecione uma entidade para começar a editar seus campos</p>
          </div>
        )}
      </div>

      <AddFieldDialog
        open={isAddFieldOpen}
        onOpenChange={setIsAddFieldOpen}
        selectedEntityId={selectedEntityId!}
        onAddField={handleAddField}
      />
    </div>
  );
}