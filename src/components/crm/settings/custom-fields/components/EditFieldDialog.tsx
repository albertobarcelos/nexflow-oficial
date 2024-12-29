import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CustomField } from "../types";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

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

  const renderFieldPreview = () => {
    if (!editingField) return null;

    switch (editingField.field_type) {
      case 'short_text':
        return <Input placeholder={editingField.name} disabled />;
      case 'long_text':
        return <Textarea placeholder={editingField.name} disabled />;
      case 'checkbox':
        return <Checkbox disabled />;
      case 'date':
        return <Calendar mode="single" disabled />;
      case 'datetime':
        return (
          <div className="flex gap-2">
            <Calendar mode="single" disabled />
            <Input type="time" disabled />
          </div>
        );
      case 'time':
        return <Input type="time" disabled />;
      case 'numeric':
        return <Input type="number" placeholder="0" disabled />;
      case 'currency':
        return <Input type="number" placeholder="R$ 0,00" disabled />;
      case 'email':
        return <Input type="email" placeholder="email@exemplo.com" disabled />;
      case 'phone':
        return <Input type="tel" placeholder="(00) 00000-0000" disabled />;
      case 'single_select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Opção 1</SelectItem>
              <SelectItem value="option2">Opção 2</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'responsible':
        return (
          <div className="flex items-center gap-2 p-2 border rounded">
            <User className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">Selecionar responsável</span>
          </div>
        );
      default:
        return <Input placeholder={editingField.name} disabled />;
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
          </div>
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Pré-visualização</h3>
              <Separator className="my-2" />
              <div className="space-y-2">
                <Label>{editingField?.name || 'Campo sem nome'}</Label>
                {renderFieldPreview()}
                {editingField?.description && (
                  <p className="text-xs text-muted-foreground">{editingField.description}</p>
                )}
              </div>
            </Card>
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