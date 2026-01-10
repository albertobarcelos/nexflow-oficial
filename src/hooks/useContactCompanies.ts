import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { toast } from "sonner";

export interface ContactCompany {
  id: string;
  contact_id: string;
  company_id: string;
  role: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  client_id: string;
  company?: {
    id: string;
    name: string;
    cnpj: string | null;
    razao_social: string | null;
  };
}

export interface ContactCompanyInput {
  company_id: string;
  role?: string | null;
  is_primary?: boolean;
}

/**
 * Hook para gerenciar relacionamento N:N entre contacts e web_companies
 */
export function useContactCompanies(contactId: string | null) {
  const queryClient = useQueryClient();

  // Query para buscar empresas vinculadas ao contato
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["contact-companies", contactId],
    queryFn: async (): Promise<ContactCompany[]> => {
      if (!contactId) return [];

      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("contact_companies")
        .select(
          `
          *,
          company:web_companies(
            id,
            name,
            cnpj,
            razao_social
          )
        `
        )
        .eq("contact_id", contactId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar empresas do contato:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        company: item.company?.[0] || item.company || null,
      }));
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Mutation para vincular empresa ao contato
  const linkCompany = useMutation({
    mutationFn: async (input: ContactCompanyInput) => {
      if (!contactId) throw new Error("Contact ID é obrigatório");

      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      // Se is_primary for true, remover is_primary de outros relacionamentos
      if (input.is_primary) {
        await nexflowClient()
          .from("contact_companies")
          .update({ is_primary: false })
          .eq("contact_id", contactId)
          .eq("client_id", clientId);
      }

      const { data, error } = await nexflowClient()
        .from("contact_companies")
        .insert({
          contact_id: contactId,
          company_id: input.company_id,
          role: input.role || null,
          is_primary: input.is_primary || false,
          client_id: clientId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-companies", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contact-details", contactId] });
      toast.success("Empresa vinculada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao vincular empresa:", error);
      toast.error(error.message || "Erro ao vincular empresa");
    },
  });

  // Mutation para atualizar relacionamento (role, is_primary)
  const updateCompany = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      role?: string | null;
      is_primary?: boolean;
    }) => {
      if (!contactId) throw new Error("Contact ID é obrigatório");

      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      // Se is_primary for true, remover is_primary de outros relacionamentos
      if (updates.is_primary) {
        await nexflowClient()
          .from("contact_companies")
          .update({ is_primary: false })
          .eq("contact_id", contactId)
          .eq("client_id", clientId)
          .neq("id", id);
      }

      const { data, error } = await nexflowClient()
        .from("contact_companies")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("client_id", clientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-companies", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contact-details", contactId] });
      toast.success("Empresa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar empresa:", error);
      toast.error(error.message || "Erro ao atualizar empresa");
    },
  });

  // Mutation para desvincular empresa
  const unlinkCompany = useMutation({
    mutationFn: async (id: string) => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const { error } = await nexflowClient()
        .from("contact_companies")
        .delete()
        .eq("id", id)
        .eq("client_id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-companies", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contact-details", contactId] });
      toast.success("Empresa desvinculada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao desvincular empresa:", error);
      toast.error(error.message || "Erro ao desvincular empresa");
    },
  });

  return {
    companies,
    isLoading,
    linkCompany: linkCompany.mutateAsync,
    updateCompany: updateCompany.mutateAsync,
    unlinkCompany: unlinkCompany.mutateAsync,
    isLinking: linkCompany.isPending,
    isUpdating: updateCompany.isPending,
    isUnlinking: unlinkCompany.isPending,
  };
}

