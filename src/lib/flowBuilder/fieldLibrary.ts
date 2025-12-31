import { StepFieldConfiguration, StepFieldType } from "@/types/nexflow";
import { SYSTEM_FIELDS } from "./systemFields";

export interface FlowBuilderFieldDefinition {
  id: string;
  label: string;
  description: string;
  fieldType: StepFieldType;
  defaultLabel: string;
  defaultConfiguration: () => StepFieldConfiguration;
}

export const fieldLibrary: FlowBuilderFieldDefinition[] = [
  {
    id: "shortText",
    label: "Texto Curto",
    description: "Campo para respostas rápidas.",
    fieldType: "text",
    defaultLabel: "Novo Texto Curto",
    defaultConfiguration: () => ({
      placeholder: "Digite aqui...",
      variant: "short",
      minLength: 0,
      maxLength: 255,
      validation: "none",
    }),
  },
  {
    id: "longText",
    label: "Texto Longo",
    description: "Útil para descrições e respostas completas.",
    fieldType: "text",
    defaultLabel: "Novo Texto Longo",
    defaultConfiguration: () => ({
      placeholder: "Digite sua resposta...",
      variant: "long",
      minLength: 0,
      maxLength: 2000,
      validation: "none",
    }),
  },
  {
    id: "checkbox",
    label: "Checkbox",
    description: "Lista de opções marcáveis.",
    fieldType: "checklist",
    defaultLabel: "Novo Checklist",
    defaultConfiguration: () => ({
      items: ["Opção 1", "Opção 2"],
    }),
  },
  {
    id: "date",
    label: "Data",
    description: "Selecione uma data específica.",
    fieldType: "date",
    defaultLabel: "Data",
    defaultConfiguration: () => ({}),
  },
  {
    id: "email",
    label: "Email",
    description: "Valida endereços de email automaticamente.",
    fieldType: "text",
    defaultLabel: "Email",
    defaultConfiguration: () => ({
      placeholder: "nome@empresa.com",
      validation: "email",
    }),
  },
  {
    id: "phone",
    label: "Telefone",
    description: "Campo com validação de telefone.",
    fieldType: "text",
    defaultLabel: "Telefone",
    defaultConfiguration: () => ({
      placeholder: "(00) 00000-0000",
      validation: "phone",
    }),
  },
  {
    id: "assignee",
    label: "Responsável",
    description: "Seleção de usuário responsável.",
    fieldType: "user_select",
    defaultLabel: "Responsável",
    defaultConfiguration: () => ({}),
  },
  {
    id: "assignee_team",
    label: "Time",
    description: "Seleção de time para atribuição ao card.",
    fieldType: "user_select",
    defaultLabel: "Time",
    defaultConfiguration: () => ({}),
  },
  {
    id: "cnpjCpf",
    label: "CNPJ/CPF",
    description: "Campo com máscara e validação automática de CNPJ ou CPF.",
    fieldType: "text",
    defaultLabel: "CNPJ/CPF",
    defaultConfiguration: () => ({
      placeholder: "000.000.000-00 ou 00.000.000/0000-00",
      validation: "cnpj_cpf",
      cnpjCpfType: "auto",
    }),
  },
];

export function getFieldDefinition(id: string) {
  return fieldLibrary.find((definition) => definition.id === id);
}

/**
 * Retorna o slug padrão para um campo de sistema baseado no ID do campo
 */
export function getDefaultSlugForField(fieldId: string): string | null {
  if (fieldId === "assignee") {
    return SYSTEM_FIELDS.ASSIGNED_TO;
  }
  if (fieldId === "assignee_team") {
    return SYSTEM_FIELDS.ASSIGNED_TEAM_ID;
  }
  return null;
}

