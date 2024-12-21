import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Administrator } from "@/types/database";

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

        const { data: adminData, error: adminError } = await supabase
          .from('administrators')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (adminError || !adminData) {
          console.error('Erro ao verificar acesso de administrador:', adminError);
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
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}