import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { CustomField, EntityField } from "../types";
import { FieldCard } from "./FieldCard";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid, Plus, Save, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CustomFieldsLayoutProps {
  entityId: string;
  fields: (CustomField | EntityField)[];
  onFieldsChange: (fields: (CustomField | EntityField)[]) => void;
  onAddField?: () => void;
}

export function CustomFieldsLayout({
  entityId,
  fields,
  onFieldsChange,
  onAddField
}: CustomFieldsLayoutProps) {
  const [isSaving, setIsSaving] = useState(false);

  const reorderFields = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    // Cria uma cópia dos campos
    const updatedFields = Array.from(fields);
    const [removed] = updatedFields.splice(sourceIndex, 1);
    updatedFields.splice(destinationIndex, 0, removed);

    // Recalcula os order_index considerando a largura dos campos
    let currentIndex = 0;
    const newFields = updatedFields.map((field, index) => {
      const width = field.layout_config?.width || 'full';
      const isHalfWidth = width === 'half';
      const isThirdWidth = width === 'third';
      
      // Se o campo anterior existe e é half/third, e este também é, mantém o mesmo order_index
      const prevField = index > 0 ? updatedFields[index - 1] : null;
      const prevWidth = prevField?.layout_config?.width || 'full';
      const canShareRow = (isHalfWidth || isThirdWidth) && 
                         (prevWidth === 'half' || prevWidth === 'third') &&
                         getRowSpace(prevWidth) + getRowSpace(width) <= 1;

      if (canShareRow) {
        return {
          ...field,
          order_index: currentIndex - 1
        };
      } else {
        return {
          ...field,
          order_index: currentIndex++
        };
      }
    });

    onFieldsChange(newFields);
  };

  const getRowSpace = (width: string) => {
    switch (width) {
      case 'half':
        return 0.5;
      case 'third':
        return 0.33;
      default:
        return 1;
    }
  };

  const handleLayoutChange = async (fieldId: string, layoutConfig: any) => {
    try {
      const fieldIndex = fields.findIndex(f => f.id === fieldId);
      if (fieldIndex === -1) return;

      const updatedFields = [...fields];
      updatedFields[fieldIndex] = {
        ...updatedFields[fieldIndex],
        layout_config: layoutConfig
      };

      // Recalcula os order_index após mudança de layout
      let currentIndex = 0;
      const newFields = updatedFields.map((field, index) => {
        const width = field.layout_config?.width || 'full';
        const isHalfWidth = width === 'half';
        const isThirdWidth = width === 'third';
        
        const prevField = index > 0 ? updatedFields[index - 1] : null;
        const prevWidth = prevField?.layout_config?.width || 'full';
        const canShareRow = (isHalfWidth || isThirdWidth) && 
                           (prevWidth === 'half' || prevWidth === 'third') &&
                           getRowSpace(prevWidth) + getRowSpace(width) <= 1;

        if (canShareRow) {
          return {
            ...field,
            order_index: currentIndex - 1
          };
        } else {
          return {
            ...field,
            order_index: currentIndex++
          };
        }
      });

      onFieldsChange(newFields);
    } catch (error) {
      console.error('Erro ao atualizar layout:', error);
      toast.error('Erro ao atualizar layout');
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // Atualiza os campos no banco de dados
      const updates = fields.map(field => ({
        id: field.id,
        order_index: field.order_index,
        layout_config: field.layout_config
      }));

      const { error } = await supabase
        .from('entity_fields')
        .upsert(updates, {
          onConflict: 'id'
        });

      if (error) throw error;

      toast.success('Layout salvo com sucesso');
    } catch (error: any) {
      console.error('Erro durante o salvamento:', error);
      toast.error('Erro ao salvar layout: ' + error.message);
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
        </div>
      </div>

      <DragDropContext onDragEnd={reorderFields}>
        <Droppable droppableId="fields">
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
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(widthClass, "transition-all duration-200")}
                          >
                            <FieldCard
                              field={field}
                              onLayoutChange={(config) => handleLayoutChange(field.id, config)}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              </div>
            </ScrollArea>
          )}
        </Droppable>
      </DragDropContext>
    </Card>
  );
} 
