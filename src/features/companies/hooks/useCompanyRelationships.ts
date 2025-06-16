import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/useAuth';
import { CompanyRelationship, CompanyPerson, CompanyPartner } from '@/types/database/company';

interface CompanyPerson {
  id: string;
  person: {
    id: string;
    name: string;
    email?: string;
    whatsapp?: string;
  };
  role?: string;
  is_primary: boolean;
}

interface CompanyPartner {
  id: string;
  partner: {
    id: string;
    name: string;
    email?: string;
    whatsapp?: string;
    partner_type?: string;
  };
}

interface AddCompanyPersonParams {
  personId: string;
  role?: string;
  isPrimary: boolean;
}

interface AddCompanyPartnerParams {
  partnerId: string;
}

export function useCompanyRelationships(companyId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar relacionamentos com outras empresas
  const { data: companyRelationships = [], isLoading: isLoadingCompanyRelationships } = useQuery({
    queryKey: ['company-relationships', companyId],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) throw new Error('Colaborador não encontrado');

      const { data, error } = await supabase
        .from('company_relationships')
        .select(`
          *,
          source_company:companies!source_company_id(*),
          target_company:companies!target_company_id(*)
        `)
        .or(`source_company_id.eq.${companyId},target_company_id.eq.${companyId}`)
        .eq('client_id', collaborator.client_id);

      if (error) throw error;
      return data as CompanyRelationship[];
    },
    enabled: !!user?.id && !!companyId,
  });

  // Buscar pessoas relacionadas
  const {
    data: companyPeople,
    isLoading: isLoadingPeople,
    error: peopleError,
  } = useQuery({
    queryKey: ['company-people', companyId],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) throw new Error('Colaborador não encontrado');

      const { data, error } = await supabase
        .from('company_people')
        .select(`
          id,
          person:person_id (
            id,
            name,
            email,
            whatsapp
          ),
          role,
          is_primary
        `)
        .eq('company_id', companyId)
        .eq('client_id', collaborator.client_id);

      if (error) throw error;
      return data as CompanyPerson[];
    },
    enabled: !!user?.id && !!companyId,
  });

  // Buscar parceiros relacionados
  const {
    data: companyPartners,
    isLoading: isLoadingPartners,
    error: partnersError,
  } = useQuery({
    queryKey: ['company-partners', companyId],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) throw new Error('Colaborador não encontrado');

      const { data, error } = await supabase
        .from('company_partners')
        .select(`
          id,
          partner:partner_id (
            id,
            name,
            email,
            whatsapp,
            partner_type
          )
        `)
        .eq('company_id', companyId)
        .eq('client_id', collaborator.client_id);

      if (error) throw error;
      return data as CompanyPartner[];
    },
    enabled: !!user?.id && !!companyId,
  });

  // Adicionar relacionamento com outra empresa
  const addCompanyRelationship = useMutation({
    mutationFn: async ({ targetCompanyId, relationshipType }: { targetCompanyId: string; relationshipType: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) throw new Error('Colaborador não encontrado');

      const { error } = await supabase
        .from('company_relationships')
        .insert({
          client_id: collaborator.client_id,
          source_company_id: companyId,
          target_company_id: targetCompanyId,
          relationship_type: relationshipType,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['company-relationships', companyId]);
      toast.success('Relacionamento adicionado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar relacionamento:', error);
      toast.error('Erro ao adicionar relacionamento');
    },
  });

  // Adicionar pessoa à empresa
  const addCompanyPersonMutation = useMutation({
    mutationFn: async ({ personId, role, isPrimary }: AddCompanyPersonParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) throw new Error('Colaborador não encontrado');

      const { data, error } = await supabase
        .from('company_people')
        .insert({
          client_id: collaborator.client_id,
          company_id: companyId,
          person_id: personId,
          role,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-people', companyId] });
      toast.success('Pessoa adicionada com sucesso!');
    },
  });

  // Adicionar parceiro à empresa
  const addCompanyPartnerMutation = useMutation({
    mutationFn: async ({ partnerId }: AddCompanyPartnerParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) throw new Error('Colaborador não encontrado');

      const { data, error } = await supabase
        .from('company_partners')
        .insert({
          client_id: collaborator.client_id,
          company_id: companyId,
          partner_id: partnerId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-partners', companyId] });
      toast.success('Parceiro adicionado com sucesso!');
    },
  });

  // Remover pessoa da empresa
  const removeCompanyPersonMutation = useMutation({
    mutationFn: async (relationId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('company_people')
        .delete()
        .eq('id', relationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-people', companyId] });
      toast.success('Pessoa removida com sucesso!');
    },
  });

  // Remover parceiro da empresa
  const removeCompanyPartnerMutation = useMutation({
    mutationFn: async (relationId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('company_partners')
        .delete()
        .eq('id', relationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-partners', companyId] });
      toast.success('Parceiro removido com sucesso!');
    },
  });

  return {
    // Dados
    companyRelationships,
    companyPeople,
    companyPartners,

    // Loading states
    isLoadingCompanyRelationships,
    isLoadingPeople,
    isLoadingPartners,

    // Mutations
    addCompanyRelationship,
    addCompanyPerson: addCompanyPersonMutation.mutateAsync,
    addCompanyPartner: addCompanyPartnerMutation.mutateAsync,
    removeCompanyPerson: removeCompanyPersonMutation.mutateAsync,
    removeCompanyPartner: removeCompanyPartnerMutation.mutateAsync,
  };
}

export const useCompanyRelationshipsHook = (companyId: string) => {
  // Buscar parceiros vinculados
  const { data: companyPartners, isLoading: loadingPartners } = useQuery({
    queryKey: ['company-partners', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_partners')
        .select(`
          id,
          partner:partners (
            id,
            name,
            email
          )
        `)
        .eq('company_id', companyId);

      if (error) {
        console.error('Erro ao buscar parceiros:', error);
        return [];
      }

      return data;
    },
    enabled: !!companyId,
  });

  // Buscar pessoas vinculadas
  const { data: companyPeople, isLoading: loadingPeople } = useQuery({
    queryKey: ['company-people', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_people')
        .select(`
          id,
          person:people (
            id,
            name,
            email
          )
        `)
        .eq('company_id', companyId);

      if (error) {
        console.error('Erro ao buscar pessoas:', error);
        return [];
      }

      return data;
    },
    enabled: !!companyId,
  });

  return {
    companyPartners,
    companyPeople,
    loadingPartners,
    loadingPeople,
  };
};
