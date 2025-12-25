import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useOpportunities } from "@/hooks/useOpportunities";
import { OpportunityCard } from "@/components/crm/opportunities/OpportunityCard";
import { RocketLoader } from "@/components/ui/rocket-loader";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OpportunitiesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  
  const {
    opportunities,
    isLoading,
    isError,
    permissions,
  } = useOpportunities({ enabled: hasAccess });

  useEffect(() => {
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

        // Se não for administrator, verificar se é leader de time
        if (!hasRoleAccess) {
          const { data: teamMembers, error: teamError } = await supabase
            .from('core_team_members')
            .select('role')
            .eq('user_profile_id', userId)
            .eq('role', 'leader');

          if (!teamError && teamMembers && teamMembers.length > 0) {
            hasRoleAccess = true;
          }
        }

        if (!hasRoleAccess) {
          toast({
            title: "Acesso negado",
            description: "Apenas administrators e leaders de time podem acessar esta página.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        // Todas as validações passaram
        setHasAccess(true);
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar seu acesso.",
          variant: "destructive",
        });
        navigate("/crm/dashboard");
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [navigate, toast]);

  if (isCheckingAccess) {
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
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Oportunidades</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Visualize e gerencie as oportunidades de clientes
        </p>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <RocketLoader />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-sm text-destructive">
              Erro ao carregar oportunidades. Tente novamente.
            </p>
          </div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Nenhuma oportunidade encontrada.
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {opportunities.map((opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
                onClick={() => {
                  // TODO: Implementar navegação para detalhes da oportunidade
                  console.log("Oportunidade clicada:", opportunity.id);
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
