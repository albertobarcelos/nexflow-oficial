import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldConfig } from "@/hooks/usePublicContactForms";
import { cn } from "@/lib/utils";

interface FieldSettingsPanelProps {
  field: FormFieldConfig | null;
  formType: "public" | "internal" | null;
  onClose: () => void;
  onFieldUpdate: (updates: Partial<FormFieldConfig>) => void;
  onFieldDelete: () => void;
}

// Campos permitidos por tipo
const PUBLIC_FIELD_TYPES: FormFieldConfig["type"][] = [
  "text",
  "email",
  "tel",
  "textarea",
  "number",
  "checkbox",
  "cpf_cnpj",
];
const INTERNAL_FIELD_TYPES: FormFieldConfig["type"][] = [
  ...PUBLIC_FIELD_TYPES,
  "select",
  "user_select",
  "partner_select",
  "company_toggle",
  "contact_type_select",
];

function getFieldTypeLabel(type: FormFieldConfig["type"]): string {
  const labels: Record<string, string> = {
    text: "Texto Simples (Short Text)",
    email: "Email",
    tel: "Telefone",
    textarea: "Texto Longo (Long Text)",
    number: "Número",
    checkbox: "Checkbox",
    cpf_cnpj: "CPF/CNPJ",
    select: "Seleção (Select)",
    user_select: "Selecionar Usuário",
    partner_select: "Selecionar Parceiro",
    company_toggle: "Toggle Empresa",
    contact_type_select: "Tipo de Cliente",
  };
  return labels[type] || type;
}

export function FieldSettingsPanel({
  field,
  formType,
  onClose,
  onFieldUpdate,
  onFieldDelete,
}: FieldSettingsPanelProps) {
  if (!field) {
    return (
      <div className="w-80 border-l bg-muted/30 p-6 flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center">
          Selecione um campo para configurar
        </p>
      </div>
    );
  }

  const availableFieldTypes =
    formType === "internal" ? INTERNAL_FIELD_TYPES : PUBLIC_FIELD_TYPES;

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Configurações do Campo</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Rótulo (Label) */}
        <div className="space-y-2">
          <Label htmlFor="field-label" className="text-xs font-semibold uppercase">
            RÓTULO (LABEL)
          </Label>
          <Input
            id="field-label"
            value={field.label}
            onChange={(e) => onFieldUpdate({ label: e.target.value })}
            placeholder="Ex: Nome do Cliente"
          />
        </div>

        {/* Nome da Variável (API) */}
        <div className="space-y-2">
          <Label htmlFor="field-name" className="text-xs font-semibold uppercase">
            NOME DA VARIÁVEL (API)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              @
            </span>
            <Input
              id="field-name"
              value={field.name}
              onChange={(e) => onFieldUpdate({ name: e.target.value })}
              placeholder="client_name"
              className="pl-7 font-mono text-sm"
            />
          </div>
        </div>

        {/* Tipo de Campo */}
        <div className="space-y-2">
          <Label htmlFor="field-type" className="text-xs font-semibold uppercase">
            TIPO DE CAMPO
          </Label>
          <Select
            value={field.type}
            onValueChange={(value: FormFieldConfig["type"]) =>
              onFieldUpdate({ type: value })
            }
          >
            <SelectTrigger id="field-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableFieldTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getFieldTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Placeholder */}
        <div className="space-y-2">
          <Label htmlFor="field-placeholder" className="text-xs font-semibold uppercase">
            PLACEHOLDER
          </Label>
          <Input
            id="field-placeholder"
            value={field.placeholder || ""}
            onChange={(e) => onFieldUpdate({ placeholder: e.target.value })}
            placeholder="Ex: Maria Silva"
          />
        </div>

        {/* Campo Obrigatório */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
          <div className="space-y-0.5">
            <Label htmlFor="field-required" className="text-sm font-medium">
              Campo Obrigatório
            </Label>
            <p className="text-xs text-muted-foreground">
              Impede o envio se vazio
            </p>
          </div>
          <Switch
            id="field-required"
            checked={field.required}
            onCheckedChange={(checked) => onFieldUpdate({ required: checked })}
          />
        </div>

        {/* Somente Leitura */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
          <div className="space-y-0.5">
            <Label htmlFor="field-readonly" className="text-sm font-medium">
              Somente Leitura
            </Label>
            <p className="text-xs text-muted-foreground">
              Usuário não pode editar
            </p>
          </div>
          <Switch
            id="field-readonly"
            checked={false} // TODO: Adicionar suporte a readonly no FormFieldConfig
            onCheckedChange={(checked) => {
              // TODO: Implementar quando readonly for adicionado ao tipo
            }}
            disabled
          />
        </div>
      </div>

      {/* Footer - Botão de Excluir */}
      <div className="p-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          onClick={onFieldDelete}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir este Campo
        </Button>
      </div>
    </div>
  );
}
