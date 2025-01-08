import { Droppable } from "@hello-pangea/dnd";
import { CustomField } from "../types";
import { FieldCard } from "./FieldCard";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlignJustify, Eye, Grid, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { FormPreviewDialog } from "./FormPreviewDialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CustomFieldDropZoneProps {
  stageId: string;
  fields: CustomField[];
  onEditField: (field: CustomField) => void;
  onSave?: () => void;
  hasChanges?: boolean;
}

export function CustomFieldDropZone({ 
  stageId, 
  fields, 
  onEditField,
  onSave,
  hasChanges 
}: CustomFieldDropZoneProps) {
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const handleLayoutChange = async (fieldId: string, layoutConfig: any) => {
    try {
      const { error } = await supabase
        .from('entity_fields')
        .update({ layout_config: layoutConfig })
        .eq('id', fieldId);

      if (error) throw error;

      toast.success('Layout atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar layout:', error);
      toast.error('Erro ao atualizar layout');
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
          <ToggleGroup type="single" value={layout} onValueChange={(value: "vertical" | "horizontal") => setLayout(value)}>
            <ToggleGroupItem value="vertical" aria-label="Layout Vertical">
              <AlignJustify className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="horizontal" aria-label="Layout Horizontal">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>

          {hasChanges && onSave && (
            <Button 
              onClick={onSave}
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Alterações
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
              <div className={cn(
                "space-y-2",
                layout === "horizontal" && "grid grid-cols-2 gap-2 space-y-0"
              )}>
                {fields.map((field, index) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    index={index}
                    onEdit={() => onEditField(field)}
                    onLayoutChange={(layoutConfig) => handleLayoutChange(field.id, layoutConfig)}
                  />
                ))}
                {fields.length === 0 && !snapshot.isDraggingOver && (
                  <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-muted/50">
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
    </Card>
  );
}