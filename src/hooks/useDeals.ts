import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: string;
  status: string;
  pipeline: string;
  created_at: string;
  updated_at: string;
  partner?: {
    id: string;
    name: string;
    avatar_type?: string;
    avatar_seed?: string;
    custom_avatar_url?: string;
  };
}

interface DealInput {
  title: string;
  company: string;
  value: string;
  status: string;
  pipeline: string;
}

// AIDEV-NOTE: Simplificação - Integrar React Query para gerenciamento de estado e cache, alinhando com outros hooks.
export function useDeals() {
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          partner:partner_id (
            id,
            name,
            avatar_type,
            avatar_seed,
            custom_avatar_url
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addDealMutation = useMutation({
    mutationFn: async (deal: DealInput) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('deals')
        .insert([{ ...deal, created_at: now, updated_at: now }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newDeal) => {
      queryClient.setQueryData(['deals'], (old: Deal[] | undefined) => [...(old || []), newDeal]);
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DealInput> }) => {
      const { data, error } = await supabase
        .from('deals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(['deals'], (old: Deal[] | undefined) =>
        old?.map((deal) => (deal.id === updatedDeal.id ? updatedDeal : deal)) || []
      );
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['deals'], (old: Deal[] | undefined) =>
        old?.filter((deal) => deal.id !== id) || []
      );
    },
  });

  return {
    deals,
    isLoading,
    error,
    addDeal: addDealMutation.mutate,
    updateDeal: updateDealMutation.mutate,
    deleteDeal: deleteDealMutation.mutate,
  };
}
