import { useCallback, useMemo, useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

export interface VirtualPaginationOptions<T> {
  queryKey: string[];
  queryFn: (params: { page: number; limit: number }) => Promise<T[]>;
  pageSize?: number;
  maxPages?: number; // Máximo de páginas para manter na memória
  enabled?: boolean;
  initialData?: T[];
}

export interface VirtualPaginationResult<T> {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  totalItems: number;
}

export function useVirtualPagination<T>({
  queryKey,
  queryFn,
  pageSize = 20,
  maxPages = 3, // Mantém apenas 3 páginas na memória
  enabled = true,
}: VirtualPaginationOptions<T>): VirtualPaginationResult<T> {
  // 🚀 OTIMIZAÇÃO: Removidos console.logs desnecessários em produção
  const isDev = process.env.NODE_ENV === 'development';
  
  const infiniteQuery = useInfiniteQuery<T[], Error>({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      if (isDev) console.log(`📥 Carregando página ${pageParam} com limite ${pageSize}`);
      const result = await queryFn({ page: pageParam, limit: pageSize });
      if (isDev) console.log(`✅ Página ${pageParam} carregada:`, result.length, 'itens');
      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage.length === pageSize;
      const nextPage = hasMore ? allPages.length : undefined;
      if (isDev) console.log(`🔄 Próxima página: ${nextPage}, hasMore: ${hasMore}`);
      return nextPage;
    },
    initialPageParam: 0,
    enabled,
    maxPages, // Limita o número de páginas na memória
    staleTime: 5 * 60 * 1000, // 5 minutos - reduz re-fetches desnecessários
    gcTime: 10 * 60 * 1000,   // 10 minutos - garbage collection
  });

  // 🚀 OTIMIZAÇÃO: useMemo otimizado com dependências mais específicas
  const items = useMemo(() => {
    const pages = infiniteQuery.data?.pages;
    if (!pages || pages.length === 0) return [];
    
    // Para melhor performance, sempre retorna todos os itens em vez de slice
    // O slice estava causando inconsistências na paginação
    const allItems = pages.flat();
    
    if (isDev && pages.length !== allItems.length / pageSize) {
      console.log(`📊 Itens carregados: ${allItems.length} de ${pages.length} páginas`);
    }
    
    return allItems;
  }, [infiniteQuery.data?.pages, pageSize, isDev]);

  // 🚀 OTIMIZAÇÃO: totalItems calculado de forma mais eficiente
  const totalItems = useMemo(() => {
    return items.length;
  }, [items.length]);

  return {
    items,
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    refetch: infiniteQuery.refetch,
    totalItems,
  };
}

// Hook para detectar quando o usuário está próximo do final da lista
export function useScrollToBottom(
  threshold: number = 200, // 🚀 OTIMIZAÇÃO: Threshold maior para reduzir triggers
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    let ticking = false; // 🚀 OTIMIZAÇÃO: Throttle para melhor performance

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = window.innerHeight;

          if (scrollTop + clientHeight >= scrollHeight - threshold) {
            callback();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, callback, enabled]);
}

// 🚀 OTIMIZAÇÃO: Hook completamente reescrito para melhor performance
export function useElementScrollToBottom(
  elementRef: React.RefObject<HTMLElement> | null,
  callback: () => void,
  threshold: number = 200, // Threshold maior
  enabled: boolean = true
) {
  const isDev = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    if (!enabled || !elementRef?.current) {
      return;
    }

    const element = elementRef.current;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = element;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          
          if (distanceFromBottom <= threshold) {
            if (isDev) console.log('🎯 Scroll threshold atingido - carregando mais dados');
            callback();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [elementRef, threshold, callback, enabled, isDev]);
} 