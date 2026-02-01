import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import type { FlowTag } from "@/types/nexflow";
import { toast } from "sonner";

/**
 * Interface para tag de card (com informações da tag)
 */
export interface CardTag extends FlowTag {
  assigned_at: string;
}

/**
 * Hook para buscar tags de um card específico
 */
export function useCardTags(cardId?: string) {
  return useQuery({
    queryKey: ["card-tags", cardId],
    queryFn: async (): Promise<CardTag[]> => {
      if (!cardId) {
        return [];
      }

      const client = nexflowClient();

      // Primeiro, buscar os card_tags
      const { data: cardTagsData, error: cardTagsError } = await client
        .from("card_tags")
        .select("tag_id, assigned_at")
        .eq("card_id", cardId);

      if (cardTagsError) {
        console.error("Erro ao buscar tags do card:", cardTagsError);
        throw new Error("Erro ao buscar tags do card");
      }

      if (!cardTagsData || cardTagsData.length === 0) {
        return [];
      }

      // Extrair os IDs das tags
      const tagIds = cardTagsData.map((ct) => ct.tag_id);

      // Buscar as informações das tags
      const { data: flowTagsData, error: flowTagsError } = await client
        .from("flow_tags")
        .select("id, flow_id, name, color, created_at")
        .in("id", tagIds);

      if (flowTagsError) {
        console.error("Erro ao buscar informações das tags:", flowTagsError);
        throw new Error("Erro ao buscar informações das tags");
      }

      if (!flowTagsData) {
        return [];
      }

      // Criar um mapa de tags por ID para facilitar o join
      const tagsMap = new Map<string, typeof flowTagsData[0]>(
        flowTagsData.map((tag) => [tag.id, tag] as [string, typeof tag])
      );

      // Mapear os dados para o formato CardTag
      return cardTagsData
        .map((cardTag) => {
          const tag = tagsMap.get(cardTag.tag_id);
          if (!tag) {
            return null;
          }
          return {
            ...tag,
            assigned_at: cardTag.assigned_at,
          };
        })
        .filter((tag): tag is CardTag => tag !== null);
    },
    enabled: Boolean(cardId),
    staleTime: 1000 * 60 * 2, // Cache por 2 minutos
  });
}

/**
 * Hook para adicionar uma tag a um card
 */
export function useAddCardTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      tagId,
    }: {
      cardId: string;
      tagId: string;
    }): Promise<void> => {
      const client = nexflowClient();

      // Verificar se a tag já está associada ao card
      const { data: existing, error: checkError } = await client
        .from("card_tags")
        .select("card_id, tag_id")
        .eq("card_id", cardId)
        .eq("tag_id", tagId)
        .maybeSingle();

      if (checkError) {
        console.error("Erro ao verificar tag existente:", checkError);
        throw new Error("Erro ao verificar tag existente");
      }

      if (existing) {
        throw new Error("Esta tag já está associada ao card");
      }

      // Verificar se o card e a tag pertencem ao mesmo flow
      const { data: cardData, error: cardError } = await client
        .from("cards")
        .select("flow_id")
        .eq("id", cardId)
        .single();

      if (cardError || !cardData) {
        throw new Error("Card não encontrado");
      }

      const { data: tagData, error: tagError } = await client
        .from("flow_tags")
        .select("flow_id")
        .eq("id", tagId)
        .single();

      if (tagError || !tagData) {
        throw new Error("Tag não encontrada");
      }

      if (cardData.flow_id !== tagData.flow_id) {
        throw new Error("A tag não pertence ao mesmo flow do card");
      }

      // Adicionar tag ao card
      const { error: insertError } = await client
        .from("card_tags")
        .insert({
          card_id: cardId,
          tag_id: tagId,
        });

      if (insertError) {
        console.error("Erro ao adicionar tag ao card:", insertError);
        throw new Error("Erro ao adicionar tag ao card");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["card-tags", variables.cardId] });
      toast.success("Tag adicionada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar tag");
    },
  });
}

/**
 * Hook para remover uma tag de um card
 */
export function useRemoveCardTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      tagId,
    }: {
      cardId: string;
      tagId: string;
    }): Promise<void> => {
      const client = nexflowClient();

      const { error } = await client
        .from("card_tags")
        .delete()
        .eq("card_id", cardId)
        .eq("tag_id", tagId);

      if (error) {
        console.error("Erro ao remover tag do card:", error);
        throw new Error("Erro ao remover tag do card");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["card-tags", variables.cardId] });
      toast.success("Tag removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover tag");
    },
  });
}

