import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { EntityField } from "../../types";
import { StageDropZone } from "./StageDropZone";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { fieldTypes } from "../../../custom-fields/data/fieldTypes";
import { FieldTypesSidebar } from "../../../custom-fields/FieldTypesSidebar";

interface EntityFieldEditorProps {
  fields: EntityField[];
  onChange: (fields: EntityField[]) => void;
  currentEntityId: string;
  entities: Entity[];
}

export function EntityFieldEditor({ 
  fields, 
  onChange, 
  currentEntityId, 
  entities 
}: EntityFieldEditorProps) {
  const [stagedFields, setStagedFields] = useState<EntityField[]>(fields);
  const [hasChanges, setHasChanges] = useState(false);
  const stagingBatch = uuidv4();

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;

    // Se o drag veio da lista de tipos de campo
    if (source.droppableId === 'field-types') {
      const fieldType = fieldTypes.find(f => f.id === draggableId);
      if (!fieldType) return;

      // Criar novo campo baseado no tipo arrastado
      const newField: EntityField = {
        id: uuidv4(),
        name: fieldType.name,
        field_type: fieldType.id,
        description: fieldType.description,
        is_required: false,
        order_index: stagedFields.length,
        client_id: "", // Será preenchido no backend
        entity_id: currentEntityId,
        options: [],
        validation_rules: {},
        is_staged: true,
        staging_batch: stagingBatch,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedFields = [...stagedFields, newField];
      setStagedFields(updatedFields);
      setHasChanges(true);
      toast.success("Campo adicionado com sucesso!");
      return;
    }

    // Reordenação normal dos campos existentes
    const items = Array.from(stagedFields);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    // Update order_index for all fields
    const updatedFields = items.map((field, index) => ({
      ...field,
      order_index: index
    }));

    setStagedFields(updatedFields);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Primeiro, vamos buscar o client_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      // Preparar os campos para inserção
      const fieldsToInsert = stagedFields
        .filter(field => field.is_staged)
        .map(field => ({
          ...field,
          client_id: collaborator.client_id,
          is_staged: false,
          staging_batch: null
        }));

      // Inserir os campos no banco
      const { error } = await supabase
        .from('entity_fields')
        .insert(fieldsToInsert);

      if (error) throw error;

      toast.success("Campos salvos com sucesso!");
      setHasChanges(false);
      onChange(stagedFields);
    } catch (error) {
      console.error('Error saving fields:', error);
      toast.error("Erro ao salvar os campos");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center sticky top-0 bg-background z-10 pb-4">
        <h3 className="text-lg font-medium">Estrutura da Entidade</h3>
        {hasChanges && (
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        <FieldTypesSidebar />
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <StageDropZone
            stageId="entity-fields"
            fields={stagedFields}
            onEditField={(field) => {
              console.log('Editar campo:', field);
            }}
          />
        </DragDropContext>
      </div>
    </div>
  );
}