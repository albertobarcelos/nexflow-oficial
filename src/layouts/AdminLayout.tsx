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

        // Verificar se o usuário é um administrador do sistema
        const { data: adminData, error: adminError } = await supabase
          .from('core_client_users')
          .select(`
            id,
            client_id,
            first_name,
            last_name,
            email,
            role,
            is_active
          `)
          .eq('id', session.user.id)
          .eq('role', 'administrator')
          .eq('is_active', true)
          .maybeSingle();

        if (adminError) {
          console.error('Erro ao verificar acesso de administrador:', adminError);
          navigate("/admin/login");
          return;
        }

        if (!adminData) {
          console.error('Usuário não é um administrador');
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
