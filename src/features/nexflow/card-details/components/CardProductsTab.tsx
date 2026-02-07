import { useEffect, useMemo, useCallback, useRef } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { Plus, Trash2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useItems } from "@/hooks/useItems";
import type { UseFormReturn } from "react-hook-form";
import type { CardFormValues, CardProduct } from "../types";
import type { NexflowCard } from "@/types/nexflow";

interface CardProductsTabProps {
  card: NexflowCard | null;
  form: UseFormReturn<CardFormValues>;
  isDisabled: boolean;
}

export function CardProductsTab({
  card,
  form,
  isDisabled,
}: CardProductsTabProps) {
  // Buscar produtos do cliente
  const { data: items = [], isLoading: isLoadingItems, error: itemsError } = useItems(card?.clientId);
  
  // Filtrar apenas produtos ativos
  const activeItems = items.filter((item) => item.is_active !== false);

  // Memoizar produtos salvos para comparação - usar JSON.stringify para detectar mudanças profundas
  const fieldValuesKey = useMemo(() => {
    if (!card?.fieldValues) return "";
    return JSON.stringify(card.fieldValues);
  }, [card?.id, card?.fieldValues]);

  const savedProductsKey = useMemo(() => {
    if (!card) return "";
    const fieldValues = card.fieldValues as Record<string, any>;
    const products = fieldValues?.products as CardProduct[] | undefined;
    // Criar uma chave única baseada no conteúdo dos produtos
    return JSON.stringify(products || []);
  }, [card?.id, fieldValuesKey]);

  const savedProducts = useMemo(() => {
    if (!card) return undefined;
    const fieldValues = card.fieldValues as Record<string, any>;
    return fieldValues?.products as CardProduct[] | undefined;
  }, [card?.id, savedProductsKey]);

  // Inicializar produtos do field_values se existirem
  useEffect(() => {
    if (!card) {
      // Garantir que products está inicializado como array vazio
      const currentProducts = form.getValues("products");
      if (!currentProducts || currentProducts.length === 0) {
        form.setValue("products", [], { shouldDirty: false });
      }
      return;
    }
    
    const currentProducts = form.getValues("products") || [];
    
    // Comparar produtos salvos com atuais usando JSON para detectar mudanças reais
    const savedProductsStr = savedProducts ? JSON.stringify(savedProducts) : "[]";
    const currentProductsStr = currentProducts.length > 0 ? JSON.stringify(currentProducts) : "[]";
    
    // Se são diferentes, atualizar
    if (savedProductsStr !== currentProductsStr) {
      if (savedProducts && savedProducts.length > 0) {
        // Garantir que todos os produtos têm isModularEnabled definido
        const normalizedProducts = savedProducts.map(p => ({
          ...p,
          isModularEnabled: p.isModularEnabled ?? (p.modularFields && p.modularFields.length > 0),
        }));
        form.setValue("products", normalizedProducts, { shouldDirty: false });
      } else {
        // Se não houver produtos salvos mas houver product/value antigo, migrar
        if (card.product && card.value && activeItems.length > 0) {
          const item = activeItems.find(
            (i) => i.id === card.product || i.name === card.product
          );
          if (item) {
            const migratedProduct: CardProduct = {
              id: uuidv4(),
              itemId: item.id,
              itemName: item.name,
              itemPrice: Number(card.value),
              modularFields: [],
              totalValue: Number(card.value),
              isModularEnabled: false,
            };
            form.setValue("products", [migratedProduct], { shouldDirty: false });
          } else {
            form.setValue("products", [], { shouldDirty: false });
          }
        } else {
          // Inicializar com array vazio se não houver nada
          form.setValue("products", [], { shouldDirty: false });
        }
      }
    }
  }, [card?.id, savedProductsKey, activeItems.length, form, savedProducts]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const products = useWatch({
    control: form.control,
    name: "products",
  }) as CardProduct[] | undefined;

  // Calcular valor total de todos os produtos
  const totalValue = useMemo(() => {
    if (!products || products.length === 0) return 0;
    return products.reduce((sum, product) => sum + (product.totalValue || 0), 0);
  }, [products]);

  // Ref para rastrear se estamos atualizando (evitar loops)
  const isUpdatingRef = useRef(false);

  // Atualizar valor total do card quando produtos mudarem (debounced)
  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    const timeoutId = setTimeout(() => {
      form.setValue("value", totalValue, { shouldDirty: true });
      
      // Manter compatibilidade: product será o primeiro produto
      if (products && products.length > 0) {
        form.setValue("product", products[0].itemId, { shouldDirty: false });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [totalValue, products, form]);

  const handleAddProduct = useCallback(() => {
    const newProduct: CardProduct = {
      id: uuidv4(),
      itemId: "",
      itemName: "",
      itemPrice: 0,
      modularFields: [],
      totalValue: 0,
      isModularEnabled: false,
    };
    append(newProduct);
  }, [append]);

  const handleRemoveProduct = (index: number) => {
    if (fields.length <= 1) {
      // Não permitir remover se for o único produto
      return;
    }
    remove(index);
  };

  const handleProductChange = useCallback((index: number, itemId: string) => {
    const item = activeItems.find((i) => i.id === itemId);
    if (!item) return;

    isUpdatingRef.current = true;
    const currentProducts = form.getValues("products") || [];
    const updatedProduct: CardProduct = {
      ...currentProducts[index],
      itemId: item.id,
      itemName: item.name,
      itemPrice: item.price ? Number(item.price) : 0,
      totalValue: item.price ? Number(item.price) : 0,
    };

    // Recalcular totalValue incluindo modulagens
    const modularTotal = updatedProduct.modularFields.reduce(
      (sum, field) => sum + (field.value || 0),
      0
    );
    updatedProduct.totalValue = updatedProduct.itemPrice + modularTotal;

    const updatedProducts = [...currentProducts];
    updatedProducts[index] = updatedProduct;
    form.setValue("products", updatedProducts, { shouldDirty: true });
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 150);
  }, [activeItems, form]);

  const handleProductPriceChange = useCallback((index: number, price: number) => {
    isUpdatingRef.current = true;
    const currentProducts = form.getValues("products") || [];
    const updatedProduct: CardProduct = {
      ...currentProducts[index],
      itemPrice: price,
    };

    // Recalcular totalValue
    const modularTotal = updatedProduct.modularFields.reduce(
      (sum, field) => sum + (field.value || 0),
      0
    );
    updatedProduct.totalValue = updatedProduct.itemPrice + modularTotal;

    const updatedProducts = [...currentProducts];
    updatedProducts[index] = updatedProduct;
    
    form.setValue("products", updatedProducts, { shouldDirty: true });
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [form]);

  const handleToggleModular = useCallback((index: number, enabled: boolean) => {
    isUpdatingRef.current = true;
    const currentProducts = form.getValues("products") || [];
    const updatedProduct: CardProduct = {
      ...currentProducts[index],
      isModularEnabled: enabled,
      // Se enabled é false, limpar os campos de modulagem
      modularFields: enabled ? (currentProducts[index].modularFields || []) : [],
    };

    // Recalcular totalValue
    if (!enabled) {
      updatedProduct.totalValue = updatedProduct.itemPrice;
    } else {
      const modularTotal = updatedProduct.modularFields.reduce(
        (sum, field) => sum + (field.value || 0),
        0
      );
      updatedProduct.totalValue = updatedProduct.itemPrice + modularTotal;
    }

    const updatedProducts = [...currentProducts];
    updatedProducts[index] = updatedProduct;
    form.setValue("products", updatedProducts, { shouldDirty: true });
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 150);
  }, [form]);

  const handleAddModularField = useCallback((productIndex: number) => {
    isUpdatingRef.current = true;
    const currentProducts = form.getValues("products") || [];
    const updatedProduct: CardProduct = {
      ...currentProducts[productIndex],
      isModularEnabled: true, // Ativar modulagem ao adicionar campo
      modularFields: [
        ...(currentProducts[productIndex].modularFields || []),
        {
          id: uuidv4(),
          description: "",
          value: 0,
        },
      ],
    };

    // Recalcular totalValue
    const modularTotal = updatedProduct.modularFields.reduce(
      (sum, field) => sum + (field.value || 0),
      0
    );
    updatedProduct.totalValue = updatedProduct.itemPrice + modularTotal;

    const updatedProducts = [...currentProducts];
    updatedProducts[productIndex] = updatedProduct;
    form.setValue("products", updatedProducts, { shouldDirty: true });
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 150);
  }, [form]);

  const handleRemoveModularField = useCallback((productIndex: number, fieldIndex: number) => {
    isUpdatingRef.current = true;
    const currentProducts = form.getValues("products") || [];
    const updatedProduct: CardProduct = {
      ...currentProducts[productIndex],
      modularFields: (currentProducts[productIndex].modularFields || []).filter(
        (_, i) => i !== fieldIndex
      ),
    };

    // Recalcular totalValue
    const modularTotal = updatedProduct.modularFields.reduce(
      (sum, field) => sum + (field.value || 0),
      0
    );
    updatedProduct.totalValue = updatedProduct.itemPrice + modularTotal;

    const updatedProducts = [...currentProducts];
    updatedProducts[productIndex] = updatedProduct;
    form.setValue("products", updatedProducts, { shouldDirty: true });
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 150);
  }, [form]);

  const handleModularFieldChange = useCallback((
    productIndex: number,
    fieldIndex: number,
    field: "description" | "value",
    value: string | number
  ) => {
    isUpdatingRef.current = true;
    const currentProducts = form.getValues("products") || [];
    const updatedProduct: CardProduct = {
      ...currentProducts[productIndex],
      modularFields: (currentProducts[productIndex].modularFields || []).map((f, i) =>
        i === fieldIndex ? { ...f, [field]: value } : f
      ),
    };

    // Recalcular totalValue
    const modularTotal = updatedProduct.modularFields.reduce(
      (sum, field) => sum + (field.value || 0),
      0
    );
    updatedProduct.totalValue = updatedProduct.itemPrice + modularTotal;

    const updatedProducts = [...currentProducts];
    updatedProducts[productIndex] = updatedProduct;
    
    form.setValue("products", updatedProducts, { shouldDirty: true });
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [form]);


  if (!card || card.cardType !== "finance") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500 ">
          Esta seção está disponível apenas para cards financeiros.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 ">
          Produtos e Valores
        </h2>
        <p className="text-sm text-gray-500  mt-1">
          Gerencie os produtos vinculados a este card e adicione modulagens quando necessário.
        </p>
      </div>

      {/* Lista de Produtos */}
      <div className="space-y-4">
        {fields.map((field, index) => {
          const product = products?.[index];
          const hasModular = product?.modularFields && product.modularFields.length > 0;
          const isModularEnabled = product?.isModularEnabled ?? false;

          return (
            <div
              key={field.id}
              className="p-5 bg-gray-50  rounded-xl border border-gray-200 "
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 ">
                  Produto {index + 1}
                </h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProduct(index)}
                    disabled={isDisabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 :bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Seleção de Produto */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700  mb-2">
                    Produto
                  </Label>
                  <Select
                    value={product?.itemId || ""}
                    onValueChange={(value) => handleProductChange(index, value)}
                    disabled={isDisabled || isLoadingItems}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingItems ? (
                        <div className="py-2 px-3 text-sm text-gray-500  text-center">
                          Carregando produtos...
                        </div>
                      ) : itemsError ? (
                        <div className="py-2 px-3 text-sm text-red-500  text-center">
                          Erro ao carregar produtos
                        </div>
                      ) : activeItems.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-gray-500  text-center">
                          Nenhum produto disponível
                        </div>
                      ) : (
                        activeItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                            {item.price !== null && item.price !== undefined && (
                              <span className="ml-2 text-xs text-gray-500 ">
                                (R$ {item.price.toFixed(2).replace(".", ",")})
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor do Produto */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700  mb-2">
                    Valor do Produto
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 ">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={product?.itemPrice || 0}
                      key={`price-${field.id}-${product?.itemPrice || 0}`}
                      onBlur={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        if (newValue !== (product?.itemPrice || 0)) {
                          handleProductPriceChange(index, newValue);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      disabled={isDisabled}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Toggle Modulagem */}
                <div className="flex items-center justify-between p-3 bg-white  rounded-lg border border-gray-200 ">
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-gray-900 ">
                      Modulagem
                    </Label>
                    <span className="text-xs text-gray-500 ">
                      Adicione campos extras ao produto
                    </span>
                  </div>
                  <Switch
                    checked={isModularEnabled}
                    onCheckedChange={(checked) => handleToggleModular(index, checked)}
                    disabled={isDisabled}
                  />
                </div>

                {/* Campos de Modulagem */}
                {isModularEnabled && (
                  <div className="space-y-3 p-4 bg-white  rounded-lg border border-gray-200 ">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-gray-900 ">
                        Campos de Modulagem
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddModularField(index)}
                        disabled={isDisabled}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Campo
                      </Button>
                    </div>

                    {product?.modularFields && product.modularFields.length > 0 ? (
                      <div className="space-y-3">
                        {product.modularFields.map((modularField, fieldIndex) => (
                          <div
                            key={modularField.id}
                            className="flex gap-2 items-start p-3 bg-gray-50  rounded-lg"
                          >
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Descrição (ex: Delivery)"
                                defaultValue={modularField.description}
                                key={`desc-${modularField.id}-${modularField.description}`}
                                onBlur={(e) => {
                                  const newValue = e.target.value;
                                  if (newValue !== modularField.description) {
                                    handleModularFieldChange(
                                      index,
                                      fieldIndex,
                                      "description",
                                      newValue
                                    );
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                disabled={isDisabled}
                                className="text-sm"
                              />
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500  text-sm">
                                  R$
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0,00"
                                  defaultValue={modularField.value || 0}
                                  key={`value-${modularField.id}-${modularField.value || 0}`}
                                  onBlur={(e) => {
                                    const newValue = parseFloat(e.target.value) || 0;
                                    if (newValue !== (modularField.value || 0)) {
                                      handleModularFieldChange(
                                        index,
                                        fieldIndex,
                                        "value",
                                        newValue
                                      );
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  disabled={isDisabled}
                                  className="pl-10 text-sm"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveModularField(index, fieldIndex)}
                              disabled={isDisabled}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 :bg-red-900/20"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500  text-center py-2">
                        Nenhum campo de modulagem adicionado. Clique em "Adicionar Campo" para começar.
                      </p>
                    )}
                  </div>
                )}

                {/* Valor Total do Produto */}
                <div className="p-3 bg-blue-50  rounded-lg border border-blue-200 ">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 ">
                      Valor Total do Produto:
                    </span>
                    <span className="text-lg font-bold text-blue-600 ">
                      R$ {product?.totalValue?.toFixed(2).replace(".", ",") || "0,00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Adicionar Produto */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddProduct}
        disabled={isDisabled}
        className="w-[200px]"
      >
        <Plus className="h-4 w-4 mr-2 aling" />
        Adicionar Produto
      </Button>

      {/* Valor Total Geral */}
      {fields.length > 0 && (
        <div className="p-5 bg-green-50  rounded-xl border border-green-200 ">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900 ">
              Valor Total Geral:
            </span>
            <span className="text-2xl font-bold text-green-600 ">
              R$ {totalValue.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
