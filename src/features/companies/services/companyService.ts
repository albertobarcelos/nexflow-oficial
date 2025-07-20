import { supabase } from "@/lib/supabase";
import { CompanyWithRelations, PaginatedResponse, PaginationConfig } from "../types";

// AIDEV-NOTE: Serviços de autenticação e dados para empresas
// Centraliza lógica de acesso ao Supabase e transformação de dados

export const getAuthData = async () => {
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

export const transformCompanyData = (data: any[], totalCount: number, config: PaginationConfig): PaginatedResponse<CompanyWithRelations> => {
  const transformed = data.map(company => ({
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

  const totalPages = Math.ceil(totalCount / config.pageSize);
  return {
    data: transformed,
    count: totalCount,
    totalPages,
    currentPage: config.page,
    pageSize: config.pageSize,
    hasNextPage: config.page < totalPages,
    hasPreviousPage: config.page > 1,
  };
};

export const fetchPaginatedCompanies = async (paginationConfig: PaginationConfig): Promise<PaginatedResponse<CompanyWithRelations>> => {
  const { clientId } = await getAuthData();
  const offset = (paginationConfig.page - 1) * paginationConfig.pageSize;

  // AIDEV-NOTE: Se há termo de busca (4+ caracteres), usar função RPC para busca flexível
  if (paginationConfig.search?.trim() && paginationConfig.search.trim().length >= 4) {
    const { data, error } = await supabase.rpc('search_companies_flexible', {
      p_client_id: clientId,
      p_search_term: paginationConfig.search.trim(),
      p_limit: paginationConfig.pageSize,
      p_offset: offset
    });

    if (error) throw error;

    // AIDEV-NOTE: Buscar dados relacionados (cidades e estados) para os resultados
    const companyIds = data?.map((company: any) => company.id) || [];
    
    if (companyIds.length === 0) {
      return transformCompanyData([], 0, paginationConfig);
    }

    const { data: companiesWithRelations, error: relationsError } = await supabase
      .from("web_companies")
      .select(`
        *,
        city:web_cities (id, name),
        state:web_states (id, name, uf)
      `)
      .in('id', companyIds)
      .order("created_at", { ascending: false });

    if (relationsError) throw relationsError;

    const totalCount = data?.[0]?.total_count || 0;
    return transformCompanyData(companiesWithRelations || [], totalCount, paginationConfig);
  }

  // AIDEV-NOTE: Busca normal sem filtro de texto
  let query = supabase
    .from("web_companies")
    .select(
      `*,
      city:web_cities (id, name),
      state:web_states (id, name, uf)`,
      { count: "exact" }
    )
    .eq("client_id", clientId);

  query = query.order("created_at", { ascending: false }).range(offset, offset + paginationConfig.pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return transformCompanyData(data || [], count || 0, paginationConfig);
};