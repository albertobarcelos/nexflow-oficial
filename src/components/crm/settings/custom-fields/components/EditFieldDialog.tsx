import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomField, EntityField } from "../types";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditFieldDialogProps {
  field: CustomField | EntityField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: CustomField | EntityField) => void;
}

export function EditFieldDialog({ field, open, onOpenChange, onSave }: EditFieldDialogProps) {
  const [editingField, setEditingField] = useState<CustomField | EntityField | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (field) {
      setEditingField({ ...field });
    }
  }, [field]);

  const handleSave = async () => {
    if (!editingField) return;

    try {
      setIsSaving(true);

      // Update the field in the database
      const { error } = await supabase
        .from('entity_fields')
        .update({
          name: editingField.name,
          description: editingField.description,
          is_required: editingField.is_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingField.id);

      if (error) throw error;

      onSave(editingField);
      onOpenChange(false);
      toast.success("Campo atualizado com sucesso!");
    } catch (error) {
      console.error("Error saving field:", error);
      toast.error("Erro ao salvar alterações no campo");
    } finally {
      setIsSaving(false);
    }
  };

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
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}