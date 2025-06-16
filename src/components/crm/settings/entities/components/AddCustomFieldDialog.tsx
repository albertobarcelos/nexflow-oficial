import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

interface AddCustomFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "companies" | "contacts" | "partners";
}

export function AddCustomFieldDialog({ open, onOpenChange, entityType }: AddCustomFieldDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    type: "text",
    description: "",
    required: false,
    options: "",
  });

  const fieldTypes = [
    { value: "text", label: "Texto" },
    { value: "textarea", label: "Texto Longo" },
    { value: "number", label: "Número" },
    { value: "email", label: "E-mail" },
    { value: "phone", label: "Telefone" },
    { value: "url", label: "URL" },
    { value: "date", label: "Data" },
    { value: "datetime", label: "Data e Hora" },
    { value: "select", label: "Lista de Opções" },
    { value: "multiselect", label: "Múltipla Escolha" },
    { value: "checkbox", label: "Checkbox" },
    { value: "currency", label: "Moeda" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.label) {
      toast({
        title: "Erro",
        description: "Nome e rótulo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      // Aqui você implementaria a lógica para salvar o campo personalizado
      console.log("Salvando campo personalizado:", {
        ...formData,
        entityType,
        options: formData.type === "select" || formData.type === "multiselect" 
          ? formData.options.split("\n").filter(opt => opt.trim()) 
          : undefined,
      });

      toast({
        title: "Sucesso",
        description: "Campo personalizado criado com sucesso!",
      });

      // Reset form
      setFormData({
        name: "",
        label: "",
        type: "text",
        description: "",
        required: false,
        options: "",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar campo personalizado",
        variant: "destructive",
      });
    }
  };

  const showOptions = formData.type === "select" || formData.type === "multiselect";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Campo Personalizado</DialogTitle>
          <DialogDescription>
            Crie um novo campo personalizado para {entityType === "companies" ? "empresas" : entityType === "contacts" ? "contatos" : "parceiros"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Campo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: campo_personalizado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Rótulo *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="ex: Campo Personalizado"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo do Campo</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional do campo"
              rows={2}
            />
          </div>

          {showOptions && (
            <div className="space-y-2">
              <Label htmlFor="options">Opções (uma por linha)</Label>
              <Textarea
                id="options"
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                rows={4}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
            />
            <Label htmlFor="required">Campo obrigatório</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Campo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 