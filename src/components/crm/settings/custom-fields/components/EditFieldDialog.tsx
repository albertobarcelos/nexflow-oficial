import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CustomField } from "../types";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CustomFieldRenderer } from "@/components/crm/opportunities/CustomFieldRenderer";
import { useForm } from "react-hook-form";

interface EditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: CustomField | null;
  onSave: (field: CustomField) => void;
  onDuplicate?: (field: CustomField) => void;
}

export function EditFieldDialog({ open, onOpenChange, field, onSave, onDuplicate }: EditFieldDialogProps) {
  const [editingField, setEditingField] = useState<CustomField | null>(field);
  const [validationError, setValidationError] = useState<string | null>(null);
  const form = useForm();

  useEffect(() => {
    setEditingField(field);
  }, [field]);

  const validateField = (field: CustomField): boolean => {
    if (!field.name.trim()) {
      setValidationError("O nome do campo é obrigatório");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSave = () => {
    if (editingField && validateField(editingField)) {
      const history = editingField.history || [];
      history.push({
        timestamp: new Date().toISOString(),
        action: "updated",
        user_id: "current_user_id",
        details: [{
          field: "name",
          oldValue: field?.name,
          newValue: editingField.name
        }]
      });

      onSave({ ...editingField, history });
    }
  };

  const handleDuplicate = () => {
    if (editingField && onDuplicate) {
      const duplicatedField: CustomField = {
        ...editingField,
        id: `temp-${Date.now()}`,
        name: `${editingField.name} (cópia)`,
        history: [{
          timestamp: new Date().toISOString(),
          action: "created",
          user_id: "current_user_id"
        }]
      };
      onDuplicate(duplicatedField);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Campo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
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
              <Textarea
                id="fieldDescription"
                value={editingField?.description || ''}
                onChange={(e) => setEditingField(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isRequired"
                checked={editingField?.is_required || false}
                onCheckedChange={(checked) => setEditingField(prev => prev ? { ...prev, is_required: checked } : null)}
              />
              <Label htmlFor="isRequired">Campo Obrigatório</Label>
            </div>

            {validationError && (
              <div className="text-red-500">{validationError}</div>
            )}

            {editingField?.history && editingField.history.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Histórico de Alterações</h4>
                <div className="space-y-2">
                  {editingField.history.map((entry, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}: {entry.action}
                      {entry.details?.map((detail, idx) => (
                        <div key={idx} className="ml-2">
                          {detail.field}: {detail.oldValue} → {detail.newValue}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Pré-visualização</h3>
              <Separator className="my-2" />
              <div className="space-y-2">
                {editingField && (
                  <CustomFieldRenderer
                    field={editingField}
                    register={form.register}
                    setValue={form.setValue}
                    watch={form.watch}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {onDuplicate && (
            <Button variant="outline" onClick={handleDuplicate}>
              Duplicar Campo
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
