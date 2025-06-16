import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Company } from '../types';
import type { CompanyFormValues } from '../validation';

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

export const useCompanyForm = (company?: Company, onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (company?.state_id) {
      loadCities(company.state_id);
    }
  }, [company?.state_id]);

  const loadStates = async () => {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      toast.error('Erro ao carregar estados');
    } finally {
      setLoadingStates(false);
    }
  };

  const loadCities = async (stateId: string) => {
    try {
      setLoadingCities(true);
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('state_id', stateId)
        .order('name');
      
      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      toast.error('Erro ao carregar cidades');
    } finally {
      setLoadingCities(false);
    }
  };

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!collaborator) {
        throw new Error('Colaborador não encontrado');
      }

      const companyData = {
        client_id: collaborator.client_id,
        name: data.name,
        razao_social: data.razao_social,
        cnpj: data.cnpj,
        state_id: data.state_id,
        city_id: data.city_id,
        company_type: data.company_type,
        email: data.email,
        whatsapp: data.whatsapp,
        celular: data.celular,
        instagram: data.instagram,
        ...data.address
      };

      if (company) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', company.id);

        if (error) throw error;
        toast.success('Empresa atualizada com sucesso!');
      } else {
        // Criar nova empresa
        const { error } = await supabase
          .from('companies')
          .insert([companyData]);

        if (error) throw error;
        toast.success('Empresa criada com sucesso!');
      }

      queryClient.invalidateQueries(['companies']);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar empresa');
    }
  };

  return {
    states,
    cities,
    loadingStates,
    loadingCities,
    onSubmit,
    loadCities,
  };
};
