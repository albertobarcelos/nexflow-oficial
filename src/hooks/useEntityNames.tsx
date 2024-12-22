import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEntityNames() {
  const { data: collaborator } = useQuery({
    queryKey: ['current-collaborator'],
    queryFn: async () => {
      const { data } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      return data;
    }
  });

  const { data: preferences } = useQuery({
    queryKey: ['entity-naming-preferences', collaborator?.client_id],
    enabled: !!collaborator?.client_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('entity_naming_preferences')
        .select('*')
        .eq('client_id', collaborator.client_id)
        .eq('entity_type', 'lead')
        .single();
      return data;
    }
  });

  return {
    leadSingular: preferences?.singular_name || "Lead",
    leadPlural: preferences?.plural_name || "Leads"
  };
}