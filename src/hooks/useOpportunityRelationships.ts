import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EntityType, OpportunityEntityRelationship } from '@/types/database/entities';
import { useToast } from './use-toast';

export function useOpportunityRelationships(opportunityId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['opportunity-relationships', opportunityId],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data, error } = await supabase
        .from('opportunity_entity_relationships')
        .select(`
          id,
          entity_type,
          entity_id,
          companies:entity_id (
            id,
            name
          ),
          people:entity_id (
            id,
            name
          ),
          partners:entity_id (
            id,
            name
          )
        `)
        .eq('opportunity_id', opportunityId)
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

      const { error } = await supabase
        .from('opportunity_entity_relationships')
        .insert({
          client_id: collaborator.client_id,
          opportunity_id: opportunityId,
          entity_type: entityType,
          entity_id: entityId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunity-relationships', opportunityId]);
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
        .from('opportunity_entity_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunity-relationships', opportunityId]);
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
