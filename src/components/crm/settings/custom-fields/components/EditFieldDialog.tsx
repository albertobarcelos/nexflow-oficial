import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomField } from "../types";
import { useState } from "react";

interface EditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: CustomField | null;
  onSave: (field: CustomField) => void;
}

export function EditFieldDialog({ open, onOpenChange, field, onSave }: EditFieldDialogProps) {
  const [editingField, setEditingField] = useState<CustomField | null>(field);

  const handleSave = () => {
    if (editingField) {
      onSave(editingField);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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