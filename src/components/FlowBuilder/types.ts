import type {
  NexflowStepField,
  StepFieldConfiguration,
  StepFieldType,
} from "@/types/nexflow";

export interface FieldFormValues {
  label: string;
  placeholder: string;
  isRequired: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  validation?: "none" | "email" | "phone";
  checklistItems: { value: string }[];
}

export function toFieldFormValues(field: NexflowStepField): FieldFormValues {
  return {
    label: field.label,
    placeholder: field.configuration.placeholder ?? "",
    isRequired: field.isRequired,
    minLength: field.configuration.minLength ?? undefined,
    maxLength: field.configuration.maxLength ?? undefined,
    validation: field.configuration.validation ?? "none",
    checklistItems:
      field.configuration.items?.map((value) => ({ value })) ?? [
        { value: "Opção 1" },
      ],
  };
}

export function buildConfigurationFromForm(
  values: FieldFormValues,
  fieldType: StepFieldType
): StepFieldConfiguration {
  const configuration: StepFieldConfiguration = {};

  if (values.placeholder) {
    configuration.placeholder = values.placeholder;
  } else {
    configuration.placeholder = undefined;
  }

  if (fieldType === "text") {
    configuration.minLength =
      typeof values.minLength === "number" ? values.minLength : undefined;
    configuration.maxLength =
      typeof values.maxLength === "number" ? values.maxLength : undefined;
    configuration.validation = values.validation ?? "none";
  }

  if (fieldType === "checklist") {
    configuration.items = values.checklistItems
      .map((item) => item.value.trim())
      .filter(Boolean);
  }

  return configuration;
}

