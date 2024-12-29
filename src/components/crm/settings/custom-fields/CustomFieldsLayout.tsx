import { useState } from "react";
import { DragDropContext } from '@hello-pangea/dnd';
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { PipelineFieldsEditor } from "./PipelineFieldsEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CustomField } from "./types";

export function CustomFieldsLayout() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});

  const handleSave = async () => {
    try {
      // Inserir todos os campos staged no Supabase
      for (const stageId in stagedFields) {
        const fields = stagedFields[stageId];
        for (const field of fields) {
          const { error } = await supabase
            .from('custom_fields')
            .insert(field);
          
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

    // Se o destino for o mesmo que a origem, não faz nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const stageId = destination.droppableId;
    
    // Atualiza o estado local com o novo campo
    setStagedFields(prev => {
      const stageFields = [...(prev[stageId] || [])];
      
      // Adiciona o novo campo no índice correto
      const newField: CustomField = {
        id: `temp-${Date.now()}`, // ID temporário
        field_type: draggableId,
        name: `Novo campo ${draggableId}`,
        order_index: destination.index,
        stage_id: stageId,
        pipeline_id: '', // Será preenchido ao salvar
        client_id: '', // Será preenchido ao salvar
        options: []
      };

      stageFields.splice(destination.index, 0, newField);

      return {
        ...prev,
        [stageId]: stageFields
      };
    });

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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-[300px_1fr] gap-6">
          <FieldTypesSidebar />
          <PipelineFieldsEditor 
            stagedFields={stagedFields}
            onChange={() => setHasChanges(true)} 
          />
        </div>
      </DragDropContext>
    </div>
  );
}