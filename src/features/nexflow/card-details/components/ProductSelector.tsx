import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus, Trash2, X, ChevronDown } from "lucide-react";
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
import type { CardProduct } from "../types";

interface ProductSelectorProps {
  clientId: string | null | undefined;
  products: CardProduct[];
  onProductsChange: (products: CardProduct[]) => void;
  disabled?: boolean;
  /** Se true, não exibe cabeçalho e descrição (para uso em wizard) */
  compact?: boolean;
}

/**
 * Seletor de produtos/orçamento reutilizável.
 * Usado no wizard de novo card e na aba de produtos do CardDetailsModal.
 */
export function ProductSelector({
  clientId,
  products,
  onProductsChange,
  disabled = false,
  compact = false,
}: ProductSelectorProps) {
  const { data: items = [], isLoading: isLoadingItems, error: itemsError } =
    useItems(clientId);
  const activeItems = items.filter((item) => item.is_active !== false);

  const setProducts = useCallback(
    (updater: (prev: CardProduct[]) => CardProduct[]) => {
      onProductsChange(updater(products));
    },
    [products, onProductsChange]
  );

  const totalValue =
    products.reduce((sum, p) => sum + (p.totalValue || 0), 0) ?? 0;

  const handleAddProduct = useCallback(() => {
    setProducts((prev) => [
      ...prev,
      {
        id: uuidv4(),
        itemId: "",
        itemName: "",
        itemPrice: 0,
        modularFields: [],
        totalValue: 0,
        isModularEnabled: false,
      },
    ]);
  }, [setProducts]);

  const handleRemoveProduct = useCallback(
    (index: number) => {
      if (products.length <= 1) return;
      setProducts((prev) => prev.filter((_, i) => i !== index));
    },
    [products.length, setProducts]
  );

  const handleProductChange = useCallback(
    (index: number, itemId: string) => {
      const item = activeItems.find((i) => i.id === itemId);
      if (!item) return;
      setProducts((prev) => {
        const p = prev[index]!;
        const updated: CardProduct = {
          ...p,
          itemId: item.id,
          itemName: item.name,
          itemPrice: item.price ? Number(item.price) : 0,
          totalValue: item.price ? Number(item.price) : 0,
        };
        const modularTotal = (updated.modularFields ?? []).reduce(
          (sum, f) => sum + (f.value || 0),
          0
        );
        updated.totalValue = updated.itemPrice + modularTotal;
        const next = [...prev];
        next[index] = updated;
        return next;
      });
    },
    [activeItems, setProducts]
  );

  const handleProductPriceChange = useCallback(
    (index: number, price: number) => {
      setProducts((prev) => {
        const p = prev[index]!;
        const modularTotal = (p.modularFields ?? []).reduce(
          (sum, f) => sum + (f.value || 0),
          0
        );
        const next = [...prev];
        next[index] = {
          ...p,
          itemPrice: price,
          totalValue: price + modularTotal,
        };
        return next;
      });
    },
    [setProducts]
  );

  const handleToggleModular = useCallback(
    (index: number, enabled: boolean) => {
      setProducts((prev) => {
        const p = prev[index]!;
        const modularFields = enabled ? p.modularFields ?? [] : [];
        const modularTotal = modularFields.reduce(
          (sum, f) => sum + (f.value || 0),
          0
        );
        const next = [...prev];
        next[index] = {
          ...p,
          isModularEnabled: enabled,
          modularFields,
          totalValue: p.itemPrice + modularTotal,
        };
        return next;
      });
    },
    [setProducts]
  );

  const handleAddModularField = useCallback(
    (productIndex: number) => {
      setProducts((prev) => {
        const p = prev[productIndex]!;
        const newFields = [
          ...(p.modularFields ?? []),
          { id: uuidv4(), description: "", value: 0 },
        ];
        const modularTotal = newFields.reduce(
          (sum, f) => sum + (f.value || 0),
          0
        );
        const next = [...prev];
        next[productIndex] = {
          ...p,
          isModularEnabled: true,
          modularFields: newFields,
          totalValue: p.itemPrice + modularTotal,
        };
        return next;
      });
    },
    [setProducts]
  );

  const handleRemoveModularField = useCallback(
    (productIndex: number, fieldIndex: number) => {
      setProducts((prev) => {
        const p = prev[productIndex]!;
        const newFields = (p.modularFields ?? []).filter(
          (_, i) => i !== fieldIndex
        );
        const modularTotal = newFields.reduce(
          (sum, f) => sum + (f.value || 0),
          0
        );
        const next = [...prev];
        next[productIndex] = {
          ...p,
          modularFields: newFields,
          totalValue: p.itemPrice + modularTotal,
        };
        return next;
      });
    },
    [setProducts]
  );

  const handleModularFieldChange = useCallback(
    (
      productIndex: number,
      fieldIndex: number,
      field: "description" | "value",
      value: string | number
    ) => {
      setProducts((prev) => {
        const p = prev[productIndex]!;
        const modularFields = (p.modularFields ?? []).map((f, i) =>
          i === fieldIndex ? { ...f, [field]: value } : f
        );
        const modularTotal = modularFields.reduce(
          (sum, f) => sum + (f.value || 0),
          0
        );
        const next = [...prev];
        next[productIndex] = {
          ...p,
          modularFields,
          totalValue: p.itemPrice + modularTotal,
        };
        return next;
      });
    },
    [setProducts]
  );

  if (!clientId) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum cliente selecionado para listar produtos.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Produtos e Valores
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie os produtos vinculados e adicione modulagens quando
            necessário.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {products.map((product, index) => {
          const isModularEnabled =
            product.isModularEnabled ??
            (product.modularFields && product.modularFields.length > 0);

          return (
            <div
              key={product.id}
              className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Produto {index + 1}
                </h3>
                {products.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProduct(index)}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Produto
                  </Label>
                  <Select
                    value={product.itemId || ""}
                    onValueChange={(value) => handleProductChange(index, value)}
                    disabled={disabled || isLoadingItems}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um produto" />
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </SelectTrigger>
                    <SelectContent
                      className="z-[100]"
                      position="popper"
                      sideOffset={4}
                    >
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
                            {item.price != null && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                (R${" "}
                                {Number(item.price)
                                  .toFixed(2)
                                  .replace(".", ",")})
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor do Produto
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={product.itemPrice || 0}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        if (v !== (product.itemPrice || 0))
                          handleProductPriceChange(index, v);
                      }}
                      disabled={disabled}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-gray-900 dark:text-white">
                      Modulagem
                    </Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Adicione campos extras ao produto
                    </span>
                  </div>
                  <Switch
                    checked={isModularEnabled}
                    onCheckedChange={(checked) =>
                      handleToggleModular(index, checked)
                    }
                    disabled={disabled}
                  />
                </div>

                {isModularEnabled && (
                  <div className="space-y-3 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-gray-900 dark:text-white">
                        Campos de Modulagem
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddModularField(index)}
                        disabled={disabled}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Campo
                      </Button>
                    </div>
                    {(product.modularFields ?? []).length > 0 ? (
                      <div className="space-y-3">
                        {(product.modularFields ?? []).map(
                          (modularField, fieldIndex) => (
                            <div
                              key={modularField.id}
                              className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex-1 space-y-2">
                                <Input
                                  placeholder="Descrição (ex: Delivery)"
                                  value={modularField.description}
                                  onChange={(e) =>
                                    handleModularFieldChange(
                                      index,
                                      fieldIndex,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  disabled={disabled}
                                  className="text-sm"
                                />
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                                    R$
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={modularField.value || 0}
                                    onChange={(e) =>
                                      handleModularFieldChange(
                                        index,
                                        fieldIndex,
                                        "value",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    disabled={disabled}
                                    placeholder="0,00"
                                    className="pl-10 text-sm"
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveModularField(index, fieldIndex)
                                }
                                disabled={disabled}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                        Nenhum campo de modulagem. Clique em &quot;Adicionar
                        Campo&quot; para começar.
                      </p>
                    )}
                  </div>
                )}

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Valor Total do Produto:
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      R${" "}
                      {(product.totalValue ?? 0)
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAddProduct}
        disabled={disabled}
        className="w-[200px]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Produto
      </Button>

      {products.length > 0 && (
        <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Valor Total Geral:
            </span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              R$ {totalValue.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
