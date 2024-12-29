import { useState, useEffect } from "react";
import { DragDropContext } from '@hello-pangea/dnd';
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { PipelineFieldsEditor } from "./PipelineFieldsEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CustomField } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomFieldsLayout() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSave = async () => {
    try {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      // Inserir todos os campos staged no Supabase
      for (const stageId in stagedFields) {
        const fields = stagedFields[stageId];
        for (const field of fields) {
          const { error } = await supabase
            .from('custom_fields')
            .insert({
              ...field,
              client_id: collaborator.client_id
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

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

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
        field_type: draggableId,
        name: `Novo campo ${draggableId}`,
        order_index: destination.index,
        stage_id: stageId,
        pipeline_id: '',
        client_id: '',
        options: []
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

  const handleSaveFieldEdit = () => {
    if (!editingField) return;

    setStagedFields(prev => {
      const newStagedFields = { ...prev };
      const stageFields = newStagedFields[editingField.stage_id || ''] || [];
      const fieldIndex = stageFields.findIndex(f => f.id === editingField.id);

      if (fieldIndex !== -1) {
        stageFields[fieldIndex] = editingField;
      }

      return newStagedFields;
    });

    setIsEditDialogOpen(false);
    setEditingField(null);
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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-[300px_1fr] gap-6">
          <FieldTypesSidebar />
          <PipelineFieldsEditor 
            stagedFields={stagedFields}
            onChange={() => setHasChanges(true)}
            onEditField={handleEditField}
          />
        </div>
      </DragDropContext>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Campo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Nome do Campo</Label>
              <Input
                id="fieldName"
                value={editingField?.name || ''}
                onChange={(e) => setEditingField(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldDescription">Descrição</Label>
              <Input
                id="fieldDescription"
                value={editingField?.description || ''}
                onChange={(e) => setEditingField(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="isRequired">Campo Obrigatório</Label>
              <input
                type="checkbox"
                id="isRequired"
                checked={editingField?.is_required || false}
                onChange={(e) => setEditingField(prev => prev ? { ...prev, is_required: e.target.checked } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFieldEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}