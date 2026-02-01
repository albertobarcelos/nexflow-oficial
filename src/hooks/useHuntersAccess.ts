import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook para verificar se o usuário tem acesso ao módulo Hunters
 * Retorna true se:
 * - Usuário é administrator OU é leader/admin de time
 * - Cliente tem isHunting = true
 */
export function useHuntersAccess() {
  // #region Fix: Load access state from sessionStorage
  const loadAccessFromStorage = (): boolean => {
    try {
      const stored = sessionStorage.getItem('useHuntersAccess-has-access');
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedTimestamp = sessionStorage.getItem('useHuntersAccess-has-access-timestamp');
        if (storedTimestamp) {
          const age = Date.now() - parseInt(storedTimestamp, 10);
          if (age < 60 * 60 * 1000) { // Consider valid for 1 hour
            return parsed;
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return false;
  };
  // #endregion

  const [hasAccess, setHasAccess] = useState(loadAccessFromStorage);
  const [isLoading, setIsLoading] = useState(() => {
    const stored = loadAccessFromStorage();
    return !stored;
  });
  // #region Fix: Use ref to track if access was already loaded
  const hasLoadedAccessRef = useRef(loadAccessFromStorage());
  // #endregion

  useEffect(() => {
    // #region Fix: Skip if we already have valid access
    if (hasAccess && hasLoadedAccessRef.current) {
      setIsLoading(false);
      return;
    }
    // #endregion

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

        const accessGranted = client.isHunting === true;
        setHasAccess(accessGranted);
        // #region Fix: Persist access to sessionStorage
        try {
          sessionStorage.setItem('useHuntersAccess-has-access', JSON.stringify(accessGranted));
          sessionStorage.setItem('useHuntersAccess-has-access-timestamp', Date.now().toString());
        } catch (e) {
          // Ignore storage errors
        }
        // #endregion
        // #region Fix: Mark as loaded after successful check
        hasLoadedAccessRef.current = true;
        // #endregion
      } catch (error) {
        console.error('Erro ao verificar acesso ao Hunters:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [hasAccess]);

  return { hasAccess, isLoading };
}

