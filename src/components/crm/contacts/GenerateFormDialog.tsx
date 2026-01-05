import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Copy, ExternalLink, Loader2 } from "lucide-react";
import { usePublicContactForms, FormFieldConfig } from "@/hooks/usePublicContactForms";
import { toast } from "sonner";
import { appConfig } from "@/lib/config";

interface GenerateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultFields: FormFieldConfig[] = [
  {
    id: "client_name",
    type: "text",
    label: "Nome do Cliente",
    name: "client_name",
    placeholder: "Digite o nome do cliente",
    required: true,
  },
  {
    id: "main_contact",
    type: "text",
    label: "Contato Principal",
    name: "main_contact",
    placeholder: "Nome do contato",
    required: true,
  },
  {
    id: "phone",
    type: "tel",
    label: "Telefone",
    name: "phone",
    placeholder: "(00) 00000-0000",
    required: false,
  },
];

export function GenerateFormDialog({
  open,
  onOpenChange,
}: GenerateFormDialogProps) {
  const {
    forms,
    isLoading,
    createForm,
    updateForm,
    deleteForm,
    toggleActive,
  } = usePublicContactForms();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormFieldConfig[]>(defaultFields);
  const [isCreating, setIsCreating] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setFields(defaultFields);
      setEditingFieldId(null);
    }
  }, [open]);

  const handleAddField = () => {
    const newField: FormFieldConfig = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "Novo Campo",
      name: `field_${Date.now()}`,
      placeholder: "",
      required: false,
    };
    setFields([...fields, newField]);
    setEditingFieldId(newField.id);
  };

  const handleUpdateField = (id: string, updates: Partial<FormFieldConfig>) => {
    setFields(
      fields.map((field) => (field.id === id ? { ...field, ...updates } : field))
    );
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const handleCreateForm = async () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (fields.length === 0) {
      toast.error("Adicione pelo menos um campo");
      return;
    }

    // Validar que campos obrigatórios padrão existem
    const hasClientName = fields.some((f) => f.name === "client_name");
    const hasMainContact = fields.some((f) => f.name === "main_contact");

    if (!hasClientName || !hasMainContact) {
      toast.error("O formulário deve conter os campos 'Nome do Cliente' e 'Contato Principal'");
      return;
    }

    setIsCreating(true);
    try {
      await createForm.mutateAsync({
        title,
        description,
        fields_config: fields,
      });
      setTitle("");
      setDescription("");
      setFields(defaultFields);
      onOpenChange(false);
    } catch (error) {
      // Error já é tratado no hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/form/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, is_active: !currentActive });
    } catch (error) {
      // Error já é tratado no hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este formulário?")) {
      return;
    }
    try {
      await deleteForm.mutateAsync(id);
    } catch (error) {
      // Error já é tratado no hook
    }
  };

  const getFormUrl = (slug: string) => {
    return `${window.location.origin}/form/${slug}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Formulário Público</DialogTitle>
          <DialogDescription>
            Crie um formulário público para captura de oportunidades. O formulário
            será acessível via link único e não requer autenticação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulários Existentes */}
          {forms.length > 0 && (
            <div className="space-y-2">
              <Label>Formulários Existentes</Label>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.title}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {form.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={form.is_active ? "default" : "secondary"}>
                            {form.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(form.slug)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(getFormUrl(form.slug), "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={form.is_active}
                              onCheckedChange={() =>
                                handleToggleActive(form.id, form.is_active)
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(form.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Criar Novo Formulário */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Criar Novo Formulário</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Formulário de Contato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do formulário (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Campos do Formulário</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Obrigatório</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              handleUpdateField(field.id, { label: e.target.value })
                            }
                            placeholder="Label do campo"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={field.name}
                            onChange={(e) =>
                              handleUpdateField(field.id, { name: e.target.value })
                            }
                            placeholder="name"
                            className="w-full font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={field.type}
                            onValueChange={(value: FormFieldConfig["type"]) =>
                              handleUpdateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="tel">Telefone</SelectItem>
                              <SelectItem value="textarea">Área de Texto</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                              <SelectItem value="select">Seleção</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              handleUpdateField(field.id, { required: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveField(field.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateForm} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Formulário
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

