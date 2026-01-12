import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardFormFields } from "./CardFormFields";
import { useItems } from "@/hooks/useItems";
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
  // Buscar produtos do cliente
  const { data: items = [], isLoading: isLoadingItems, error: itemsError } = useItems(card?.clientId);
  
  // Filtrar apenas produtos ativos
  const activeItems = items.filter((item) => item.is_active !== false);
  
  // Observar mudanças no campo produto
  const selectedProductId = useWatch({
    control: form.control,
    name: "product",
  });
  
  // Encontrar o produto selecionado (pode ser ID ou nome)
  const selectedItem = activeItems.find(
    (item) => item.id === selectedProductId || item.name === selectedProductId
  );
  
  // Atualizar valor automaticamente quando produto é selecionado
  useEffect(() => {
    if (!selectedProductId || !selectedItem || activeItems.length === 0) return;
    
    if (selectedItem.price !== null && selectedItem.price !== undefined) {
      // Atualiza o valor apenas quando um produto é selecionado
      // Não sobrescreve se o usuário já editou manualmente o valor
      const currentValue = form.getValues("value");
      
      // Atualiza se o valor estiver vazio
      if (currentValue === null || currentValue === undefined) {
        form.setValue("value", selectedItem.price, { shouldDirty: true });
      }
    }
  }, [selectedProductId, selectedItem, activeItems, form]);
  
  // Normalizar o valor do Select: se o produto foi salvo por nome, converter para ID
  useEffect(() => {
    if (selectedProductId && activeItems.length > 0 && !selectedItem) {
      // Produto não encontrado - pode ser que esteja salvo por nome
      // Tentar encontrar e converter para ID
      const itemByName = activeItems.find((item) => item.name === selectedProductId);
      if (itemByName) {
        form.setValue("product", itemByName.id, { shouldDirty: false });
      }
    }
  }, [selectedProductId, activeItems, selectedItem, form]);
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentStep?.color ?? "#F59E0B" }}
          />
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Etapa Atual
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {currentStep?.title ?? "Etapa"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Preencha os campos abaixo para avançar o card no fluxo.
        </p>
      </div>

      <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome do Card (Identificador)
        </Label>
        <Input
          {...form.register("title")}
          disabled={isDisabled}
          className="w-full max-w-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {card?.cardType === 'finance' && (
        <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Informações Financeiras
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Produto
              </Label>
              <Select
                value={selectedProductId || ""}
                onValueChange={(value) => {
                  form.setValue("product", value, { shouldDirty: true });
                }}
                disabled={isDisabled || isLoadingItems}
              >
                <SelectTrigger className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={isLoadingItems ? "Carregando produtos..." : "Selecione um produto"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingItems ? (
                    <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Carregando produtos...
                    </div>
                  ) : itemsError ? (
                    <div className="py-2 px-3 text-sm text-red-500 dark:text-red-400 text-center">
                      Erro ao carregar produtos
                    </div>
                  ) : activeItems.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Nenhum produto disponível
                    </div>
                  ) : (
                    activeItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                        {item.price !== null && item.price !== undefined && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (R$ {item.price.toFixed(2).replace(".", ",")})
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Valor
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("value", {
                    valueAsNumber: true,
                  })}
                  disabled={isDisabled}
                  placeholder="0,00"
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-10 pr-4 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep?.fields?.length ? (
        <CardFormFields
          fields={currentStep.fields}
          form={form}
          isDisabled={isDisabled}
          onCheckboxChange={onCheckboxChange}
          onDateChange={onDateChange}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum campo configurado nesta etapa.
          </p>
        </div>
      )}
    </div>
  );
}

