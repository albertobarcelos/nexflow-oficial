import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { EntityField } from "../types";

export function useCustomFields(entityId: string | null) {
  return useQuery({
    queryKey: ['custom-fields', entityId],
    enabled: !!entityId,
    queryFn: async () => {
      if (!entityId) return [];

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data: fields, error } = await supabase
        .from('entity_fields')
        .select(`
          id,
          name,
          field_type,
          description,
          is_required,
          order_index,
          options,
          validation_rules,
          entity_id,
          client_id,
          related_entity_id,
          relationship_type,
          layout_config,
          created_at,
          updated_at
        `)
        .eq('entity_id', entityId)
        .eq('client_id', collaborator.client_id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return fields.map(field => ({
        ...field,
        field_type: field.field_type as EntityField['field_type'],
        order_index: field.order_index,
        layout_config: field.layout_config || { width: 'full' }
      }));
    }
  });
}
