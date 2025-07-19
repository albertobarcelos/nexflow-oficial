import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CustomField } from "../types";

// AIDEV-NOTE: Sistema simplificado - campos personalizados apenas para deals
export function useCustomFields(dealId: string | null) {
  return useQuery({
    queryKey: ['custom-fields-deals', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      if (!dealId) return [];

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      // AIDEV-NOTE: Buscar campos personalizados específicos para deals
      const { data: fields, error } = await supabase
        .from('deal_custom_fields')
        .select(`
          id,
          name,
          field_type,
          description,
          is_required,
          order_index,
          options,
          validation_rules,
          client_id,
          layout_config,
          created_at,
          updated_at
        `)
        .eq('client_id', collaborator.client_id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return fields.map(field => ({
        ...field,
        field_type: field.field_type as CustomField['field_type'],
        order_index: field.order_index,
        layout_config: field.layout_config || { width: 'full' }
      }));
    }
  });
}
