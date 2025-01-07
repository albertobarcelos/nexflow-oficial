import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { CustomField } from "./types";
import { toast } from "sonner";
import { fieldTypes } from "./data/fieldTypes";
import { FieldTypesHeader } from "./components/FieldTypesHeader";
import { CustomFieldDropZone } from "./components/CustomFieldDropZone";
import { EntityList } from "../entities/components/EntityList";
import { Entity } from "../entities/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateEntityDialog } from "../entities/components/CreateEntityDialog";

export function CustomFieldsLayout() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({
    "entity-fields": []
  });

  const { data: entities } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_entities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Entity[];
    }
  });

  const handleDragEnd = (result: DropResult) => {
    console.log('🎯 handleDragEnd called with:', result);
    
    const { source, destination, draggableId } = result;
    
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
    <div className="grid grid-cols-[250px_1fr] gap-6 h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            size="sm" 
            onClick={() => setIsDialogOpen(true)}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Entidade
          </Button>
        </div>

        <EntityList
          entities={entities || []}
          selectedEntityId={selectedEntityId}
          onSelectEntity={setSelectedEntityId}
        />

        <CreateEntityDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>

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
    </div>
  );
}