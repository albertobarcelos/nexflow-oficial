import { Droppable } from "@hello-pangea/dnd";
import { CustomField, EntityField } from "../types";
import { FieldCard } from "./FieldCard";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid, Plus, Save, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { FormPreviewDialog } from "./FormPreviewDialog";
import { toast } from "sonner";
import { EditFieldDialog } from "./EditFieldDialog";

interface CustomFieldDropZoneProps {
  stageId: string;
  fields: (CustomField | EntityField)[];
  onEditField: (field: CustomField | EntityField) => void;
  onDeleteField: (fieldId: string) => void;
  onSave: () => Promise<void>;
  hasChanges?: boolean;
  onAddField?: () => void;
}

export function CustomFieldDropZone({ 
  stageId, 
  fields, 
  onEditField,
  onDeleteField,
  onSave,
  hasChanges,
  onAddField
}: CustomFieldDropZoneProps) {
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | EntityField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleLayoutChange = async (fieldId: string, layoutConfig: any) => {
    try {
      const fieldToUpdate = fields.find(f => f.id === fieldId);
      if (fieldToUpdate) {
        onEditField({
          ...fieldToUpdate,
          layout_config: layoutConfig
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar layout:', error);
      toast.error('Erro ao atualizar layout');
    }
  };

  const handleDeleteField = (fieldId: string) => {
    onDeleteField(fieldId);
    toast.success('Campo removido. Clique em "Salvar Alterações" para confirmar.');
  };

  const handleEditField = (updatedField: CustomField | EntityField) => {
    try {
      onEditField(updatedField);
      toast.success('Campo atualizado. Clique em "Salvar Alterações" para confirmar.');
    } catch (error) {
      console.error('Erro ao atualizar campo:', error);
      toast.error('Erro ao atualizar campo');
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="py-2.5 px-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium leading-none mb-1">Estrutura da Entidade</h3>
          <p className="text-xs text-muted-foreground">
            Arraste os campos para organizar a estrutura do formulário
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onAddField && (
            <Button
              onClick={onAddField}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Campo
            </Button>
          )}

          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="gap-2"
          >
            <Grid className="h-4 w-4" />
            Preview
          </Button>

          {hasChanges && (
            <Button 
              onClick={handleSave}
              size="sm"
              className="gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Droppable droppableId={stageId} type="FIELD">
        {(provided, snapshot) => (
          <ScrollArea className="flex-1">
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "p-4 min-h-[calc(100vh-15rem)]",
                snapshot.isDraggingOver && "bg-primary/5"
              )}
            >
              <div className="flex flex-wrap gap-4">
                {fields.map((field, index) => {
                  const width = field.layout_config?.width || 'full';
                  const widthClass = width === 'full' ? 'w-full' : width === 'half' ? 'w-[calc(50%-0.5rem)]' : 'w-[calc(33.33%-0.67rem)]';
                  
                  return (
                    <div key={field.id} className={cn(widthClass, "transition-all duration-200")}>
                      <FieldCard
                        field={field}
                        index={index}
                        onEdit={() => setEditingField(field)}
                        onDelete={() => handleDeleteField(field.id)}
                        onLayoutChange={(config) => handleLayoutChange(field.id, config)}
                      />
                    </div>
                  );
                })}
                {fields.length === 0 && !snapshot.isDraggingOver && (
                  <div className="flex h-[200px] w-full items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      Arraste os tipos de campo acima para começar a montar a estrutura
                    </p>
                  </div>
                )}
                {provided.placeholder}
              </div>
            </div>
          </ScrollArea>
        )}
      </Droppable>

      <FormPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        fields={fields}
        layout={layout}
      />

      <EditFieldDialog
        field={editingField}
        open={!!editingField}
        onOpenChange={(open) => !open && setEditingField(null)}
        onSave={handleEditField}
      />
    </Card>
  );
}
