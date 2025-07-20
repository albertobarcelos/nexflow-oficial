import { useQuery } from "@tanstack/react-query";
import { PaginationConfig } from "../types";
import { fetchPaginatedCompanies } from "../services/companyService";
import { usePagination } from "./usePagination";
import { useCompanyMutations } from "./useCompanyMutations";

// AIDEV-NOTE: Hook principal para empresas paginadas - orquestra módulos separados
// Mantém interface limpa combinando paginação, dados e mutações

export function useCompaniesPaginated(initialConfig: PaginationConfig = { page: 1, pageSize: 10 }) {
  const {
    paginationConfig,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    setSearch,
    computePagination,
  } = usePagination(initialConfig);

  const { data: paginatedData, isLoading, isFetching, refetch: refreshCompanies } = useQuery({
    queryKey: ["companies-paginated", paginationConfig],
    queryFn: () => fetchPaginatedCompanies(paginationConfig),
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const { createCompany, updateCompany, deleteCompany } = useCompanyMutations(goToPage);

  const companies = paginatedData?.data || [];
  const pagination = computePagination(paginatedData);

  return {
    // Dados
    companies,
    pagination,
    
    // Estados
    isLoading,
    isFetching,
    
    // Configuração atual
    currentSearch: paginationConfig.search || "",
    currentPageSize: paginationConfig.pageSize,
    
    // Navegação
    goToPage: (page: number) => goToPage(page, pagination.totalPages),
    nextPage: () => nextPage(pagination.hasNextPage),
    previousPage: () => previousPage(pagination.hasPreviousPage),
    changePageSize,
    setSearch,
    
    // Mutations
    createCompany,
    updateCompany,
    deleteCompany,
    refreshCompanies,
  };
}