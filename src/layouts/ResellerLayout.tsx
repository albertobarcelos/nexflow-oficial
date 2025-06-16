import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ResellerSidebar } from "@/components/reseller/ResellerSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function ResellerLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkResellerAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/reseller/login");
          return;
        }

        // Verificar se o usuário é um revendedor ativo
        const { data: resellerData, error: resellerError } = await supabase
          .from('core_reseller_users')
          .select(`
            id,
            reseller_id,
            first_name,
            last_name,
            email,
            role,
            is_active,
            reseller:core_resellers!reseller_id (
              id,
              name,
              company_name,
              status
            )
          `)
          .eq('id', session.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (resellerError) {
          console.error('Erro ao verificar acesso de revendedor:', resellerError);
          navigate("/reseller/login");
          return;
        }

        if (!resellerData) {
          console.error('Usuário não é um revendedor');
          navigate("/reseller/login");
          return;
        }

        if (resellerData.reseller?.status !== 'active') {
          console.error('Revendedor não está ativo');
          navigate("/reseller/login");
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        navigate("/reseller/login");
      } finally {
        setLoading(false);
      }
    };

    checkResellerAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/reseller/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Carregando portal...</span>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <ResellerSidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
} 