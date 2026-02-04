import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
import type {
  EntityType,
  OpportunityEntityRelationship,
} from "@/types/database/entities.ts";
import { useToast } from "./use-toast";

/**
 * Relacionamentos do contato (multi-tenant: queryKey com clientId).
 */
export function useContactRelationships(contactId: string) {
  const queryClient = useQueryClient();
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);
  const { toast } = useToast();

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ["contact-relationships", clientId, contactId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client not found');

      // Tabelas fora do tipo Database gerado; usar client tipado para evitar "excessively deep"
      const { data, error } = await (supabase as any)
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
        .eq('client_id', clientId);

      if (error) throw error;

      return data as OpportunityEntityRelationship[];
    },
    enabled: !!clientId && !!contactId,
  });

  const addRelationship = useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: EntityType; entityId: string }) => {
      if (!clientId) throw new Error('Client not found');

      // AIDEV-NOTE: Sistema simplificado - inserção direta por tipo
      const insertData: Record<string, unknown> = {
        client_id: clientId,
        deal_id: contactId,
        entity_type: entityType,
      };

      if (entityType === 'company') insertData.company_id = entityId;
      else if (entityType === 'person') insertData.person_id = entityId;
      else if (entityType === 'partner') insertData.partner_id = entityId;

      const { error } = await (supabase as any)
        .from('deal_relationships')
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contact-relationships", clientId, contactId],
      });
      toast({
        title: "Relacionamento adicionado",
        description: "O relacionamento foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error adding relationship:", error);
      toast({
        title: 'Erro ao adicionar relacionamento',
        description: 'Não foi possível adicionar o relacionamento.',
        variant: 'destructive'
      });
    }
  });

  const removeRelationship = useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await (supabase as any)
        .from('deal_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contact-relationships", clientId, contactId],
      });
      toast({
        title: "Relacionamento removido",
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
