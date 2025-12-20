import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook para verificar se o usuário tem acesso ao módulo Hunters
 * Retorna true se:
 * - Usuário é administrator OU é leader/admin de time
 * - Cliente tem isHunting = true
 */
export function useHuntersAccess() {
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
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // 3. Verificar se o cliente tem isHunting = true
        const { data: client, error: clientError } = await supabase
          .from('core_clients')
          .select('isHunting')
          .eq('id', clientUser.client_id)
          .single();

        if (clientError || !client) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        setHasAccess(client.isHunting === true);
      } catch (error) {
        console.error('Erro ao verificar acesso ao Hunters:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  return { hasAccess, isLoading };
}

