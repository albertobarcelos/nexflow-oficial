import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Franchise {
  id: string;
  client_id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFranchiseInput {
  client_id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateFranchiseInput {
  name?: string;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export function useFranchises(clientId?: string | null) {
  return useQuery({
    queryKey: ["franchises", clientId],
    queryFn: async (): Promise<Franchise[]> => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("core_franchises")
        .select("*")
        .eq("client_id", clientId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useCreateFranchise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFranchiseInput): Promise<Franchise> => {
      const { data, error } = await supabase
        .from("core_franchises")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["franchises", variables.client_id] });
      toast.success("Unidade criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao criar unidade");
    },
  });
}

export function useUpdateFranchise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateFranchiseInput;
    }): Promise<Franchise> => {
      const { data, error } = await supabase
        .from("core_franchises")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["franchises", data.client_id] });
      toast.success("Unidade atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar unidade");
    },
  });
}

export function useDeleteFranchise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }): Promise<void> => {
      const { error } = await supabase.from("core_franchises").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["franchises", variables.clientId] });
      toast.success("Unidade excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao excluir unidade");
    },
  });
}
