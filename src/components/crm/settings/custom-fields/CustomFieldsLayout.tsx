import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { CustomField } from "./types";
import { toast } from "sonner";
import { fieldTypes } from "./data/fieldTypes";
import { CustomFieldDropZone } from "./components/CustomFieldDropZone";
import { EntityList } from "../entities/components/EntityList";
import { Entity } from "../entities/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function CustomFieldsLayout() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: entities, refetch } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data, error } = await supabase
        .from('custom_entities')
        .select(`
          *,
          entity_fields!entity_fields_entity_id_fkey(*)
        `)
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Entity[];
    }
  });

  const handleSelectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    const entity = entities?.find(e => e.id === entityId);
    if (entity?.entity_fields) {
      const mappedFields: CustomField[] = entity.entity_fields.map(field => ({
        id: field.id,
        name: field.name,
        field_type: field.field_type as CustomField['field_type'],
        description: field.description,
        is_required: field.is_required,
        order_index: field.order_index,
        client_id: field.client_id,
        pipeline_id: entityId,
        stage_id: entityId,
        options: field.options || [],
        created_at: field.created_at || new Date().toISOString(),
        updated_at: field.updated_at || new Date().toISOString()
      }));

      setStagedFields({
        [entityId]: mappedFields
      });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination || !selectedEntityId) return;

    const currentFields = stagedFields[selectedEntityId] || [];

    if (source.droppableId === 'field-types') {
      const fieldType = fieldTypes.find(f => f.id === draggableId);
      if (!fieldType) return;

      const newField: CustomField = {
        id: crypto.randomUUID(),
        name: fieldType.name,
        field_type: fieldType.id,
        description: fieldType.description,
        is_required: false,
        order_index: currentFields.length,
        client_id: "",
        pipeline_id: selectedEntityId,
        stage_id: selectedEntityId,
        options: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setStagedFields(prev => ({
        ...prev,
        [selectedEntityId]: [...currentFields, newField]
      }));

      toast.success("Campo adicionado com sucesso!");
    } else {
      // Reordenação de campos existentes
      const items = Array.from(currentFields);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const updatedFields = items.map((field, index) => ({
        ...field,
        order_index: index
      }));

      setStagedFields(prev => ({
        ...prev,
        [selectedEntityId]: updatedFields
      }));
    }
  };

  const handleSave = async () => {
    if (!selectedEntityId) return;
    
    try {
      const { error } = await supabase
        .from('entity_fields')
        .upsert(
          stagedFields[selectedEntityId].map(field => ({
            ...field,
            entity_id: selectedEntityId
          }))
        );

      if (error) throw error;
      
      toast.success("Alterações salvas com sucesso!");
      await refetch();
    } catch (error) {
      console.error('Error saving fields:', error);
      toast.error("Erro ao salvar alterações");
    }
  };

  const filteredFieldTypes = fieldTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-[250px_1fr] gap-4 h-full">
      {/* Lista de entidades */}
      <Card className="p-4 overflow-auto border-primary/10">
        <EntityList
          entities={entities || []}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
        />
      </Card>

      {/* Área de edição */}
      <div className="flex flex-col gap-4 h-full">
        <AnimatePresence>
          {selectedEntityId && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between gap-4"
            >
              <Button
                onClick={() => setIsAddFieldOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Campo
              </Button>

              <Button
                onClick={handleSave}
                variant="default"
                className="gap-2"
                disabled={!stagedFields[selectedEntityId]?.length}
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "flex-1 min-h-0",
          !selectedEntityId && "flex items-center justify-center text-muted-foreground"
        )}>
          {selectedEntityId ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <CustomFieldDropZone
                stageId={selectedEntityId}
                fields={stagedFields[selectedEntityId] || []}
                onEditField={(field) => {
                  console.log('✏️ Editing field:', field);
                }}
                onSave={handleSave}
                hasChanges={stagedFields[selectedEntityId]?.length > 0}
              />
            </DragDropContext>
          ) : (
            <p>Selecione uma entidade para começar a editar seus campos</p>
          )}
        </div>
      </div>

      {/* Modal de Adicionar Campo */}
      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Campo</DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar tipo de campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-2 gap-4 p-4">
              {filteredFieldTypes.map((fieldType) => (
                <Card
                  key={fieldType.id}
                  className="p-4 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => {
                    if (!selectedEntityId) return;
                    
                    const newField: CustomField = {
                      id: crypto.randomUUID(),
                      name: fieldType.name,
                      field_type: fieldType.id,
                      description: fieldType.description,
                      is_required: false,
                      order_index: (stagedFields[selectedEntityId] || []).length,
                      client_id: "",
                      pipeline_id: selectedEntityId,
                      stage_id: selectedEntityId,
                      options: [],
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };

                    setStagedFields(prev => ({
                      ...prev,
                      [selectedEntityId]: [...(prev[selectedEntityId] || []), newField]
                    }));

                    setIsAddFieldOpen(false);
                    toast.success("Campo adicionado com sucesso!");
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/5">
                      {fieldType.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{fieldType.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {fieldType.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}