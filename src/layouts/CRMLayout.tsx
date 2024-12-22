import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CRMSidebar } from "@/components/crm/CRMSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function CRMLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCollaboratorAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/crm/login");
          return;
        }

        const { data: collaboratorData, error: collaboratorError } = await supabase
          .from('collaborators')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (collaboratorError) {
          console.error('Erro ao verificar acesso de colaborador:', collaboratorError);
          navigate("/crm/login");
          return;
        }

        if (!collaboratorData) {
          console.error('Usuário não é um colaborador');
          navigate("/crm/login");
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        navigate("/crm/login");
      } finally {
        setLoading(false);
      }
    };

    checkCollaboratorAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/crm/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CRMSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}