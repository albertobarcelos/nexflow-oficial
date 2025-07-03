'use client';

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/crm/sidebar/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { FlowBuilderProvider } from "@/contexts/FlowBuilderContext";

export default function CRMLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // TEMPORÁRIO: Comentando toda a verificação de autenticação para permitir acesso direto ao CRM
  /*
  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/crm/login");
        return;
      }

      if (event === 'USER_UPDATED' && !session) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        navigate("/crm/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkAuth = async () => {
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
        console.error('Error checking collaborator access:', collaboratorError);
        throw new Error('Error checking access');
      }

      if (!collaboratorData) {
        console.error('User is not a collaborator');
        navigate("/crm/login");
        return;
      }

      setLoading(false);

    } catch (error) {
      console.error('Authentication error:', error);
      navigate("/crm/login");
    }
  };
  */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <FlowBuilderProvider>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <header className="h-14 flex-shrink-0 fixed top-0 left-0 right-0 z-10 bg-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]">
            <Sidebar />
          </header>
          <main className="flex-grow overflow-y-auto mt-14">
            <Outlet />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </FlowBuilderProvider>
  );
}
