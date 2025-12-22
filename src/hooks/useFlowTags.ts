import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { appConfig } from "@/lib/config";
import type { FlowTag } from "@/types/nexflow";
import { toast } from "sonner";

/**
 * Hook para buscar tags de um flow
 */
export function useFlowTags(flowId?: string) {
  return useQuery({
    queryKey: ["flow-tags", flowId],
    queryFn: async (): Promise<FlowTag[]> => {
      if (!flowId) {
        return [];
      }

      // Construir URL com query parameter
      const functionUrl = `${appConfig.supabase.url}/functions/v1/manage-flow-tags?flowId=${encodeURIComponent(flowId)}`;
      
      const session = await supabase.auth.getSession();
      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar tags");
      }

      const result = await response.json();
      return result.tags || [];
    },
    enabled: Boolean(flowId),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

/**
 * Hook para criar uma nova tag
 */
export function useCreateFlowTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      flowId,
      name,
      color,
    }: {
      flowId: string;
      name: string;
      color?: string;
    }): Promise<FlowTag> => {
      try {
        const { data, error } = await supabase.functions.invoke("manage-flow-tags", {
          method: "POST",
          body: {
            flowId,
            name,
            color,
          },
        });

        if (error) {
          console.error("Erro ao invocar edge function:", error);
          throw new Error(error.message || "Erro ao criar tag");
        }

        if (data?.error) {
          console.error("Erro retornado pela edge function:", data.error);
          throw new Error(data.error);
        }

        if (!data?.tag) {
          throw new Error("Resposta inválida da edge function");
        }

        return data.tag;
      } catch (err: any) {
        console.error("Erro completo ao criar tag:", err);
        if (err.message?.includes("404") || err.message?.includes("not found")) {
          throw new Error("Edge function não encontrada. Verifique se a função 'manage-flow-tags' foi deployada.");
        }
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["flow-tags", variables.flowId] });
      toast.success("Tag criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar tag");
    },
  });
}

/**
 * Hook para atualizar uma tag
 */
export function useUpdateFlowTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      color,
    }: {
      id: string;
      name?: string;
      color?: string;
    }): Promise<FlowTag> => {
      try {
        const { data, error } = await supabase.functions.invoke("manage-flow-tags", {
          method: "PUT",
          body: {
            id,
            name,
            color,
          },
        });

        if (error) {
          console.error("Erro ao invocar edge function:", error);
          throw new Error(error.message || "Erro ao atualizar tag");
        }

        if (data?.error) {
          console.error("Erro retornado pela edge function:", data.error);
          throw new Error(data.error);
        }

        if (!data?.tag) {
          throw new Error("Resposta inválida da edge function");
        }

        return data.tag;
      } catch (err: any) {
        console.error("Erro completo ao atualizar tag:", err);
        if (err.message?.includes("404") || err.message?.includes("not found")) {
          throw new Error("Edge function não encontrada. Verifique se a função 'manage-flow-tags' foi deployada.");
        }
        throw err;
      }
    },
    onSuccess: (updatedTag) => {
      queryClient.invalidateQueries({ queryKey: ["flow-tags", updatedTag.flow_id] });
      toast.success("Tag atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar tag");
    },
  });
}

/**
 * Hook para deletar uma tag
 */
export function useDeleteFlowTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, flowId }: { id: string; flowId: string }): Promise<void> => {
      // Construir URL com query parameter
      const functionUrl = `${appConfig.supabase.url}/functions/v1/manage-flow-tags?id=${encodeURIComponent(id)}`;
      
      const session = await supabase.auth.getSession();
      const response = await fetch(functionUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao deletar tag");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["flow-tags", variables.flowId] });
      toast.success("Tag deletada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao deletar tag");
    },
  });
}

