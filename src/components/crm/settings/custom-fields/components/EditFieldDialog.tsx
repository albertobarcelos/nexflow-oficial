import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: EntityField | null;
  onSave: (field: EntityField) => void;
}

export function EditFieldDialog({ field, open, onOpenChange, onSave }: EditFieldDialogProps) {
  const [editingField, setEditingField] = useState<CustomField | EntityField | null>(null);

  useEffect(() => {
    if (field) {
      form.reset({
        name: field.name,
        description: field.description || "",
        field_type: field.field_type,
        is_required: field.is_required,
        options: field.options?.join(", ") || "",
      });
    }
  }, [field, form]);

  const handleSave = () => {
    if (!editingField) return;

    try {
      onSave(editingField);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving field:", error);
      toast.error("Erro ao salvar alterações no campo");
    }
  };

  const selectedFieldType = form.watch("field_type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
