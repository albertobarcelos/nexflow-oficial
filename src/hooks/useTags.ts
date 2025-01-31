import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useFunnel } from "./useFunnel";

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  funnel_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagInput {
  name: string;
  color: string;
  description?: string;
}

export function useTags(dealId?: string) {
  const queryClient = useQueryClient();
  const { funnel } = useFunnel();

  // Buscar todas as tags do funil
  const { data: tags = [], isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ["tags", funnel?.id],
    queryFn: async () => {
      if (!funnel?.id) return [];

      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("funnel_id", funnel.id)
        .order("name");

      if (error) {
        toast.error("Erro ao carregar tags");
        throw error;
      }

      return data;
    },
    enabled: !!funnel?.id
  });

  // Buscar tags de um negócio específico
  const { data: dealTags = [], isLoading: isLoadingDealTags } = useQuery<Tag[]>({
    queryKey: ["deal-tags", dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data, error } = await supabase
        .from("deal_tags")
        .select(`
          tags (
            id,
            name,
            color,
            description,
            funnel_id,
            created_at,
            updated_at
          )
        `)
        .eq("deal_id", dealId);

      if (error) {
        toast.error("Erro ao carregar tags do negócio");
        throw error;
      }

      return data.map((item) => item.tags);
    },
    enabled: !!dealId,
  });

  // Criar nova tag
  const createTag = useMutation({
    mutationFn: async (input: CreateTagInput) => {
      if (!funnel?.id) {
        throw new Error("Funil não encontrado");
      }

      const { data, error } = await supabase
        .from("tags")
        .insert({
          ...input,
          funnel_id: funnel.id
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar tag");
        throw error;
      }

      toast.success("Tag criada com sucesso");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tags", funnel?.id]);
    },
  });

  // Adicionar tag a um negócio
  const addTagToDeal = useMutation({
    mutationFn: async ({ dealId, tagId }: { dealId: string; tagId: string }) => {
      const { error } = await supabase
        .from("deal_tags")
        .insert({ deal_id: dealId, tag_id: tagId });

      if (error) {
        toast.error("Erro ao adicionar tag ao negócio");
        throw error;
      }

      toast.success("Tag adicionada com sucesso");
    },
    onSuccess: (_, { dealId }) => {
      queryClient.invalidateQueries(["deal-tags", dealId]);
    },
  });

  // Remover tag de um negócio
  const removeTagFromDeal = useMutation({
    mutationFn: async ({ dealId, tagId }: { dealId: string; tagId: string }) => {
      const { error } = await supabase
        .from("deal_tags")
        .delete()
        .match({ deal_id: dealId, tag_id: tagId });

      if (error) {
        toast.error("Erro ao remover tag do negócio");
        throw error;
      }

      toast.success("Tag removida com sucesso");
    },
    onSuccess: (_, { dealId }) => {
      queryClient.invalidateQueries(["deal-tags", dealId]);
    },
  });

  return {
    tags,
    dealTags,
    isLoadingTags,
    isLoadingDealTags,
    createTag,
    addTagToDeal,
    removeTagFromDeal,
  };
} 
