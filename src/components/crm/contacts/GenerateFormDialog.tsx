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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Trash2, Plus, Copy, ExternalLink, Loader2, Settings2, Edit } from "lucide-react";
import { usePublicContactForms, FormFieldConfig } from "@/hooks/usePublicContactForms";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { usePartners } from "@/hooks/usePartners";
import { getCurrentClientId } from "@/lib/supabase";
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
  const [configFieldId, setConfigFieldId] = useState<string | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  
  const { data: teams = [] } = useOrganizationTeams();
  const { partners = [] } = usePartners();

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setFields(defaultFields);
      setEditingFieldId(null);
      setEditingFormId(null);
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

  const handleFieldTypeChange = (id: string, newType: FormFieldConfig["type"]) => {
    const field = fields.find((f) => f.id === id);
    if (!field) return;

    const updates: Partial<FormFieldConfig> = { type: newType };

    // Limpar configurações específicas quando mudar de tipo
    if (newType !== "select") {
      updates.options = undefined;
    }
    if (newType !== "company_toggle") {
      updates.companyToggle = undefined;
    }
    if (newType !== "partner_select") {
      updates.partnerSelect = undefined;
    }
    if (newType !== "user_select") {
      updates.userSelect = undefined;
    }
    if (newType !== "contact_type_select") {
      // contact_type_select não precisa de configuração adicional
    }

    // Se mudou para um tipo que precisa de configuração, abrir modal
    if (["select", "company_toggle", "partner_select", "user_select"].includes(newType)) {
      handleUpdateField(id, updates);
      setConfigFieldId(id);
    } else {
      handleUpdateField(id, updates);
    }
  };

  const handleAddSelectOption = (fieldId: string, option: { label: string; value: string }) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const currentOptions = field.options || [];
    handleUpdateField(fieldId, {
      options: [...currentOptions, option],
    });
  };

  const handleRemoveSelectOption = (fieldId: string, optionValue: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !field.options) return;

    handleUpdateField(fieldId, {
      options: field.options.filter((opt) => opt.value !== optionValue),
    });
  };

  const handleUpdateField = (id: string, updates: Partial<FormFieldConfig>) => {
    setFields(
      fields.map((field) => (field.id === id ? { ...field, ...updates } : field))
    );
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const handleEditForm = (formId: string) => {
    const form = forms.find((f) => f.id === formId);
    if (!form) return;

    setEditingFormId(formId);
    setTitle(form.title);
    setDescription(form.description || "");
    setFields(form.fields_config || defaultFields);
    
    // Scroll para a seção de edição
    setTimeout(() => {
      const editSection = document.querySelector('[data-edit-section]');
      editSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingFormId(null);
    setTitle("");
    setDescription("");
    setFields(defaultFields);
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
      if (editingFormId) {
        // Modo de edição
        await updateForm.mutateAsync({
          id: editingFormId,
          title,
          description,
          fields_config: fields,
        });
        handleCancelEdit();
      } else {
        // Modo de criação
        await createForm.mutateAsync({
          title,
          description,
          fields_config: fields,
        });
        setTitle("");
        setDescription("");
        setFields(defaultFields);
        onOpenChange(false);
      }
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
                              onClick={() => handleEditForm(form.id)}
                              title="Editar formulário"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(form.slug)}
                              title="Copiar link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(getFormUrl(form.slug), "_blank")}
                              title="Abrir formulário"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={form.is_active}
                              onCheckedChange={() =>
                                handleToggleActive(form.id, form.is_active)
                              }
                              title={form.is_active ? "Desativar" : "Ativar"}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(form.id)}
                              title="Deletar formulário"
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

          {/* Criar/Editar Formulário */}
          <div className="space-y-4 border-t pt-4" data-edit-section>
            <h3 className="font-semibold">
              {editingFormId ? "Editar Formulário" : "Criar Novo Formulário"}
            </h3>

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
                          <div className="flex items-center gap-2">
                            <Select
                              value={field.type}
                              onValueChange={(value: FormFieldConfig["type"]) =>
                                handleFieldTypeChange(field.id, value)
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
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="select">Seleção</SelectItem>
                                <SelectItem value="cpf_cnpj">CPF/CNPJ</SelectItem>
                                <SelectItem value="company_toggle">Toggle Empresa</SelectItem>
                                <SelectItem value="partner_select">Selecionar Parceiro</SelectItem>
                                <SelectItem value="user_select">Selecionar Usuário</SelectItem>
                                <SelectItem value="contact_type_select">Tipo de Cliente</SelectItem>
                              </SelectContent>
                            </Select>
                            {["select", "company_toggle", "partner_select", "user_select"].includes(field.type) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfigFieldId(field.id)}
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
              {editingFormId && (
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar Edição
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {editingFormId ? "Fechar" : "Cancelar"}
              </Button>
              <Button onClick={handleCreateForm} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingFormId ? "Salvar Alterações" : "Criar Formulário"}
              </Button>
            </div>
          </div>
        </div>

        {/* Modal de Configuração de Campo */}
        {configFieldId && (() => {
          const field = fields.find((f) => f.id === configFieldId);
          if (!field) return null;

          return (
            <Dialog open={!!configFieldId} onOpenChange={(open) => !open && setConfigFieldId(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurar Campo: {field.label}</DialogTitle>
                  <DialogDescription>
                    Configure as opções específicas para este tipo de campo
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Configuração para Select */}
                  {field.type === "select" && (
                    <div className="space-y-4">
                      <Label>Opções de Seleção</Label>
                      <div className="space-y-2 border rounded-lg p-4">
                        {(field.options || []).map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [])];
                                newOptions[index] = { ...option, label: e.target.value };
                                handleUpdateField(field.id, { options: newOptions });
                              }}
                              placeholder="Label da opção"
                              className="flex-1"
                            />
                            <Input
                              value={option.value}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [])];
                                newOptions[index] = { ...option, value: e.target.value };
                                handleUpdateField(field.id, { options: newOptions });
                              }}
                              placeholder="Valor"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSelectOption(field.id, option.value)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleAddSelectOption(field.id, { label: "", value: "" })
                          }
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Opção
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Configuração para Company Toggle */}
                  {field.type === "company_toggle" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Permitir criar nova empresa</Label>
                        <Switch
                          checked={field.companyToggle?.allowCreate ?? false}
                          onCheckedChange={(checked) =>
                            handleUpdateField(field.id, {
                              companyToggle: {
                                enabled: true,
                                allowCreate: checked,
                                required: field.companyToggle?.required ?? false,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Empresa obrigatória</Label>
                        <Switch
                          checked={field.companyToggle?.required ?? false}
                          onCheckedChange={(checked) =>
                            handleUpdateField(field.id, {
                              companyToggle: {
                                enabled: true,
                                allowCreate: field.companyToggle?.allowCreate ?? false,
                                required: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Configuração para Partner Select */}
                  {field.type === "partner_select" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Permitir criar novo parceiro</Label>
                        <Switch
                          checked={field.partnerSelect?.allowCreate ?? false}
                          onCheckedChange={(checked) =>
                            handleUpdateField(field.id, {
                              partnerSelect: { allowCreate: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Configuração para User Select */}
                  {field.type === "user_select" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Filtrar por Time (opcional)</Label>
                        <Select
                          value={field.userSelect?.teamId || undefined}
                          onValueChange={(teamId) => {
                            if (teamId === "all") {
                              handleUpdateField(field.id, {
                                userSelect: {
                                  teamId: undefined,
                                  teamName: undefined,
                                },
                              });
                            } else {
                              const selectedTeam = teams.find((t) => t.id === teamId);
                              handleUpdateField(field.id, {
                                userSelect: {
                                  teamId: teamId || undefined,
                                  teamName: selectedTeam?.name || undefined,
                                },
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um time (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os usuários</SelectItem>
                            {teams
                              .filter((t) => t.is_active)
                              .map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {field.userSelect?.teamName && (
                          <p className="text-sm text-muted-foreground">
                            Apenas usuários do time "{field.userSelect.teamName}" estarão disponíveis
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setConfigFieldId(null)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}

