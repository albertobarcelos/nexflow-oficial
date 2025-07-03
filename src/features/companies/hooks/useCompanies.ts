import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { toast } from "sonner";

type Company = Database["public"]["Tables"]["web_companies"]["Row"];

export interface CompanyWithRelations extends Company {
  cidade?: string;
  estado?: string;
  uf?: string;
  address?: {
    cep?: string | null;
    rua?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
  };
}

interface CreateCompanyData {
  name: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  description?: string;
  segment?: string;
  size?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  city_id?: string;
  state_id?: string;
}

export function useCompanies({ search }: { search?: string } = {}) {
  const queryClient = useQueryClient();

  const {
    data: companies,
    isLoading,
    refetch: refreshCompanies,
  } = useQuery({
    queryKey: ["companies", search],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return [];
      }

      const { data: collaborator } = await supabase
        .from("core_client_users")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!collaborator) {
        toast.error("Colaborador não encontrado");
        return [];
      }

      let query = supabase
        .from("web_companies")
        .select(
          `
          *,
          city:web_cities (
            id,
            name
          ),
          state:web_states (
            id,
            name,
            uf
          )
        `
        )
        .eq("client_id", collaborator.client_id);

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,razao_social.ilike.%${search}%,cnpj.ilike.%${search}%,email.ilike.%${search}%,whatsapp.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar empresas:", error);
        toast.error("Erro ao buscar empresas");
        return [];
      }

      return data.map((company) => ({
        ...company,
        cidade: company.city?.name,
        estado: company.state?.name,
        uf: company.state?.uf,
        address: {
          cep: company.cep,
          rua: company.rua,
          numero: company.numero,
          complemento: company.complemento,
          bairro: company.bairro,
        },
      })) as CompanyWithRelations[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });

  const createCompany = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data: collaborator } = await supabase
        .from("core_client_users")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!collaborator) {
        throw new Error("Colaborador não encontrado");
      }

      const { data: newCompany, error } = await supabase
        .from("web_companies")
        .insert({
          ...data,
          client_id: collaborator.client_id,
          creator_id: user.id,
          company_type: "cliente", // valor padrão
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar empresa:", error);
        throw error;
      }

      return newCompany;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar empresa:", error);
      toast.error("Erro ao criar empresa");
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCompanyData>;
    }) => {
      const { data: updatedCompany, error } = await supabase
        .from("web_companies")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar empresa:", error);
        throw error;
      }

      return updatedCompany;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar empresa:", error);
      toast.error("Erro ao atualizar empresa");
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("web_companies")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao deletar empresa:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa deletada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar empresa:", error);
      toast.error("Erro ao deletar empresa");
    },
  });

  return {
    companies: companies || [],
    isLoading,
    createCompany,
    updateCompany,
    deleteCompany,
    refreshCompanies,
  };
}
