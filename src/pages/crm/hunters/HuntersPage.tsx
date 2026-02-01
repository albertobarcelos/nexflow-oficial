import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { IndicationsList } from "@/components/crm/hunters/IndicationsList";
import { CreateCardFromIndicationDialog } from "@/components/crm/hunters/CreateCardFromIndicationDialog";
import { IndicationDetailsPanel } from "@/components/crm/hunters/IndicationDetailsPanel";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Indication } from "@/types/indications";

export function HuntersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  // #region agent log - Fix: Use sessionStorage to persist hasAccess across remounts
  const [hasAccess, setHasAccess] = useState(() => {
    const stored = sessionStorage.getItem('hunters-page-has-access');
    return stored === 'true';
  });
  // #endregion
  const [loading, setLoading] = useState(!hasAccess);
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedIndication, setSelectedIndication] = useState<string | null>(null);
  const [indicationForCard, setIndicationForCard] = useState<Indication | null>(null);

  useEffect(() => {
    // #region agent log - Fix: Skip check if we already have access
    if (hasAccess) {
      setLoading(false);
      return;
    }
    // #endregion
    
    const checkAccess = async () => {
      try {
        // 1. Verificar autenticação
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/crm/login");
          return;
        }

        const userId = session.user.id;

        // 2. Verificar role do usuário
        const { data: clientUser, error: userError } = await supabase
          .from('core_client_users')
          .select('role, client_id')
          .eq('id', userId)
          .single();

        if (userError || !clientUser) {
          console.error('Erro ao buscar usuário:', userError);
          toast({
            title: "Erro de acesso",
            description: "Não foi possível verificar suas permissões.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        // Verificar se é administrator
        let hasRoleAccess = clientUser.role === 'administrator';

        // Se não for administrator, verificar se é leader ou admin de time
        if (!hasRoleAccess) {
          const { data: teamMembers, error: teamError } = await supabase
            .from('core_team_members')
            .select('role')
            .eq('user_profile_id', userId)
            .in('role', ['leader', 'admin']);

          if (!teamError && teamMembers && teamMembers.length > 0) {
            hasRoleAccess = true;
          }
        }

        if (!hasRoleAccess) {
          toast({
            title: "Acesso negado",
            description: "Apenas administrators, leaders e admins de time podem acessar esta página.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        // 3. Verificar se o cliente tem isHunting = true
        const { data: client, error: clientError } = await supabase
          .from('core_clients')
          .select('isHunting')
          .eq('id', clientUser.client_id)
          .single();

        if (clientError || !client) {
          console.error('Erro ao buscar cliente:', clientError);
          toast({
            title: "Erro de acesso",
            description: "Não foi possível verificar as configurações do cliente.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        if (client.isHunting !== true) {
          toast({
            title: "Acesso negado",
            description: "Seu cliente não possui acesso ao módulo Hunters.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        // Todas as validações passaram
        setHasAccess(true);
        // #region agent log - Fix: Persist hasAccess in sessionStorage
        sessionStorage.setItem('hunters-page-has-access', 'true');
        // #endregion
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar seu acesso.",
          variant: "destructive",
        });
        navigate("/crm/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // O redirecionamento já foi feito no useEffect
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hunters</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Gerencie as indicações recebidas pelos hunters
        </p>
      </div>

      <IndicationsList
        onIndicationClick={(indication) => {
          setSelectedIndication(indication.id);
          setIsDetailsPanelOpen(true);
        }}
        onIndicationCreateCard={(indication) => {
          setIndicationForCard(indication);
          setIsCreateCardDialogOpen(true);
        }}
      />

      {/* Dialogs */}
      <CreateCardFromIndicationDialog
        open={isCreateCardDialogOpen}
        onOpenChange={setIsCreateCardDialogOpen}
        indication={indicationForCard}
      />

      <IndicationDetailsPanel
        open={isDetailsPanelOpen}
        onOpenChange={setIsDetailsPanelOpen}
        indicationId={selectedIndication}
      />
    </div>
  );
}

