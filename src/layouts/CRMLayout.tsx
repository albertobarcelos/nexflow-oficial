import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CRMSidebar } from "@/components/crm/CRMSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function CRMLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
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
        throw new Error('No session found');
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
        throw new Error('Unauthorized');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      navigate("/crm/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CRMSidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}