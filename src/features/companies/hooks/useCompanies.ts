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
          state_id,
          city_id,
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
          created_at,
          updated_at
        `);

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar empresas:", error);
        toast.error("Erro ao buscar empresas");
        return [];
      }

      // Transformar os campos de endereço em um objeto
      return data.map(company => ({
        ...company,
        address: {
          cep: company.cep,
          rua: company.rua,
          numero: company.numero,
          complemento: company.complemento,
          bairro: company.bairro
        }
      }));
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

      const { data: result, error } = await supabase
        .from("companies")
        .insert({
          name: data.name,
          razao_social: data.razao_social || null,
          cnpj: data.cnpj || null,
          email: data.email || null,
          whatsapp: data.whatsapp || null,
          instagram: data.instagram || null,
          state_id: data.state_id || null,
          city_id: data.city_id || null,
          company_type: data.company_type,
          cep: data.address?.cep || null,
          rua: data.address?.rua || null,
          numero: data.address?.numero || null,
          complemento: data.address?.complemento || null,
          bairro: data.address?.bairro || null,
          client_id: collaborator.client_id,
        })
        .select(`
          id,
          name,
          razao_social,
          cnpj,
          state_id,
          city_id,
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
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        throw error
      }

      return {
        ...result,
        address: {
          cep: result.cep,
          rua: result.rua,
          numero: result.numero,
          complemento: result.complemento,
          bairro: result.bairro
        }
      }
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

      const { data: result, error } = await supabase
        .from("companies")
        .update({
          name: values.name,
          razao_social: values.razao_social || null,
          cnpj: values.cnpj || null,
          email: values.email || null,
          whatsapp: values.whatsapp || null,
          instagram: values.instagram || null,
          state_id: values.state_id || null,
          city_id: values.city_id || null,
          company_type: values.company_type,
          cep: values.address?.cep || null,
          rua: values.address?.rua || null,
          numero: values.address?.numero || null,
          complemento: values.address?.complemento || null,
          bairro: values.address?.bairro || null,
        })
        .eq("id", id)
        .eq("client_id", collaborator.client_id)
        .select(`
          id,
          name,
          razao_social,
          cnpj,
          state_id,
          city_id,
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
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error("Erro ao atualizar empresa:", error);
        throw new Error(error.message);
      }

      return {
        ...result,
        address: {
          cep: result.cep,
          rua: result.rua,
          numero: result.numero,
          complemento: result.complemento,
          bairro: result.bairro
        }
      };
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
