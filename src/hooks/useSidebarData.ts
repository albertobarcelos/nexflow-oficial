import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Building2, Contact, Users } from "lucide-react";

const FIXED_ENTITIES = [
  {
    id: "companies",
    name: "Empresas",
    icon: Building2,
    description: "Gerencie suas empresas e seus dados"
  },
  {
    id: "people",
    name: "Pessoas",
    icon: Contact,
    description: "Gerencie seus contatos e relacionamentos"
  },
  {
    id: "partners",
    name: "Parceiros",
    icon: Users,
    description: "Gerencie seus parceiros de negócio"
  }
] as const;

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

  return {
    collaborator,
    pipelines,
    entities: FIXED_ENTITIES
  };
}
