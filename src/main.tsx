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
      refetchOnWindowFocus: false, // Disable auto refetch, rely on soft reload
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
              // Invalidar todas as queries ativas para forçar refetch
              await queryClient.invalidateQueries();
              
              // Refetch todas as queries ativas
              await queryClient.refetchQueries();
            } catch (invalidateError) {
              console.error('Erro durante invalidate/refetch:', invalidateError);
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
