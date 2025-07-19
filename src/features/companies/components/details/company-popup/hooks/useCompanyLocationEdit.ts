// AIDEV-NOTE: Hook para gerenciar a edição dos dados de localização da empresa

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Location } from '../types';
import { toast } from 'sonner';

/**
 * Hook para gerenciar a edição dos dados de localização da empresa
 * @param companyId ID da empresa
 * @param location Dados de localização atuais
 * @returns Estado e funções para gerenciar os dados de localização
 */
export const useCompanyLocationEdit = (companyId: string | undefined, location: Location | null) => {
  const [isEditing, setIsEditing] = useState(false);
  const [locationData, setLocationData] = useState<Partial<Location>>({});
  const queryClient = useQueryClient();

  // Inicializa os dados de localização quando a empresa ou localização muda
  useEffect(() => {
    if (location) {
      setLocationData({
        street: location.street || '',
        number: location.number || '',
        complement: location.complement || '',
        neighborhood: location.neighborhood || '',
        city: location.city || '',
        state: location.state || '',
        zip_code: location.zip_code || ''
      });
    } else {
      setLocationData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: ''
      });
    }
  }, [location]);

  // Mutation para atualizar os dados de localização
  const { mutate: updateLocation, isPending: isSaving } = useMutation({
    mutationFn: async (data: Partial<Location>) => {
      if (!companyId) throw new Error('ID da empresa não encontrado');
      
      if (location?.id) {
        // Atualiza localização existente
        const { error } = await supabase
          .from('company_locations')
          .update(data)
          .eq('id', location.id);
        
        if (error) throw error;
      } else {
        // Cria nova localização
        const { error } = await supabase
          .from('company_locations')
          .insert({
            ...data,
            company_id: companyId
          });
        
        if (error) throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-location', companyId] });
      setIsEditing(false);
      toast.success('Informações de localização atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar localização:', error);
      toast.error('Erro ao atualizar informações de localização');
    }
  });

  const handleSave = () => {
    updateLocation(locationData);
  };

  const handleCancel = () => {
    // Restaura os dados originais
    if (location) {
      setLocationData({
        street: location.street || '',
        number: location.number || '',
        complement: location.complement || '',
        neighborhood: location.neighborhood || '',
        city: location.city || '',
        state: location.state || '',
        zip_code: location.zip_code || ''
      });
    } else {
      setLocationData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: ''
      });
    }
    setIsEditing(false);
  };

  return {
    locationData,
    setLocationData,
    isEditing,
    setIsEditing,
    isSaving,
    handleSave,
    handleCancel
  };
};