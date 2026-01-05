import { useState, useEffect } from "react";
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
  const [userPermissions, setUserPermissions] = useState<{
    isAdmin: boolean;
    isLeader: boolean;
    teamIds: string[];
    clientId: string | null;
  }>({
    isAdmin: false,
    isLeader: false,
    teamIds: [],
    clientId: null,
  });
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Verificar permissões do usuário
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
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

        setUserPermissions({
          isAdmin,
          isLeader,
          teamIds,
          clientId: clientUser.client_id,
        });
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    if (enabled) {
      checkPermissions();
    }
  }, [enabled]);

  // Query para buscar contatos
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
    enabled: enabled && !isLoadingPermissions && !!userPermissions.clientId && (userPermissions.isAdmin || userPermissions.isLeader),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  return {
    ...query,
    isLoading: query.isLoading || isLoadingPermissions,
    opportunities: query.data || [], // Mantém nome antigo para compatibilidade
    contacts: query.data || [], // Novo nome
    permissions: userPermissions,
  };
}
