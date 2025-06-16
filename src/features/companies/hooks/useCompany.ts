import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface Company {
  id: string;
  name: string;
  company_name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  industry?: string;
  company_size?: string;
  annual_revenue?: number;
  description?: string;
  tags?: string[];
  status: 'active' | 'inactive' | 'prospect' | 'customer';
  created_at: string;
  updated_at: string;
  client_id: string;
}

export function useCompany(id: string) {
  const queryClient = useQueryClient();

  const {
    data: company,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("web_companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar empresa:", error);
        throw error;
      }

      return data as Company;
    },
    enabled: !!id,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (updates: Partial<Company>) => {
      const { data, error } = await supabase
        .from("web_companies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar empresa:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar empresa:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("web_companies")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao excluir empresa:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao excluir empresa:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    company,
    isLoading,
    error,
    updateCompany: updateCompanyMutation.mutate,
    deleteCompany: deleteCompanyMutation.mutate,
    isUpdating: updateCompanyMutation.isPending,
    isDeleting: deleteCompanyMutation.isPending,
  };
} 