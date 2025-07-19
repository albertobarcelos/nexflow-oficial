// AIDEV-NOTE: Hooks para buscar estados e cidades do banco de dados

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface State {
  id: string;
  name: string;
  uf: string;
}

interface City {
  id: string;
  name: string;
  state_id: string;
}

export const useStates = () => {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('web_states')
        .select('id, name, uf')
        .order('name');

      if (error) {
        console.error('Erro ao buscar estados:', error);
        throw error;
      }

      return data as State[];
    }
  });
};

export const useCities = (stateId?: string | null) => {
  return useQuery({
    queryKey: ['cities', stateId],
    queryFn: async () => {
      if (!stateId) return [];

      const { data, error } = await supabase
        .from('web_cities')
        .select('id, name, state_id')
        .eq('state_id', stateId)
        .order('name');

      if (error) {
        console.error('Erro ao buscar cidades:', error);
        throw error;
      }

      return data as City[];
    },
    enabled: !!stateId
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('core_client_users')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }

      return data;
    }
  });
};