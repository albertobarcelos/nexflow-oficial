import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  useSecureClientMutation,
  invalidateClientQueries,
} from "@/hooks/useSecureClientMutation";

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
      return (data || []) as WebItem[];
    },
    enabled: !!clientId,
  });
}

/** Cria item com client_id garantido pelo useSecureClientMutation (multi-tenant seguro). */
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useSecureClientMutation<WebItem, Error, CreateItemInput>({
    mutationFn: async (client, clientId, input): Promise<WebItem> => {
      const { data, error } = await client
        .from("web_items")
        .insert({ ...input, client_id: clientId })
        .select()
        .single();

      if (error) throw error;
      return data as WebItem;
    },
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["items"]);
        toast.success("Item criado com sucesso!");
      },
      onError: (error: Error) => {
        toast.error(error?.message || "Erro ao criar item");
      },
    },
  });
}

export interface UpdateItemVariables {
  id: string;
  input: UpdateItemInput;
}

/** Atualiza item; client_id validado no resultado (multi-tenant seguro). */
export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useSecureClientMutation<WebItem, Error, UpdateItemVariables>({
    mutationFn: async (client, clientId, { id, input }): Promise<WebItem> => {
      const { data, error } = await client
        .from("web_items")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("client_id", clientId)
        .select()
        .single();

      if (error) throw error;
      return data as WebItem;
    },
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["items"]);
        toast.success("Item atualizado com sucesso!");
      },
      onError: (error: Error) => {
        toast.error(error?.message || "Erro ao atualizar item");
      },
    },
  });
}

/** Exclui item; apenas do client_id atual (multi-tenant seguro). */
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useSecureClientMutation<void, Error, { id: string }>({
    mutationFn: async (client, clientId, { id }): Promise<void> => {
      const { error } = await client
        .from("web_items")
        .delete()
        .eq("id", id)
        .eq("client_id", clientId);

      if (error) throw error;
    },
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["items"]);
        toast.success("Item excluído com sucesso!");
      },
      onError: (error: Error) => {
        toast.error(error?.message || "Erro ao excluir item");
      },
    },
  });
}
