import { StrictMode, useEffect, useRef as ReactUseRef } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { FlowBuilderProvider } from "@/contexts/FlowBuilderContext";
import { supabase } from "@/lib/supabase";
import "./index.css";

// #region agent log
const logQueryClientConfig = () => {
  fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:12',message:'QueryClient created',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
};
// #endregion
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // #region agent log
      refetchOnWindowFocus: false, // Disable auto refetch, rely on soft reload
      // #endregion
    },
  },
});
// #region agent log
logQueryClientConfig();
// #endregion

// Componente para fazer soft reload quando a página volta ao foco
function SoftReloadOnFocus() {
  const queryClient = useQueryClient();
  const wasHiddenRef = ReactUseRef(false);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:visibilitychange',message:'visibilitychange event',data:{hidden:document.hidden,visibilityState:document.visibilityState,wasHidden:wasHiddenRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (document.hidden) {
        wasHiddenRef.current = true;
      } else if (wasHiddenRef.current && !document.hidden) {
        // Página voltou a ficar visível após ter sido escondida
        wasHiddenRef.current = false;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:soft-reload-start',message:'Starting soft reload',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Verificar se há sessão válida no storage
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:session-check',message:'Session check for soft reload',data:{hasSession:!!session,hasUser:!!session?.user,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          if (session?.user) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:before-invalidate',message:'Before invalidating queries',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            try {
              // Invalidar todas as queries ativas para forçar refetch
              const invalidateResult = await queryClient.invalidateQueries();
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:after-invalidate',message:'After invalidating queries',data:{timestamp:Date.now(),result:JSON.stringify(invalidateResult)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              
              // Refetch todas as queries ativas
              const refetchResult = await queryClient.refetchQueries();
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:after-refetch',message:'After refetching queries',data:{timestamp:Date.now(),result:JSON.stringify(refetchResult)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:soft-reload-complete',message:'Soft reload complete - queries invalidated and refetched',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
            } catch (invalidateError) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:invalidate-error',message:'Error during invalidate/refetch',data:{error:(invalidateError as Error)?.message,stack:(invalidateError as Error)?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              console.error('Erro durante invalidate/refetch:', invalidateError);
            }
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:no-session',message:'No session found - skipping soft reload',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
          }
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:error',message:'Error during soft reload',data:{error:(error as Error)?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          console.error('Erro durante soft reload:', error);
        }
      }
    };

    const handleFocus = () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:focus',message:'window focus event',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    };

    const handleBlur = () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:SoftReloadOnFocus:blur',message:'window blur event',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-soft-reload',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
