import { StrictMode, useEffect, useRef as ReactUseRef } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { FlowBuilderProvider } from "@/contexts/FlowBuilderContext";
import { supabase } from "@/lib/supabase";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos — evita refetch em massa ao voltar foco
      gcTime: 1000 * 60 * 30, // 30 min (antigo cacheTime)
      refetchOnWindowFocus: true, // com staleTime > 0, só refetch quando stale
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});

// Componente para fazer soft reload quando a página volta ao foco
function SoftReloadOnFocus() {
  const queryClient = useQueryClient();
  const wasHiddenRef = ReactUseRef(false);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
      } else if (wasHiddenRef.current && !document.hidden) {
        // Página voltou a ficar visível após ter sido escondida
        wasHiddenRef.current = false;
        
        // Verificar se há sessão válida no storage
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            try {
              // Refetch apenas queries ativas/stale (sem invalidar em massa)
              await queryClient.refetchQueries({ type: 'active' });
            } catch (refetchError) {
              console.error('Erro durante refetch ao voltar foco:', refetchError);
            }
          }
        } catch (error) {
          console.error('Erro durante soft reload:', error);
        }
      }
    };

    const handleFocus = () => {
      // Handler vazio - mantido para compatibilidade
    };

    const handleBlur = () => {
      // Handler vazio - mantido para compatibilidade
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [queryClient]);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FlowBuilderProvider>
        <SoftReloadOnFocus />
        <RouterProvider router={router} />
        <Toaster />
      </FlowBuilderProvider>
    </QueryClientProvider>
  </StrictMode>
);
