import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface WebItem {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  price: number | null;
  item_code: string | null;
  item_type: "product" | "service";
  billing_type: "one_time" | "recurring";
  metadata: any;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateItemInput {
  client_id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  item_code?: string | null;
  item_type: "product" | "service";
  billing_type: "one_time" | "recurring";
  metadata?: any;
  is_active?: boolean;
}

export interface UpdateItemInput {
  name?: string;
  description?: string | null;
  price?: number | null;
  item_code?: string | null;
  item_type?: "product" | "service";
  billing_type?: "one_time" | "recurring";
  metadata?: any;
  is_active?: boolean;
}

export function useItems(clientId?: string | null) {
  return useQuery({
    queryKey: ["items", clientId],
    queryFn: async (): Promise<WebItem[]> => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("web_items")
        .select("*")
        .eq("client_id", clientId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateItemInput): Promise<WebItem> => {
      const { data, error } = await supabase
        .from("web_items")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.client_id] });
      toast.success("Item criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao criar item");
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateItemInput;
    }): Promise<WebItem> => {
      const { data, error } = await supabase
        .from("web_items")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items", data.client_id] });
      toast.success("Item atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar item");
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }): Promise<void> => {
      const { error } = await supabase.from("web_items").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.clientId] });
      toast.success("Item excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao excluir item");
    },
  });
}
