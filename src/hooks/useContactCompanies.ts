import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
import { toast } from "sonner";

/**
 * Hook para gerenciar array company_names na tabela contacts (multi-tenant: queryKey com clientId).
 * Empresas são armazenadas apenas como nomes no array company_names.
 */
export function useContactCompanies(contactId: string | null) {
  const queryClient = useQueryClient();
  const { currentClient } = useClientStore();
  const clientId = currentClient?.id ?? null;

  // Query para buscar nomes de empresas do contato
  const { data: companyNames = [], isLoading } = useQuery({
    queryKey: ["contact-companies", clientId, contactId],
    queryFn: async (): Promise<string[]> => {
      if (!contactId) return [];

      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("contacts" as any)
        .select("company_names")
        .eq("id", contactId)
        .eq("client_id", clientId)
        .single();

      if (error) {
        console.error("Erro ao buscar empresas do contato:", error);
        return [];
      }

      const contactData = (data as any) || null;
      return (contactData?.company_names || []) as string[];
    },
    enabled: !!contactId && !!clientId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Mutation para adicionar nome de empresa ao array
  const addCompany = useMutation({
    mutationFn: async (companyName: string) => {
      if (!contactId) throw new Error("Contact ID é obrigatório");

      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      // Buscar array atual
      const { data, error: fetchError } = await nexflowClient()
        .from("contacts" as any)
        .select("company_names")
        .eq("id", contactId)
        .eq("client_id", clientId)
        .single();

      if (fetchError) throw fetchError;

      const contactData = (data as any) || null;
      const currentNames = ((contactData as any)?.company_names || []) as string[];
      
      // Adicionar se não existir
      if (!currentNames.includes(companyName)) {
        const updatedNames = [...currentNames, companyName];
        
        const { error } = await nexflowClient()
          .from("contacts" as any)
          .update({ company_names: updatedNames })
          .eq("id", contactId)
          .eq("client_id", clientId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ["contact-companies", clientId, contactId] });
        queryClient.invalidateQueries({ queryKey: ["contact-details", clientId, contactId] });
      }
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Empresa adicionada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao adicionar empresa:", error);
      toast.error(error.message || "Erro ao adicionar empresa");
    },
  });

  // Mutation para remover nome de empresa do array
  const removeCompany = useMutation({
    mutationFn: async (companyName: string) => {
      if (!contactId) throw new Error("Contact ID é obrigatório");

      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      // Buscar array atual
      const { data, error: fetchError } = await nexflowClient()
        .from("contacts" as any)
        .select("company_names")
        .eq("id", contactId)
        .eq("client_id", clientId)
        .single();

      if (fetchError) throw fetchError;

      const contactData = (data as any) || null;
      const currentNames = ((contactData as any)?.company_names || []) as string[];
      const updatedNames = currentNames.filter((name) => name !== companyName);

      const { error } = await nexflowClient()
        .from("contacts" as any)
        .update({ company_names: updatedNames })
        .eq("id", contactId)
        .eq("client_id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ["contact-companies", clientId, contactId] });
        queryClient.invalidateQueries({ queryKey: ["contact-details", clientId, contactId] });
      }
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Empresa removida com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao remover empresa:", error);
      toast.error(error.message || "Erro ao remover empresa");
    },
  });

  // Mutation para atualizar array completo de nomes
  const updateCompanyNames = useMutation({
    mutationFn: async (names: string[]) => {
      if (!contactId) throw new Error("Contact ID é obrigatório");

      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const { error } = await nexflowClient()
        .from("contacts" as any)
        .update({ company_names: names })
        .eq("id", contactId)
        .eq("client_id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ["contact-companies", clientId, contactId] });
        queryClient.invalidateQueries({ queryKey: ["contact-details", clientId, contactId] });
      }
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Empresas atualizadas com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar empresas:", error);
      toast.error(error.message || "Erro ao atualizar empresas");
    },
  });

  return {
    companies: companyNames.map((name) => ({ name })), // Formato compatível com componente
    companyNames,
    isLoading,
    addCompany: addCompany.mutateAsync,
    removeCompany: removeCompany.mutateAsync,
    updateCompanyNames: updateCompanyNames.mutateAsync,
    isLinking: addCompany.isPending,
    isUnlinking: removeCompany.isPending,
    isUpdating: updateCompanyNames.isPending,
  };
}

