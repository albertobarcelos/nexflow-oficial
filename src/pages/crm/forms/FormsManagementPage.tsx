import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePublicContactForms, FormFieldConfig } from "@/hooks/usePublicContactForms";
import { FormTypeSelector } from "./components/FormTypeSelector";
import { FormFieldsList } from "./components/FormFieldsList";
import { FieldSettingsPanel } from "./components/FieldSettingsPanel";
import { FormCard } from "./components/FormCard";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export function FormsManagementPage() {
  const navigate = useNavigate();
  const {
    forms,
    isLoading,
    createForm,
    updateForm,
    deleteForm,
  } = usePublicContactForms();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formType, setFormType] = useState<"public" | "internal" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormFieldConfig[]>(defaultFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  // Reset ao mudar tipo de formulário
  useEffect(() => {
    if (formType && !editingFormId) {
      setFields(defaultFields);
      setTitle("");
      setDescription("");
      setSelectedFieldId(null);
    }
  }, [formType, editingFormId]);

  const handleAddField = (section: "public" | "internal") => {
    const PUBLIC_FIELD_TYPES = ["text", "email", "tel", "textarea", "number", "checkbox", "cpf_cnpj"];
    const INTERNAL_FIELD_TYPES = [
      ...PUBLIC_FIELD_TYPES,
      "select",
      "user_select",
      "partner_select",
      "company_toggle",
      "contact_type_select",
    ];

    const defaultType = section === "public" ? "text" : "select";
    const availableTypes = section === "public" ? PUBLIC_FIELD_TYPES : INTERNAL_FIELD_TYPES;

    const newField: FormFieldConfig = {
      id: `field-${Date.now()}`,
      type: defaultType as FormFieldConfig["type"],
      label: "Novo Campo",
      name: `field_${Date.now()}`,
      placeholder: "",
      required: false,
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleFieldUpdate = (updates: Partial<FormFieldConfig>) => {
    if (!selectedFieldId) return;

    setFields(
      fields.map((field) =>
        field.id === selectedFieldId ? { ...field, ...updates } : field
      )
    );
  };

  const handleFieldDelete = () => {
    if (!selectedFieldId) return;

    setFields(fields.filter((field) => field.id !== selectedFieldId));
    setSelectedFieldId(null);
  };

  const handleEditForm = (formId: string) => {
    const form = forms.find((f) => f.id === formId);
    if (!form) return;

    setEditingFormId(formId);
    setFormType(form.form_type || "public");
    setTitle(form.title);
    setDescription(form.description || "");
    setFields(form.fields_config || defaultFields);
    setSelectedFieldId(null);

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingFormId(null);
    setIsCreatingNew(false);
    setFormType(null);
    setTitle("");
    setDescription("");
    setFields(defaultFields);
    setSelectedFieldId(null);
  };

  const handleSave = async () => {
    if (!formType) {
      toast.error("Selecione um tipo de formulário");
      return;
    }

    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (fields.length === 0) {
      toast.error("Adicione pelo menos um campo");
      return;
    }

    // Validar campos obrigatórios padrão para formulários públicos
    if (formType === "public") {
      const hasClientName = fields.some((f) => f.name === "client_name");
      const hasMainContact = fields.some((f) => f.name === "main_contact");

      if (!hasClientName || !hasMainContact) {
        toast.error("Formulários públicos devem conter os campos 'Nome do Cliente' e 'Contato Principal'");
        return;
      }
    }

    setIsCreating(true);
    try {
      if (editingFormId) {
        await updateForm.mutateAsync({
          id: editingFormId,
          title,
          description,
          fields_config: fields,
          form_type: formType,
        });
        handleCancelEdit();
      } else {
        await createForm.mutateAsync({
          title,
          description,
          fields_config: fields,
          form_type: formType,
        });
        handleCancelEdit();
        setIsCreatingNew(false);
      }
    } catch (error) {
      // Error já é tratado no hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (formId: string) => {
    setFormToDelete(formId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;

    try {
      await deleteForm.mutateAsync(formToDelete);
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    } catch (error) {
      // Error já é tratado no hook
    }
  };

  const handleNewForm = () => {
    // Limpar estado de edição e ativar modo de criação
    setEditingFormId(null);
    setIsCreatingNew(true);
    setFormType(null);
    setTitle("");
    setDescription("");
    setFields(defaultFields);
    setSelectedFieldId(null);
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/crm/contacts")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {editingFormId ? "Editar Formulário" : "Gerenciar Formulários"}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            {editingFormId
              ? "Edite os detalhes e campos do formulário"
              : "Gerencie seus formulários ou crie novos"}
          </p>
        </div>
        {!editingFormId && !isCreatingNew && (
          <Button onClick={handleNewForm}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Novo Formulário
          </Button>
        )}
        {isCreatingNew && (
          <Button variant="outline" onClick={handleCancelEdit}>
            Cancelar
          </Button>
        )}
      </div>

      {/* Conteúdo Principal */}
      {editingFormId || isCreatingNew ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna 1: Tipos de Formulário */}
          <div className="lg:col-span-3">
            <FormTypeSelector
              selectedType={formType}
              onTypeSelect={setFormType}
            />
          </div>

          {/* Coluna 2: Detalhes do Formulário */}
          <div className="lg:col-span-6 space-y-6">
            {/* Cabeçalho do Formulário */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  NOME DO FORMULÁRIO
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Formulário de Contato Comercial"
                  className="mt-1 text-lg font-semibold"
                />
              </div>

              {editingFormId && (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(editingFormId)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  <Button onClick={handleSave} disabled={isCreating}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </div>

            {/* Lista de Campos */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
                Espaço de Trabalho
              </h2>
              <FormFieldsList
                fields={fields}
                formType={formType}
                selectedFieldId={selectedFieldId}
                onFieldSelect={setSelectedFieldId}
                onFieldsChange={setFields}
                onAddField={handleAddField}
              />
            </div>

            {/* Botões de Ação */}
            {!editingFormId && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isCreating}>
                  {isCreating ? "Salvando..." : "Criar Formulário"}
                </Button>
              </div>
            )}
          </div>

          {/* Coluna 3: Configurações de Campo */}
          <div className="lg:col-span-3">
            <FieldSettingsPanel
              field={selectedField}
              formType={formType}
              onClose={() => setSelectedFieldId(null)}
              onFieldUpdate={handleFieldUpdate}
              onFieldDelete={handleFieldDelete}
            />
          </div>
        </div>
      ) : (
        /* Lista de Formulários Existentes */
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
              MEUS FORMULÁRIOS EXISTENTES
            </h2>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando formulários...</p>
            ) : forms.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground mb-4">
                  Nenhum formulário criado ainda
                </p>
                <Button onClick={handleNewForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Formulário
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forms.map((form) => (
                  <FormCard
                    key={form.id}
                    form={form}
                    onEdit={handleEditForm}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Formulário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
