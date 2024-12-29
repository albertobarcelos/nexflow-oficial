import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { PipelineFieldsEditor } from "./PipelineFieldsEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CustomField, FieldType } from "./types";
import { EditFieldDialog } from "./components/EditFieldDialog";
import { FieldConfigurationManager } from "./components/FieldConfigurationManager";

export function CustomFieldsLayout() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    const fetchClientId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (collaborator) {
        setClientId(collaborator.client_id);
      }
    };

    fetchClientId();
  }, []);

  const handleSave = async () => {
    try {
      if (!clientId) throw new Error('Client ID not found');

      for (const stageId in stagedFields) {
        const fields = stagedFields[stageId];
        for (const field of fields) {
          const { error } = await supabase
            .from('custom_fields')
            .insert({
              ...field,
              client_id: clientId,
              pipeline_id: field.pipeline_id,
              stage_id: field.stage_id,
              field_type: field.field_type
            });
          
          if (error) throw error;
        }
      }

      toast({
        title: "Alterações salvas",
        description: "Suas alterações foram salvas com sucesso.",
      });
      setHasChanges(false);
      setStagedFields({});
    } catch (error) {
      console.error('Error saving custom fields:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  const handleRevert = () => {
    setStagedFields({});
    toast({
      title: "Alterações revertidas",
      description: "Suas alterações foram desfeitas.",
    });
    setHasChanges(false);
  };

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
          user_id: "current_user_id" // Substituir pelo ID do usuário atual
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
    const duplicatedField: CustomField =  {
      ...field,
      id: `temp-${Date.now()}`,
      name: `${field.name} (cópia)`,
      history: [{
        timestamp: new Date().toISOString(),
        action: "created",
        user_id: "current_user_id" // Substituir pelo ID do usuário atual
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
    toast({
      title: "Campo duplicado",
      description: "O campo foi duplicado com sucesso."
    });
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
    // Agrupa os campos importados por stage_id
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Personalização de Campos</h1>
          <p className="text-muted-foreground">
            Personalize os campos do seu CRM de acordo com suas necessidades
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleRevert}>
              <Undo2 className="w-4 h-4 mr-2" />
              Reverter
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <FieldConfigurationManager
        fields={Object.values(stagedFields).flat()}
        onImport={handleImportConfiguration}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-[300px_1fr] gap-6">
          <FieldTypesSidebar />
          <PipelineFieldsEditor 
            stagedFields={stagedFields}
            onChange={() => setHasChanges(true)}
            onEditField={handleEditField}
            onDuplicate={handleDuplicateField}
            onReorder={handleReorderFields}
          />
        </div>
      </DragDropContext>

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