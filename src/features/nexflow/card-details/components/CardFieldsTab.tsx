import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CardFormFields } from "./CardFormFields";
import type { UseFormReturn } from "react-hook-form";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type { CardFormValues } from "../types";
import type { NexflowCard } from "@/types/nexflow";

interface CardFieldsTabProps {
  card: NexflowCard | null;
  currentStep: NexflowStepWithFields | null;
  form: UseFormReturn<CardFormValues>;
  isDisabled: boolean;
  onCheckboxChange: (fieldId: string, item: string, checked: boolean) => void;
  onDateChange: (fieldId: string, date: Date | undefined) => void;
}

export function CardFieldsTab({
  card,
  currentStep,
  form,
  isDisabled,
  onCheckboxChange,
  onDateChange,
}: CardFieldsTabProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentStep?.color ?? "#F59E0B" }}
          />
          <span className="text-xs font-bold text-gray-400  uppercase tracking-wide">
            Etapa Atual
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 ">
          {currentStep?.title ?? "Etapa"}
        </h2>
        <p className="text-sm text-gray-500  mt-1">
          Preencha os campos abaixo para avançar o card no fluxo.
        </p>
      </div>

      <div className="mb-6 p-5 bg-gray-50  rounded-xl border border-dashed border-gray-300 ">
        <Label className="block text-sm font-medium text-gray-700  mb-1">
          Nome do Card 
        </Label>
        <Input
          {...form.register("title")}
          disabled={isDisabled}
          className="w-full rounded-md border-gray-300   text-gray-900  shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {currentStep?.fields?.length ? (
        <CardFormFields
          fields={currentStep.fields}
          form={form}
          isDisabled={isDisabled}
          onCheckboxChange={onCheckboxChange}
          onDateChange={onDateChange}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300  bg-gray-50  p-6 text-center">
          <p className="text-sm text-gray-500 ">
            Nenhum campo configurado nesta etapa.
          </p>
        </div>
      )}
    </div>
  );
}

