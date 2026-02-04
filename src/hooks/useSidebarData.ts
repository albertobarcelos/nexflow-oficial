import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
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

/** Tipo mínimo do funnel/flow retornado pela sidebar (web_flows tem client_id) */
type FunnelRow = { id: string; client_id: string; name?: string; [key: string]: unknown };

export function useSidebarData() {
  const clientId = useClientStore((s) => s.currentClient?.id);

  const { data: collaborator } = useQuery({
    queryKey: ['current-collaborator', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('core_client_users')
        .select('client_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Collaborator not found');
      return data;
    },
  });

  const { data: funnels = [] } = useQuery({
    queryKey: ['funnels', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<FunnelRow[]> => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('web_flows')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;
      const list = (data ?? []) as FunnelRow[];

      // Validação dupla: apenas itens do cliente atual
      const invalid = list.filter((item) => item.client_id !== clientId);
      if (invalid.length > 0) {
        console.error('[SECURITY] Funnels/flows de outro cliente detectados:', invalid.length);
        throw new Error('Violação de segurança: dados de outro cliente detectados');
      }
      return list;
    },
  });

  return {
    collaborator,
    funnels,
    entities: FIXED_ENTITIES
  };
}
