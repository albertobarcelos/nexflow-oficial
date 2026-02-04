import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_id: string;
  avatar_type?: string;
  avatar_seed?: string;
  custom_avatar_url?: string | null;
  avatar_url?: string | null;
}

interface CoreClientUserRow {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_id: string;
  avatar_type?: string | null;
  avatar_seed?: string | null;
  custom_avatar_url?: string | null;
  avatar_url?: string | null;
}

export function useUsers() {
  const { currentClient } = useClientStore();
  const clientId = currentClient?.id ?? null;

  return useQuery({
    queryKey: ["users", clientId],
    queryFn: async () => {
      if (!clientId) {
        throw new Error("Cliente não definido");
      }

      const { data: collaborators, error } = await supabase
        .from("core_client_users")
        .select(`
          id,
          name,
          surname,
          email,
          role,
          is_active,
          created_at,
          updated_at,
          client_id,
          avatar_type,
          avatar_seed,
          custom_avatar_url,
          avatar_url
        `)
        .eq("client_id", clientId)
        .order("name");

      if (error) {
        console.error("Erro ao buscar usuários:", error);
        throw error;
      }

      const rows = (collaborators ?? []) as CoreClientUserRow[];

      // Validação dupla: todos os itens devem pertencer ao client_id do contexto
      const invalid = rows.filter((c) => c.client_id !== clientId);
      if (invalid.length > 0) {
        console.error("[SECURITY] useUsers: dados de outro cliente detectados:", invalid.length);
        throw new Error("Violação de segurança: dados de outro cliente detectados");
      }

      return rows
        .filter((c) => c.is_active)
        .map((c) => ({
          id: c.id,
          name: c.name ?? "",
          surname: c.surname ?? "",
          email: c.email,
          role: c.role,
          is_active: c.is_active,
          created_at: c.created_at,
          updated_at: c.updated_at,
          client_id: c.client_id,
          avatar_type: c.avatar_type,
          avatar_seed: c.avatar_seed,
          custom_avatar_url: c.custom_avatar_url,
          avatar_url: c.avatar_url,
        }));
    },
    enabled: !!clientId,
    refetchOnWindowFocus: false,
  });
}
