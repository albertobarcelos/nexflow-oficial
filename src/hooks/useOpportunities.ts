import { useState, useEffect, useRef } from "react";
import { supabase, nexflowClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export interface Contact {
  id: string;
  client_id: string;
  client_name: string;
  main_contact: string;
  phone_numbers: string[];
  company_names: string[];
  tax_ids: string[];
  related_card_ids: string[];
  assigned_team_id: string | null;
  avatar_type?: string;
  avatar_seed?: string;
  created_at: string;
  updated_at: string;
}

// Alias para compatibilidade
export type Opportunity = Contact;

interface UseOpportunitiesOptions {
  enabled?: boolean;
}

// Função auxiliar para buscar via RPC
async function fetchViaRPC(userPermissions: {
  isAdmin: boolean;
  isLeader: boolean;
  teamIds: string[];
  clientId: string | null;
}): Promise<Contact[]> {
  if (!userPermissions.clientId) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_contacts', {
    p_client_id: userPermissions.clientId,
  });

  if (error) {
    console.error('Erro ao buscar contatos via RPC:', error);
    throw error;
  }

  let contacts = (data || []) as Contact[];

  // Aplicar filtro de times se necessário
  if (!userPermissions.isAdmin && userPermissions.isLeader && userPermissions.teamIds.length > 0) {
    contacts = contacts.filter(contact => 
      contact.assigned_team_id && userPermissions.teamIds.includes(contact.assigned_team_id)
    );
  }

  return contacts;
}

/**
 * Hook para buscar contatos com filtros de permissão
 * - Administrators veem todos os contatos do client_id
 * - Team Leaders veem apenas contatos do seu time
 */
