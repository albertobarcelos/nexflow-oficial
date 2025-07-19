// AIDEV-NOTE: Hook para atualizar dados da empresa

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Company } from '../types';
import { toast } from 'sonner';

interface UpdateCompanyData {
  [key: string]: any;
}

export const useUpdateCompany = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCompanyData) => {
      const { error } = await supabase
        .from('web_companies')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      if (error) {
        console.error('Erro ao atualizar empresa:', error);
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      // Invalida as queries relacionadas à empresa
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Dados atualizados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar empresa:', error);
      toast.error('Erro ao atualizar dados. Tente novamente.');
    }
  });
};