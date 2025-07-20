import { useState, useCallback, useMemo } from "react";
import { PaginationConfig, PaginatedResponse } from "../types";

// AIDEV-NOTE: Hook reutilizável para lógica de paginação
// Gerencia estado, navegação e cálculos de paginação

export function usePagination(initialConfig: PaginationConfig) {
  const [paginationConfig, setPaginationConfig] = useState<PaginationConfig>({
    ...initialConfig,
    search: initialConfig.search || "",
  });

  const goToPage = useCallback((page: number, totalPages: number) => {
    if (page >= 1 && page <= totalPages && page !== paginationConfig.page) {
      setPaginationConfig(prev => ({ ...prev, page }));
    }
  }, [paginationConfig.page]);

  const nextPage = useCallback((hasNext: boolean) => {
    if (hasNext) {
      goToPage(paginationConfig.page + 1, Infinity);
    }
  }, [paginationConfig.page, goToPage]);

  const previousPage = useCallback((hasPrevious: boolean) => {
    if (hasPrevious) {
      goToPage(paginationConfig.page - 1, Infinity);
    }
  }, [paginationConfig.page, goToPage]);

  const changePageSize = useCallback((pageSize: number) => {
    setPaginationConfig(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setPaginationConfig(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const computePagination = useCallback((data: any) => ({
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 0,
    pageSize: data?.pageSize || 10,
    totalCount: data?.count || 0,
    hasNextPage: data?.hasNextPage || false,
    hasPreviousPage: data?.hasPreviousPage || false,
  }), []);

  return {
    paginationConfig,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    setSearch,
    computePagination,
  };
}