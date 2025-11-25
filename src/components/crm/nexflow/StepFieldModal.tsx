import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useNexflowStepFields } from "@/hooks/useNexflowStepFields";
import {
  NexflowStepField,
  StepFieldType,
} from "@/types/nexflow";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface StepFieldModalProps {
  stepId?: string;
  field?: NexflowStepField;
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StepFieldModal({
  stepId,
  field,
  mode,
  open,
  onOpenChange,
}: StepFieldModalProps) {
  const isEditing = mode === "edit" && Boolean(field);
  const { createField, updateField, isCreating, isUpdating } =
    useNexflowStepFields(stepId);

  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<StepFieldType>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);

  useEffect(() => {
    if (open && isEditing && field) {
      setLabel(field.label);
      setFieldType(field.fieldType);
      setIsRequired(field.isRequired);
      setChecklistItems(field.configuration.items ?? []);
    } else if (open && mode === "create") {
      setLabel("");
      setFieldType("text");
      setIsRequired(false);
      setChecklistItems([]);
    }
  }, [open, mode, field, isEditing]);

  const isChecklist = fieldType === "checklist";

  const handleSave = async () => {
    if (!stepId) {
      toast.error("Selecione uma etapa para adicionar campos.");
      return;
    }

    if (!label.trim()) {
      toast.error("Informe um título para o campo.");
      return;
    }

    const configuration =
      isChecklist && checklistItems.length > 0
        ? { items: checklistItems.filter((item) => item.trim()) }
        : {};

    try {
      if (isEditing && field) {
        await updateField({
          id: field.id,
          label: label.trim(),
          fieldType,
          isRequired,
          configuration,
        });
      } else {
        await createField({
          stepId,
          label: label.trim(),
          fieldType,
          isRequired,
          configuration,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar campo:", error);
    }
  };

  const handleAddChecklistItem = () => {
    setChecklistItems((prev) => [...prev, ""]);
  };

  const handleUpdateChecklistItem = (index: number, value: string) => {
    setChecklistItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar campo" : "Adicionar campo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="field-label">Título</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Ex: Documentação enviada?"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de campo</Label>
            <RadioGroup
              value={fieldType}
              onValueChange={(value) => setFieldType(value as StepFieldType)}
              className="flex gap-4"
            >
              <label className="flex flex-1 cursor-pointer flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="text" id="field-type-text" />
                  <span className="font-medium">Texto simples</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ideal para inputs curtos ou observações.
                </p>
              </label>
              <label className="flex flex-1 cursor-pointer flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="checklist"
                    id="field-type-checklist"
                  />
                  <span className="font-medium">Checklist</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Colete múltiplos itens obrigatórios por etapa.
                </p>
              </label>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="field-required">Campo obrigatório</Label>
              <p className="text-sm text-muted-foreground">
                O usuário precisa preencher este campo antes de avançar.
              </p>
            </div>
            <Switch
              id="field-required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
            />
          </div>

          {isChecklist && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Itens do checklist</Label>
                  <p className="text-sm text-muted-foreground">
                    Adicione cada item que o usuário precisa validar.
                  </p>
                </div>
                <Button size="sm" onClick={handleAddChecklistItem}>
                  Adicionar item
                </Button>
              </div>
              {checklistItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum item adicionado ainda.
                </p>
              )}
              <div className="space-y-3">
                {checklistItems.map((item, index) => (
                  <div key={`item-${index}`} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(event) =>
                        handleUpdateChecklistItem(index, event.target.value)
                      }
                      placeholder={`Item ${index + 1}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveChecklistItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isCreating || isUpdating}
            type="button"
          >
            {isCreating || isUpdating ? "Salvando..." : "Salvar campo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

