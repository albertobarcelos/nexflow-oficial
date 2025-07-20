import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CreateCompanyData } from "../types";

// AIDEV-NOTE: Hook para mutações CRUD de empresas
// Centraliza operações de criação, atualização e exclusão

export function useCompanyMutations(goToPage: (page: number) => void) {
  const queryClient = useQueryClient();

  const createMutation = <T>(
    mutationFn: (args: T) => Promise<any>,
    successMessage: string
  ) => useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies-paginated"] });
      toast.success(successMessage);
      goToPage(1);
    },
    onError: (error: any) => toast.error(error.message || "Erro na operação"),
  });

  const getAuthData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: collaborator } = await supabase
      .from("core_client_users")
      .select("client_id")
      .eq("id", user.id)
      .single();
    if (!collaborator) throw new Error("Colaborador não encontrado");

    return { user, clientId: collaborator.client_id };
  };

  const createCompany = createMutation(
    async (data: CreateCompanyData) => {
      const { user, clientId } = await getAuthData();
      const { data: newCompany, error } = await supabase
        .from("web_companies")
        .insert({ ...data, client_id: clientId, creator_id: user.id, company_type: "cliente" })
        .select()
        .single();
      if (error) throw error;
      return newCompany;
    },
    "Empresa criada com sucesso!"
  );

  const updateCompany = createMutation(
    async ({ id, data }: { id: string; data: Partial<CreateCompanyData> }) => {
      const { data: updated, error } = await supabase
        .from("web_companies")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    "Empresa atualizada com sucesso!"
  );

  const deleteCompany = createMutation(
    async (id: string) => {
      const { error } = await supabase.from("web_companies").delete().eq("id", id);
      if (error) throw error;
    },
    "Empresa deletada com sucesso!"
  );

  return {
    createCompany,
    updateCompany,
    deleteCompany,
  };
}