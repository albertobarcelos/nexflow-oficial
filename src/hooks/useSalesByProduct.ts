import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";

/** Um item do gráfico de vendas por produto: nome do item e valor total (soma dos orçamentos) */
export interface SalesByProductItem {
  label: string;
  value: number;
}

/** Produto em field_values.products (formato CardProduct) */
interface FieldValueProduct {
  itemId?: string;
  itemName?: string;
  totalValue?: number;
}

type CardRow = {
  id: string;
  field_values: Record<string, unknown> | null;
};

/**
 * Vendas agregadas por produto (item de orçamento), sempre considerando client_id.
 * Fonte: cards.field_values.products (produtos/orçamentos lançados nos cards).
 * Agregação: (1) listar todos os produtos em field_values dos cards; (2) tirar repetidos por card
 * (cada card contribui uma vez por produto, somando linhas daquele produto no card); (3) plotar.
 */
export function useSalesByProduct() {
  const { data, isLoading } = useSecureClientQuery<SalesByProductItem[]>({
    queryKey: ["sales-by-product"],
    queryFn: async (client, clientId) => {
      const { data: cards, error } = await client
        .from("cards")
        .select("id, field_values")
        .eq("client_id", clientId);

      if (error) {
        console.error("Erro ao carregar vendas por produto:", error);
        return [];
      }

      if (!cards?.length) return [];

      // Nível 1: por (card_id, produto) — soma totalValue (tira repetidos por card)
      const byCardAndItem = new Map<string, number>();
      const itemLabelByKey = new Map<string, string>();

      for (const card of cards as CardRow[]) {
        const fv = card.field_values as Record<string, unknown> | null;
        const products = fv?.products as FieldValueProduct[] | undefined;
        if (!Array.isArray(products) || products.length === 0) continue;

        for (const p of products) {
          const name = (p.itemName ?? "Sem nome")?.toString().trim() || "Sem nome";
          const itemKey = p.itemId ?? name;
          const cardItemKey = `${card.id}\t${itemKey}`;
          const val = Number(p.totalValue) || 0;

          if (byCardAndItem.has(cardItemKey)) {
            byCardAndItem.set(cardItemKey, byCardAndItem.get(cardItemKey)! + val);
          } else {
            byCardAndItem.set(cardItemKey, val);
            if (!itemLabelByKey.has(itemKey)) {
              itemLabelByKey.set(itemKey, name);
            }
          }
        }
      }

      // Nível 2: por produto — soma os totais entre cards
      const byProduct = new Map<string, { label: string; value: number }>();
      for (const [cardItemKey, value] of byCardAndItem.entries()) {
        const itemKey = cardItemKey.split("\t")[1];
        const label = itemLabelByKey.get(itemKey) ?? "Sem nome";
        if (byProduct.has(itemKey)) {
          byProduct.get(itemKey)!.value += value;
        } else {
          byProduct.set(itemKey, { label, value });
        }
      }

      return Array.from(byProduct.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    },
    queryOptions: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  });

  return {
    data: data ?? [],
    isLoading,
  };
}
