import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { EntityField, Entity } from "../../entities/types";
import { FieldTypesSidebar } from "../FieldTypesSidebar";
import { StageDropZone } from "./StageDropZone";
import { toast } from "sonner";

interface EntityFieldEditorProps {
  fields: EntityField[];
  onChange: (fields: EntityField[]) => void;
  currentEntityId: string;
  entities: Entity[];
}

export function EntityFieldEditor({ fields, onChange, currentEntityId, entities }: EntityFieldEditorProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Se o drag veio da lista de tipos de campo
    if (source.droppableId === 'field-types') {
      // Criar novo campo baseado no tipo arrastado
      const newField: EntityField = {
        id: crypto.randomUUID(),
        name: "",
        field_type: draggableId,
        is_required: false,
        order_index: fields.length,
        client_id: "", // Será preenchido no backend
        entity_id: currentEntityId,
        options: [],
        validation_rules: {}
      };
      
      onChange([...fields, newField]);
      toast.success("Campo adicionado com sucesso!");
      return;
    }

    // Reordenação normal dos campos existentes
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    // Update order_index for all fields
    const updatedFields = items.map((field, index) => ({
      ...field,
      order_index: index
    }));

    onChange(updatedFields);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-[300px_1fr] gap-6">
        <FieldTypesSidebar />
        <StageDropZone
          stageId={currentEntityId}
          fields={fields}
          onEditField={(field) => {
            // Implementar edição do campo aqui
            console.log('Editar campo:', field);
          }}
        />
      </div>
    </DragDropContext>
  );
}