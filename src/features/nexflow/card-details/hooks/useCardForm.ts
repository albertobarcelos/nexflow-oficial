import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import type { CardFormValues } from "../types";

interface UseCardFormProps {
  form: UseFormReturn<CardFormValues>;
  isDisabled: boolean;
}

export function useCardForm({ form, isDisabled }: UseCardFormProps) {
  const handleCheckboxChange = useCallback(
    (fieldId: string, item: string, checked: boolean) => {
      form.setValue(`checklist.${fieldId}.${item}`, checked, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    },
    [form]
  );

  const handleDateChange = useCallback(
    (fieldId: string, date: Date | undefined) => {
      form.setValue(`fields.${fieldId}`, date ? date.toISOString() : "", {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    },
    [form]
  );

  return {
    handleCheckboxChange,
    handleDateChange,
  };
}

