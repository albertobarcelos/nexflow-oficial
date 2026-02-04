import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/database";
import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";
import {
  useSecureClientMutation,
  invalidateClientQueries,
} from "@/hooks/useSecureClientMutation";
import { toast } from "sonner";

type WebCompanyRow = Database["public"]["Tables"]["web_companies"]["Row"];

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

/** Converte row do banco para o tipo Company exposto pelo hook */
function rowToCompany(row: WebCompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj ?? null,
    razao_social: row.razao_social ?? null,
    description: row.description ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Hook para buscar e gerenciar empresas da tabela web_companies.
 * Usa useSecureClientQuery e useSecureClientMutation para isolamento por client_id.
 */
export function useCompanies() {
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useSecureClientQuery<
    Company[],
    Error
  >({
    queryKey: ["companies"],
    queryFn: async (client, clientId) => {
      const { data, error } = await client
        .from("web_companies")
        .select(
          "id, name, cnpj, razao_social, description, email, phone, created_at, updated_at, client_id"
        )
        .eq("client_id", clientId)
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar empresas:", error);
        return [];
      }

      const rows = (data || []) as WebCompanyRow[];
      // Validação dupla: garantir que todos os itens pertencem ao cliente atual
      const invalid = rows.filter((row) => row.client_id !== clientId);
      if (invalid.length > 0) {
        console.error("[SECURITY] Dados de outro cliente detectados:", invalid.length);
        throw new Error("Violação de segurança: dados de outro cliente detectados");
      }

      return rows.map(rowToCompany);
    },
    queryOptions: {
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  });

  const createCompanyMutation = useSecureClientMutation<
    {
      id: string;
      name: string;
      razao_social: string | null;
      cnpj: string | null;
      client_id: string;
    },
    Error,
    CreateCompanyInput
  >({
    mutationFn: async (client, clientId, input) => {
      const { data, error } = await client
        .from("web_companies")
        .insert({
          client_id: clientId,
          name: input.name,
          cnpj: input.cnpj ?? null,
          razao_social: input.razao_social ?? null,
          description: input.description ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          state_id: input.state_id ?? null,
          city_id: input.city_id ?? null,
          cep: input.cep ?? null,
          rua: input.rua ?? null,
          numero: input.numero ?? null,
          complemento: input.complemento ?? null,
          bairro: input.bairro ?? null,
        })
        .select("id, name, razao_social, cnpj, client_id")
        .single();

      if (error) throw error;
      if (!data) throw new Error("Resposta vazia ao criar empresa");

      return {
        id: data.id,
        name: data.name,
        razao_social: data.razao_social ?? null,
        cnpj: data.cnpj ?? null,
        client_id: data.client_id,
      };
    },
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["companies"]);
        toast.success("Empresa criada com sucesso!");
      },
      onError: (error: Error) => {
        console.error("Erro ao criar empresa:", error);
        toast.error(error.message || "Erro ao criar empresa");
      },
    },
  });

  return {
    companies,
    isLoading,
    createCompany: createCompanyMutation.mutateAsync,
    isCreating: createCompanyMutation.isPending,
  };
}
