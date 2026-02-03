import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { toast } from "sonner";

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  razao_social: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyInput {
  name: string;
  cnpj?: string | null;
  razao_social?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  state_id?: string | null;
  city_id?: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
}

/**
 * Hook para buscar e gerenciar empresas da tabela web_companies
 */
export function useCompanies() {
  const queryClient = useQueryClient();

  // Query para buscar todas as empresas
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async (): Promise<Company[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        console.error("Não foi possível identificar o tenant atual.");
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("web_companies" as any)
        .select("id, name, cnpj, razao_social, description, email, phone, created_at, updated_at")
        .eq("client_id", clientId)
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar empresas:", error);
        return [];
      }

      return (data || []).map((company: any) => ({
        id: company.id,
        name: company.name,
        cnpj: company.cnpj || null,
        razao_social: company.razao_social || null,
        description: company.description || null,
        email: company.email || null,
        phone: company.phone || null,
        created_at: company.created_at,
        updated_at: company.updated_at,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation para criar empresa
  const createCompany = useMutation({
    mutationFn: async (input: CreateCompanyInput) => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const { data, error } = await nexflowClient()
        .from("web_companies" as any)
        .insert({
          client_id: clientId,
          name: input.name,
          cnpj: input.cnpj || null,
          razao_social: input.razao_social || null,
          description: input.description || null,
          email: input.email || null,
          phone: input.phone || null,
          state_id: input.state_id || null,
          city_id: input.city_id || null,
          cep: input.cep || null,
          rua: input.rua || null,
          numero: input.numero || null,
          complemento: input.complemento || null,
          bairro: input.bairro || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Retornar no formato esperado (usar type assertion para evitar erro de tipo)
      const companyData = data as any;
      return {
        id: companyData.id,
        name: companyData.name,
        razao_social: companyData.razao_social || null,
        cnpj: companyData.cnpj || null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa criada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao criar empresa:", error);
      toast.error(error.message || "Erro ao criar empresa");
    },
  });

  return {
    companies,
    isLoading,
    createCompany: createCompany.mutateAsync,
    isCreating: createCompany.isPending,
  };
}

