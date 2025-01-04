import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomEntity } from "@/types/database/entity";

export function useSidebarData() {
  const { data: collaborator } = useQuery({
    queryKey: ['current-collaborator'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Collaborator not found');
      
      return data;
    },
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines', collaborator?.client_id],
    enabled: !!collaborator?.client_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_configs')
        .select('*')
        .eq('client_id', collaborator.client_id);

      if (error) throw error;
      return data;
    },
  });

  const { data: customEntities = [] } = useQuery({
    queryKey: ['custom-entities', collaborator?.client_id],
    enabled: !!collaborator?.client_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_entities')
        .select('*')
        .eq('client_id', collaborator.client_id)
        .order('created_at');

      if (error) throw error;
      return data as CustomEntity[];
    },
  });

  return {
    collaborator,
    pipelines,
    customEntities
  };
}