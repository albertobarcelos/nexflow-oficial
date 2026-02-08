import { useState, useEffect, useRef } from "react";
import { supabase, nexflowClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useClientStore } from "@/stores/clientStore";

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
  contact_type?: ("cliente" | "parceiro")[] | null;
  indicated_by?: string | null;
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

  const { data, error } = await (supabase.rpc as any)('get_contacts', {
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
  const { currentClient, userRole } = useClientStore();

  // Carregar do sessionStorage como fallback/cache inicial
  const loadPermissionsFromStorage = (): {
    isAdmin: boolean;
    isLeader: boolean;
    teamIds: string[];
    clientId: string | null;
  } => {
    try {
      const stored = sessionStorage.getItem("useOpportunities-permissions");
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedTimestamp = sessionStorage.getItem("useOpportunities-permissions-timestamp");
        if (storedTimestamp) {
          const age = Date.now() - parseInt(storedTimestamp, 10);
          if (age < 60 * 60 * 1000) return parsed;
        }
      }
    } catch {
      // Ignorar erros
    }
    return { isAdmin: false, isLeader: false, teamIds: [], clientId: null };
  };

  const [userPermissions, setUserPermissions] = useState(loadPermissionsFromStorage);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const hasLoadedTeamIdsRef = useRef(false);
  const lastClientIdRef = useRef<string | null>(null);

  // Otimização: usar clientStore quando disponível (evita fetch duplicado de core_client_users)
  const fromStore = currentClient?.id && userRole;
  const clientIdFromStore = fromStore ? currentClient.id : null;
  const isAdminFromStore = fromStore && userRole === "administrator";

  // Buscar apenas teamIds quando não for admin (uma única query em vez de duas)
  useEffect(() => {
    if (!enabled || !fromStore || isAdminFromStore) {
      if (fromStore && isAdminFromStore) {
        setUserPermissions((prev) => ({
          ...prev,
          clientId: clientIdFromStore,
          isAdmin: true,
          isLeader: false,
          teamIds: [],
        }));
        setIsLoadingPermissions(false);
      }
      return;
    }

    // Reset quando cliente mudar
    if (lastClientIdRef.current !== clientIdFromStore) {
      hasLoadedTeamIdsRef.current = false;
      lastClientIdRef.current = clientIdFromStore;
    }

    // Só leaders precisam de teamIds
    if (hasLoadedTeamIdsRef.current) return;

    const fetchTeamIds = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoadingPermissions(false);
          return;
        }

        const { data: teamMembers, error } = await supabase
          .from("core_team_members" as any)
          .select("team_id, role")
          .eq("user_profile_id", session.user.id)
          .eq("role", "leader");

        const teamIds =
          !error && teamMembers?.length
            ? (teamMembers as { team_id: string }[]).map((tm) => tm.team_id).filter(Boolean)
            : [];

        const newPermissions = {
          clientId: clientIdFromStore,
          isAdmin: false,
          isLeader: teamIds.length > 0,
          teamIds,
        };
        setUserPermissions(newPermissions);
        hasLoadedTeamIdsRef.current = true;
        try {
          sessionStorage.setItem("useOpportunities-permissions", JSON.stringify(newPermissions));
          sessionStorage.setItem("useOpportunities-permissions-timestamp", Date.now().toString());
        } catch {
          // Ignorar
        }
      } catch (err) {
        console.error("Erro ao buscar times do usuário:", err);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    setIsLoadingPermissions(true);
    fetchTeamIds();
  }, [enabled, fromStore, isAdminFromStore, clientIdFromStore]);

  // Fallback: quando clientStore não está pronto, usar lógica legada
  useEffect(() => {
    if (fromStore) return;

    const checkPermissions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoadingPermissions(false);
          return;
        }

        const { data: clientUser, error: userError } = await supabase
          .from("core_client_users")
          .select("role, client_id")
          .eq("id", session.user.id)
          .single();

        if (userError || !clientUser) {
          console.error("Erro ao buscar usuário:", userError);
          setIsLoadingPermissions(false);
          return;
        }

        const isAdmin = clientUser.role === "administrator";
        let isLeader = false;
        const teamIds: string[] = [];

        if (!isAdmin) {
          const { data: teamMembers, error: teamError } = await supabase
            .from("core_team_members" as any)
            .select("team_id, role")
            .eq("user_profile_id", session.user.id)
            .eq("role", "leader");

          if (!teamError && teamMembers?.length) {
            isLeader = true;
            teamIds.push(...(teamMembers as { team_id: string }[]).map((tm) => tm.team_id).filter(Boolean));
          }
        }

        const newPermissions = {
          clientId: clientUser.client_id,
          isAdmin,
          isLeader,
          teamIds,
        };
        setUserPermissions(newPermissions);
        try {
          sessionStorage.setItem("useOpportunities-permissions", JSON.stringify(newPermissions));
          sessionStorage.setItem("useOpportunities-permissions-timestamp", Date.now().toString());
        } catch {
          // Ignorar
        }
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    if (enabled) {
      const stored = loadPermissionsFromStorage();
      if (stored.clientId && (stored.isAdmin || stored.isLeader)) {
        setUserPermissions(stored);
        setIsLoadingPermissions(false);
        return;
      }
      checkPermissions();
    } else {
      setIsLoadingPermissions(false);
    }
  }, [enabled, fromStore]);

  // Query para buscar contatos
  const queryEnabled = enabled && !isLoadingPermissions && !!userPermissions.clientId && (userPermissions.isAdmin || userPermissions.isLeader);
  const query = useQuery({
    queryKey: ['contacts', userPermissions.clientId, userPermissions.isAdmin, userPermissions.teamIds],
    queryFn: async (): Promise<Contact[]> => {
      if (!userPermissions.clientId) {
        return [];
      }

      // Tentar primeiro com nexflowClient, se falhar usar função RPC
      try {
        const client = nexflowClient();
        let query = client
          .from('contacts' as any)
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

        // Usar apenas company_names do próprio contato (sem buscar contact_companies)
        return (data || []).map((contact: any) => ({
          ...contact,
          company_names: contact.company_names || [],
        })) as Contact[];
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
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    isLoading: query.isLoading || isLoadingPermissions,
    opportunities: query.data || [], // Mantém nome antigo para compatibilidade
    contacts: query.data || [], // Novo nome
    permissions: userPermissions,
  };
}
