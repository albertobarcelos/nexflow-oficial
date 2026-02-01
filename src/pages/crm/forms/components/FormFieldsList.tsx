import { useState } from "react";
import { GripVertical, Plus, Globe, Lock, CheckCircle2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FormFieldConfig } from "@/hooks/usePublicContactForms";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FormFieldsListProps {
  fields: FormFieldConfig[];
  formType: "public" | "internal" | null;
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string | null) => void;
  onFieldsChange: (fields: FormFieldConfig[]) => void;
  onAddField: (section: "public" | "internal") => void;
}

// Campos permitidos por tipo
const PUBLIC_FIELD_TYPES = ["text", "email", "tel", "textarea", "number", "checkbox", "cpf_cnpj"];
const INTERNAL_FIELD_TYPES = [
  ...PUBLIC_FIELD_TYPES,
  "select",
  "user_select",
  "partner_select",
  "company_toggle",
  "contact_type_select",
];

// Campos de listagem (apenas internos)
const LISTING_FIELD_TYPES = ["select", "user_select", "partner_select", "company_toggle", "contact_type_select"];

function getFieldTypeLabel(type: FormFieldConfig["type"]): string {
  const labels: Record<string, string> = {
    text: "Texto Simples",
    email: "Email",
    tel: "Telefone",
    textarea: "Texto Longo",
    number: "Número",
    checkbox: "Checkbox",
    cpf_cnpj: "CPF/CNPJ",
    select: "Seleção",
    user_select: "Selecionar Usuário",
    partner_select: "Selecionar Parceiro",
    company_toggle: "Toggle Empresa",
    contact_type_select: "Tipo de Cliente",
  };
  return labels[type] || type;
}

function SortableFieldItem({
  field,
  isSelected,
  isListingField,
  onSelect,
}: {
  field: FormFieldConfig;
  isSelected: boolean;
  isListingField: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer transition-all",
        isSelected
          ? "border-orange-500 bg-orange-50/50 shadow-md"
          : "border-border hover:border-orange-300 hover:bg-accent/50",
        isDragging && "shadow-lg"
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{field.label}</span>
          {field.required && (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground font-mono">@{field.name}</span>
          <Badge variant="outline" className="text-xs">
            {getFieldTypeLabel(field.type)}
          </Badge>
          {isListingField && (
            <Link2Off className="h-4 w-4 text-blue-600 flex-shrink-0" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={field.required} disabled />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {field.required ? "OBRIGATÓRIO" : "OPCIONAL"}
        </span>
      </div>
    </div>
  );
}

export function FormFieldsList({
  fields,
  formType,
  selectedFieldId,
  onFieldSelect,
  onFieldsChange,
  onAddField,
}: FormFieldsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Separar campos por tipo
  const publicFields = fields.filter((f) => PUBLIC_FIELD_TYPES.includes(f.type));
  const internalFields = fields.filter((f) => !PUBLIC_FIELD_TYPES.includes(f.type));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newFields = arrayMove(fields, oldIndex, newIndex);
      onFieldsChange(newFields);
    }
  };

  if (!formType) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Selecione um tipo de formulário para começar</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Campos Públicos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wide">
                CAMPOS PÚBLICOS
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddField("public")}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>

          <SortableContext
            items={publicFields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {publicFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum campo público adicionado
                </p>
              ) : (
                publicFields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    isListingField={false}
                    onSelect={() => onFieldSelect(field.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>

        {/* Campos Internos - apenas para formulários internos */}
        {formType === "internal" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  CAMPOS INTERNOS
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  SOMENTE EQUIPE INTERNA
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddField("internal")}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </Button>
              </div>
            </div>

            <SortableContext
              items={internalFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {internalFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum campo interno adicionado
                  </p>
                ) : (
                  internalFields.map((field) => (
                    <SortableFieldItem
                      key={field.id}
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      isListingField={LISTING_FIELD_TYPES.includes(field.type)}
                      onSelect={() => onFieldSelect(field.id)}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </div>
        )}
      </div>
    </DndContext>
  );
}
