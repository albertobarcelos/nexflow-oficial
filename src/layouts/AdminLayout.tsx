import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/admin/login");
          return;
        }

        // Verificar se o usuário é um administrador do sistema usando RPC
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
          "check_admin_access"
        ) as { data: { allowed: boolean; error?: string; user?: { name: string; surname: string } } | null; error: any };

        if (rpcError) {
          console.error('Erro ao verificar acesso de administrador:', rpcError);
          navigate("/admin/login");
          return;
        }

        if (!rpcData || !rpcData.allowed) {
          console.error('Usuário não é um administrador:', rpcData?.error);
          navigate("/admin/login");
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/admin/login");
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
        <AdminSidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
