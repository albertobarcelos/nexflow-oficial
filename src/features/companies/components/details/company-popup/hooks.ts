// AIDEV-NOTE: Hooks personalizados para o CompanyPopup

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Location, Person, Attachment } from '../../types';

/**
 * Hook para buscar a localização da empresa
 * @param companyId ID da empresa
 * @returns Dados de localização e status da query
 */
export const useCompanyLocation = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['company-location', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar localização:', error);
        return null;
      }
      
      return data as Location;
    },
    enabled: !!companyId
  });
};

/**
 * Hook para buscar pessoas vinculadas à empresa
 * @param companyId ID da empresa
 * @returns Lista de pessoas vinculadas e status da query
 */
export const useCompanyPeople = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['company-people', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('web_company_people')
        .select(`
          web_people (*),
          role,
          is_primary
        `)
        .eq('company_id', companyId);
      
      if (error) {
        console.error('Erro ao buscar pessoas:', error);
        return [];
      }
      
      return data.map(item => ({
        ...item.web_people,
        role: item.role,
        is_primary: item.is_primary
      })) as Person[];
    },
    enabled: !!companyId
  });
};

/**
 * Hook para gerenciar as notas da empresa estilo tarefas
 * @param companyId ID da empresa
 * @returns Estado e funções para gerenciar as notas
 */
export const useCompanyNotes = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  // Query para buscar notas
  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ['company-notes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('web_company_notes')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar notas:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!companyId
  });

  // Mutation para criar nota
  const createNote = useMutation({
    mutationFn: async (noteData: {
      content: string;
      company_id: string;
      client_id: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('web_company_notes')
        .insert({
          content: noteData.content,
          company_id: noteData.company_id,
          client_id: noteData.client_id,
          created_by: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-notes', companyId] });
    }
  });

  // Mutation para atualizar nota
  const updateNote = useMutation({
    mutationFn: async ({ id, content }: {
      id: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('web_company_notes')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-notes', companyId] });
    }
  });

  // Mutation para deletar nota
  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('web_company_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-notes', companyId] });
    }
  });

  return {
    data: notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    refetch
  };
};

/**
 * Hook para buscar anexos da empresa
 * @param companyId ID da empresa
 * @returns Lista de anexos e status da query
 */
export const useCompanyAttachments = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['company-attachments', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      // Por enquanto retornamos dados mockados, mas pode ser implementado com uma tabela real
      return [
        {
          id: 1,
          name: "Contrato Social.pdf",
          size: 2621440, // 2.5 MB em bytes
          type: "application/pdf",
          created_at: "2024-01-15T10:30:00Z",
          uploaded_by: "João Silva"
        },
        {
          id: 2,
          name: "Cartão CNPJ.pdf",
          size: 1258291, // 1.2 MB em bytes
          type: "application/pdf",
          created_at: "2024-01-10T14:20:00Z",
          uploaded_by: "Maria Santos"
        }
      ] as Attachment[];
    },
    enabled: !!companyId
  });
};

/**
 * Hook para buscar negócios vinculados à empresa
 * @param companyId ID da empresa
 * @returns Lista de negócios e status da query
 */
export const useCompanyDeals = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['company-deals', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('web_deals')
        .select(`
          id,
          title,
          value,
          created_at,
          stage:web_funnel_stages(name, color),
          funnel:web_funnels(name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar negócios da empresa:', error);
        return [];
      }
      
      return data.map((deal) => ({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        stage_name: deal.stage?.name,
        stage_color: deal.stage?.color,
        funnel_name: deal.funnel?.name,
        created_at: deal.created_at
      }));
    },
    enabled: !!companyId
  });
};