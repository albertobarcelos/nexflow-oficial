import { useMemo, useCallback } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { NexflowCard, NexflowStepWithFields } from "@/types/nexflow";
import type { CardFormValues } from "../types";

interface UseCardValidationProps {
  form: UseFormReturn<CardFormValues>;
  currentStep: NexflowStepWithFields | null;
  nextStep: NexflowStepWithFields | null;
}

export function useCardValidation({
  form,
  currentStep,
  nextStep,
}: UseCardValidationProps) {
  const watchFields = useWatch({ control: form.control, name: "fields" });
  const watchChecklist = useWatch({ control: form.control, name: "checklist" });

  const validateRequiredFields = useCallback(
    (card: NexflowCard, fromStepId: string, steps: NexflowStepWithFields[]): boolean => {
      const step = steps.find((item) => item.id === fromStepId);
      if (!step) {
        return true;
      }

      const requiredFields = step.fields?.filter(
        (field) => field.isRequired
      );
      if (!requiredFields || requiredFields.length === 0) {
        return true;
      }

      const missingLabels: string[] = [];

      requiredFields.forEach((field) => {
        const value = card.fieldValues?.[field.id];
        if (field.fieldType === "checklist") {
          const configItems = field.configuration.items ?? [];
          const progress = (card.checklistProgress?.[field.id] ??
            {}) as Record<string, boolean>;
          const allChecked = configItems.every(
            (item) => progress?.[item] === true
          );
          if (!allChecked) {
            missingLabels.push(`${field.label} (checklist incompleto)`);
          }
          return;
        }

        const isFilled =
          typeof value === "number" ||
          (typeof value === "string" && value.trim() !== "") ||
          (Array.isArray(value) && value.length > 0);

        if (!isFilled) {
          missingLabels.push(field.label);
        }
      });

      if (missingLabels.length > 0) {
        toast.error(
          `Complete os campos obrigatórios antes de avançar: ${missingLabels.join(
            ", "
          )}`
        );
        return false;
      }

      return true;
    },
    []
  );

  const isMoveDisabled = useMemo(() => {
    if (!currentStep || !nextStep) {
      return true;
    }

    const requiredFields = currentStep.fields?.filter((field) => field.isRequired) ?? [];
    if (!requiredFields.length) {
      return false;
    }

    const hasInvalidField = requiredFields.some((field) => {
      if (field.fieldType === "checklist") {
        const progress = watchChecklist[field.id] ?? {};
        const items = field.configuration.items ?? [];
        const allChecked = items.every((item) => progress[item] === true);
        return !allChecked;
      }

      const value = watchFields[field.id];
      if (typeof value === "number") {
        return false;
      }

      if (typeof value === "string") {
        return value.trim().length === 0;
      }

      return !value;
    });

    return hasInvalidField;
  }, [currentStep, nextStep, watchChecklist, watchFields]);

  return {
    validateRequiredFields,
    isMoveDisabled,
  };
}

