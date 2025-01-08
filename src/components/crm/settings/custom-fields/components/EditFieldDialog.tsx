import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomField, EntityField } from "../types";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

interface EditFieldDialogProps {
  field: CustomField | EntityField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: CustomField | EntityField) => void;
}

export function EditFieldDialog({ field, open, onOpenChange, onSave }: EditFieldDialogProps) {
  const [editingField, setEditingField] = useState<CustomField | EntityField | null>(null);

  useEffect(() => {
    if (field) {
      setEditingField({ ...field });
    }
  }, [field]);

  if (!editingField) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Campo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Campo</Label>
            <Input
              id="name"
              value={editingField.name}
              onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={editingField.description || ''}
              onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={editingField.is_required || false}
              onCheckedChange={(checked) => setEditingField({ ...editingField, is_required: checked })}
            />
            <Label htmlFor="required">Campo Obrigatório</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(editingField)}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}