export function useOpportunities(options: UseOpportunitiesOptions = {}) {
  const { enabled = true } = options;
  // #region agent log - Fix: Load permissions from sessionStorage on initialization
  const loadPermissionsFromStorage = (): {
    isAdmin: boolean;
    isLeader: boolean;
    teamIds: string[];
    clientId: string | null;
  } => {
    try {
      const stored = sessionStorage.getItem('useOpportunities-permissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verify the stored permissions are still valid (not expired)
        const storedTimestamp = sessionStorage.getItem('useOpportunities-permissions-timestamp');
        if (storedTimestamp) {
          const age = Date.now() - parseInt(storedTimestamp, 10);
          // Consider permissions valid for 1 hour
          if (age < 60 * 60 * 1000) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return {
      isAdmin: false,
      isLeader: false,
      teamIds: [],
      clientId: null,
    };
  };
  // #endregion
  const [userPermissions, setUserPermissions] = useState<{
    isAdmin: boolean;
    isLeader: boolean;
    teamIds: string[];
    clientId: string | null;
  }>(loadPermissionsFromStorage);
  // #region agent log - Fix: Set loading to false if we have valid permissions from storage
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(() => {
    const stored = loadPermissionsFromStorage();
    const hasValid = !!(stored.clientId && (stored.isAdmin || stored.isLeader));
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:106',message:'isLoadingPermissions initial state',data:{hasValid,stored},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return !hasValid;
  });
  // #endregion
  // #region agent log - Fix: Use ref to track if permissions were already loaded
  const initialStored = loadPermissionsFromStorage();
  const hasLoadedPermissionsRef = useRef(!!(initialStored.clientId && (initialStored.isAdmin || initialStored.isLeader)));
  // #endregion

  // Verificar permissões do usuário
  useEffect(() => {
    // #region agent log - Fix: Skip if we already have valid permissions and enabled is true
    const hasValidPermissions = userPermissions.clientId && (userPermissions.isAdmin || userPermissions.isLeader);
    if (enabled && hasValidPermissions && hasLoadedPermissionsRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:85',message:'checkPermissions skipped - already loaded',data:{hasValidPermissions,enabled},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return; // Skip re-checking if we already have valid permissions
    }
    // #endregion
    
    const checkPermissions = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:92',message:'checkPermissions started',data:{enabled,isLoadingPermissions},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:96',message:'checkPermissions session check',data:{hasSession:!!session,hasUser:!!session?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (!session) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:100',message:'checkPermissions no session',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setIsLoadingPermissions(false);
          return;
        }

        const userId = session.user.id;

        // Buscar dados do usuário
        const { data: clientUser, error: userError } = await supabase
          .from('core_client_users')
          .select('role, client_id')
          .eq('id', userId)
          .single();

        if (userError || !clientUser) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:116',message:'checkPermissions user error',data:{error:userError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          console.error('Erro ao buscar usuário:', userError);
          setIsLoadingPermissions(false);
          return;
        }

        const isAdmin = clientUser.role === 'administrator';
        let isLeader = false;
        const teamIds: string[] = [];

        // Se não for admin, verificar se é leader de algum time
        if (!isAdmin) {
          const { data: teamMembers, error: teamError } = await supabase
            .from('core_team_members')
            .select('team_id, role')
            .eq('user_profile_id', userId)
            .eq('role', 'leader');

          if (!teamError && teamMembers && teamMembers.length > 0) {
            isLeader = true;
            teamIds.push(...teamMembers.map(tm => tm.team_id));
          }
        }

        const newPermissions = {
          isAdmin,
          isLeader,
          teamIds,
          clientId: clientUser.client_id,
        };
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:148',message:'checkPermissions success',data:{...newPermissions},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setUserPermissions(newPermissions);
        // #region agent log - Fix: Persist permissions to sessionStorage
        try {
          sessionStorage.setItem('useOpportunities-permissions', JSON.stringify(newPermissions));
          sessionStorage.setItem('useOpportunities-permissions-timestamp', Date.now().toString());
        } catch (e) {
          // Ignore storage errors
        }
        // #endregion
        // #region agent log - Fix: Mark as loaded after successful check
        hasLoadedPermissionsRef.current = true;
        // #endregion
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:155',message:'checkPermissions error',data:{error:(error as Error)?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error('Erro ao verificar permissões:', error);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    if (enabled) {
      // #region agent log - Fix: Only set loading if we don't have valid permissions
      if (!hasValidPermissions) {
        setIsLoadingPermissions(true);
      }
      // #endregion
      checkPermissions();
    } else {
      // #region agent log - Fix: Reset loading state when disabled
      setIsLoadingPermissions(false);
      // #endregion
    }
  }, [enabled, userPermissions.clientId, userPermissions.isAdmin, userPermissions.isLeader]);

  // Query para buscar contatos
  const queryEnabled = enabled && !isLoadingPermissions && !!userPermissions.clientId && (userPermissions.isAdmin || userPermissions.isLeader);
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:144',message:'query enabled state',data:{enabled,isLoadingPermissions,hasClientId:!!userPermissions.clientId,isAdmin:userPermissions.isAdmin,isLeader:userPermissions.isLeader,queryEnabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [enabled, isLoadingPermissions, userPermissions.clientId, userPermissions.isAdmin, userPermissions.isLeader, queryEnabled]);
  // #endregion
  const query = useQuery({
    queryKey: ['contacts', userPermissions.clientId, userPermissions.isAdmin, userPermissions.teamIds],
    queryFn: async (): Promise<Contact[]> => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOpportunities.ts:149',message:'queryFn called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (!userPermissions.clientId) {
        return [];
      }

      // Tentar primeiro com nexflowClient, se falhar usar função RPC
      try {
        const client = nexflowClient();
        let query = client
          .from('contacts')
          .select('*')
          .eq('client_id', userPermissions.clientId)
          .order('created_at', { ascending: false });

        // Se não for admin e for leader, filtrar por times
        if (!userPermissions.isAdmin && userPermissions.isLeader && userPermissions.teamIds.length > 0) {
          query = query.in('assigned_team_id', userPermissions.teamIds);
        } else if (!userPermissions.isAdmin && !userPermissions.isLeader) {
          // Se não for admin nem leader, não retornar nada
          return [];
        }
        
        // Se for admin, não aplicar filtro adicional (já filtra por client_id)

        const { data, error } = await query;

        if (error) {
          // Se der erro de permissão, tentar usar função RPC
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            console.warn('Erro de permissão ao acessar nexflow.contacts, usando função RPC como fallback');
            return await fetchViaRPC(userPermissions);
          }
          throw error;
        }

        return (data || []) as Contact[];
      } catch (error: any) {
        // Se der erro de permissão, tentar usar função RPC
        if (error?.code === '42501' || error?.message?.includes('permission denied')) {
          console.warn('Erro de permissão ao acessar nexflow.contacts, usando função RPC como fallback');
          return await fetchViaRPC(userPermissions);
        }
        throw error;
      }
    },
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: true, // #region agent log - Fix: Re-enable refetch on focus, but permissions won't reset
    // #endregion
  });

  return {
    ...query,
    isLoading: query.isLoading || isLoadingPermissions,
    opportunities: query.data || [], // Mantém nome antigo para compatibilidade
    contacts: query.data || [], // Novo nome
    permissions: userPermissions,
  };
}
