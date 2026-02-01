import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook para verificar se o usuário tem acesso ao módulo de Contatos
 * Retorna true se:
 * - Usuário é administrator OU é leader de time
 */
export function useOpportunitiesAccess() {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // 1. Verificar autenticação
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setHasAccess(false);
          setIsLoading(false);
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
          setHasAccess(false);
          setIsLoading(false);
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

        setHasAccess(hasRoleAccess);
      } catch (error) {
        console.error('Erro ao verificar acesso aos Contatos:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  return { hasAccess, isLoading };
}
