import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { toast } from "sonner";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];
type Deal = Database["public"]["Tables"]["deals"]["Row"];

export interface CompanyFormData {
  name: string;
  razao_social?: string | null;
  cnpj?: string | null;
  state_id?: string | null;
  city_id?: string | null;
  company_type: string;
  email?: string | null;
  whatsapp?: string | null;
  celular?: string | null;
  instagram?: string | null;
  address?: {
    cep?: string | null;
    rua?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
  };
}

export function useCompanies(filters?: { search?: string }) {
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies", filters],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) {
        toast.error("Colaborador não encontrado");
        return [];
      }

      let query = supabase
        .from("companies")
        .select(`
          id,
          name,
          razao_social,
          cnpj,
          client_id,
          company_type,
          email,
          whatsapp,
          celular,
          instagram,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          state_id,
          city_id,
          created_at,
          updated_at,
          city:cities(name),
          state:states(name)
        `)
        .eq("client_id", collaborator.client_id);

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,razao_social.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%,whatsapp.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching companies:", error);
        toast.error("Erro ao carregar empresas");
        return [];
      }

      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (!collaborator?.client_id) {
        throw new Error("Colaborador não encontrado")
      }

      const { data: company, error } = await supabase
        .from("companies")
        .insert({
          name: data.name,
          razao_social: data.razao_social,
          cnpj: data.cnpj,
          client_id: collaborator.client_id,
          company_type: data.company_type,
          state_id: data.state_id || null,
          city_id: data.city_id || null,
          email: data.email,
          whatsapp: data.whatsapp,
          celular: data.celular,
          instagram: data.instagram,
          cep: data.address?.cep,
          rua: data.address?.rua,
          numero: data.address?.numero,
          complemento: data.address?.complemento,
          bairro: data.address?.bairro,
        })
        .select(`
          id,
          name,
          razao_social,
          cnpj,
          client_id,
          company_type,
          email,
          whatsapp,
          celular,
          instagram,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          state_id,
          city_id,
          created_at,
          updated_at,
          city:cities(name),
          state:states(name)
        `)
        .single()

      if (error) {
        throw error
      }

      return company
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"], refetchType: "active" })
    },
    onError: (error: Error) => {
      console.error("Erro ao criar empresa:", error)
      throw error
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, ...values }: CompanyUpdate & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      const { data, error } = await supabase
        .from("companies")
        .update(values)
        .eq("id", id)
        .eq("client_id", collaborator.client_id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar empresa:", error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar empresa:", error);
      toast.error(error.message || "Erro ao atualizar empresa. Tente novamente.");
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", id)
        .eq("client_id", collaborator.client_id);

      if (error) {
        console.error("Erro ao excluir empresa:", error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa excluída com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao excluir empresa:", error);
      toast.error(error.message || "Erro ao excluir empresa. Tente novamente.");
    },
  });

  const getCompanyDeals = async (companyId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: collaborator } = await supabase
      .from("collaborators")
      .select("client_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!collaborator) throw new Error("Colaborador não encontrado");

    const { data: deals, error } = await supabase
      .from("deals")
      .select(`
        id,
        description,
        value,
        stage:funnel_stages(name),
        created_at
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar negócios:", error);
      throw new Error(error.message);
    }

    return deals.map(deal => ({
      id: deal.id,
      name: deal.description,
      value: deal.value,
      stage: deal.stage,
      created_at: deal.created_at
    }));
  };

  const { mutateAsync: deleteDeal } = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", dealId);

      if (error) {
        console.error("Erro ao excluir negócio:", error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Negócio excluído com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao excluir negócio:", error);
      toast.error(error.message || "Erro ao excluir negócio. Tente novamente.");
    },
  });

  return {
    companies,
    isLoading,
    createCompany: createCompanyMutation.mutateAsync,
    updateCompany: updateCompanyMutation.mutateAsync,
    deleteCompany: deleteCompanyMutation.mutateAsync,
    getCompanyDeals,
    deleteDeal,
  };
}
