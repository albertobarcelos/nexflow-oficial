// AIDEV-NOTE: Hook para gerenciar a edição dos dados de contato da empresa

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Company } from '../types';
import { toast } from 'sonner';

/**
 * Hook para gerenciar a edição dos dados de contato da empresa
 * @param company Dados da empresa
 * @returns Estado e funções para gerenciar os dados de contato
 */
export const useCompanyContact = (company: Company | null) => {
  const [isEditing, setIsEditing] = useState(false);
  const [contactData, setContactData] = useState<Partial<Company>>({});
  const queryClient = useQueryClient();

  // Inicializa os dados de contato quando a empresa muda
  useEffect(() => {
    if (company) {
      setContactData({
        email: company.email || '',
        phone: company.phone || '',
        mobile: company.mobile || '',
        whatsapp: company.whatsapp || '',
        website: company.website || ''
      });
    }
  }, [company]);

  // Mutation para atualizar os dados de contato
  const { mutate: updateContact, isPending: isSaving } = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      if (!company?.id) throw new Error('ID da empresa não encontrado');
      
      const { error } = await supabase
        .from('web_companies')
        .update(data)
        .eq('id', company.id);
      
      if (error) throw error;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', company?.id] });
      setIsEditing(false);
      toast.success('Informações de contato atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar contato:', error);
      toast.error('Erro ao atualizar informações de contato');
    }
  });

  const handleSave = () => {
    updateContact(contactData);
  };

  const handleCancel = () => {
    // Restaura os dados originais
    if (company) {
      setContactData({
        email: company.email || '',
        phone: company.phone || '',
        mobile: company.mobile || '',
        whatsapp: company.whatsapp || '',
        website: company.website || ''
      });
    }
    setIsEditing(false);
  };

  return {
    contactData,
    setContactData,
    isEditing,
    setIsEditing,
    isSaving,
    handleSave,
    handleCancel
  };
};