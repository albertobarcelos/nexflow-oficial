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
  console.log('🚀 useVirtualPagination inicializado:', { queryKey, pageSize, maxPages, enabled });
  
  const infiniteQuery = useInfiniteQuery<T[], Error>({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      console.log(`📥 Carregando página ${pageParam} com limite ${pageSize}`);
      const result = await queryFn({ page: pageParam, limit: pageSize });
      console.log(`✅ Página ${pageParam} carregada:`, result.length, 'itens');
      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage.length === pageSize;
      const nextPage = hasMore ? allPages.length : undefined;
      console.log(`🔄 Próxima página: ${nextPage}, hasMore: ${hasMore}`);
      return nextPage;
    },
    initialPageParam: 0,
    enabled,
    maxPages, // Limita o número de páginas na memória
  });

  // Otimização: mantém apenas as últimas páginas na memória
  const items = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    
    const allPages = infiniteQuery.data.pages;
    
    // Se temos mais páginas que o limite, mantém apenas as últimas
    const pagesToKeep = allPages.slice(-maxPages);
    const allItems = pagesToKeep.flat();
    
    console.log(`📊 Páginas na memória: ${pagesToKeep.length}/${allPages.length}, Itens: ${allItems.length}`);
    return allItems;
  }, [infiniteQuery.data, maxPages]);

  const totalItems = useMemo(() => {
    if (!infiniteQuery.data?.pages) return 0;
    return infiniteQuery.data.pages.reduce((total, page) => total + page.length, 0);
  }, [infiniteQuery.data]);

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
  threshold: number = 100,
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, callback, enabled]);
}

// Hook para detectar scroll em um elemento específico
export function useElementScrollToBottom(
  elementRef: React.RefObject<HTMLElement> | null,
  threshold: number = 100,
  onReachBottom: () => void,
  enabled: boolean = true
) {
  console.log('🔄 useElementScrollToBottom inicializado:', { threshold, enabled, hasElement: !!elementRef });
  
  useEffect(() => {
    if (!enabled || !elementRef || !elementRef.current) {
      console.log('❌ useElementScrollToBottom desabilitado ou elemento não encontrado');
      return;
    }

    const element = elementRef.current;
    console.log('✅ useElementScrollToBottom elemento encontrado:', element);

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      console.log('📏 Scroll detectado:', {
        scrollTop,
        scrollHeight,
        clientHeight,
        distanceFromBottom,
        threshold
      });
      
      if (distanceFromBottom <= threshold) {
        console.log('🎯 Threshold atingido! Chamando onReachBottom');
        onReachBottom();
      }
    };

    element.addEventListener('scroll', handleScroll);
    console.log('👂 Event listener adicionado para scroll');

    return () => {
      element.removeEventListener('scroll', handleScroll);
      console.log('🧹 Event listener removido');
    };
  }, [elementRef, threshold, onReachBottom, enabled]);
} 