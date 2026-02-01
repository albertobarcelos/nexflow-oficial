import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EntityType, OpportunityEntityRelationship } from '@/types/database/entities';
import { useToast } from './use-toast';

export function useContactRelationships(contactId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['contact-relationships', contactId],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      // AIDEV-NOTE: Sistema simplificado - relacionamentos diretos com deals
      const { data, error } = await supabase
        .from('deal_relationships')
        .select(`
          id,
          entity_type,
          company_id,
          person_id,
          partner_id,
          companies:company_id (
            id,
            name
          ),
          people:person_id (
            id,
            name
          ),
          partners:partner_id (
            id,
            name
          )
        `)
        .eq('deal_id', contactId)
        .eq('client_id', collaborator.client_id);

      if (error) throw error;

      return data as OpportunityEntityRelationship[];
    }
  });

  const addRelationship = useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: EntityType; entityId: string }) => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      // AIDEV-NOTE: Sistema simplificado - inserção direta por tipo
      const insertData: any = {
        client_id: collaborator.client_id,
        deal_id: contactId,
        entity_type: entityType
      };

      // Mapear entity_id para campo específico
      if (entityType === 'company') insertData.company_id = entityId;
      else if (entityType === 'person') insertData.person_id = entityId;
      else if (entityType === 'partner') insertData.partner_id = entityId;

      const { error } = await supabase
        .from('deal_relationships')
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunity-relationships', contactId]);
      toast({
        title: 'Relacionamento adicionado',
        description: 'O relacionamento foi adicionado com sucesso.'
      });
    },
    onError: (error) => {
      console.error('Error adding relationship:', error);
      toast({
        title: 'Erro ao adicionar relacionamento',
        description: 'Não foi possível adicionar o relacionamento.',
        variant: 'destructive'
      });
    }
  });

  const removeRelationship = useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await supabase
        .from('deal_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunity-relationships', contactId]);
      toast({
        title: 'Relacionamento removido',
        description: 'O relacionamento foi removido com sucesso.'
      });
    },
    onError: (error) => {
      console.error('Error removing relationship:', error);
      toast({
        title: 'Erro ao remover relacionamento',
        description: 'Não foi possível remover o relacionamento.',
        variant: 'destructive'
      });
    }
  });

  return {
    relationships,
    isLoading,
    addRelationship,
    removeRelationship
  };
}
