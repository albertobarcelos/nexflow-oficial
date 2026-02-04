import { useQuery } from "@tanstack/react-query";
import { supabase, getCurrentClientId } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";

export interface NexflowUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  avatarType?: string | null;
  avatarSeed?: string | null;
  customAvatarUrl?: string | null;
  avatarUrl?: string | null;
}

/**
 * Usuários Nexflow do cliente atual (multi-tenant: queryKey com clientId).
 */
export function useNexflowUsers() {
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useQuery({
    queryKey: ["nexflow", "users", clientId],
    queryFn: async (): Promise<NexflowUser[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        return [];
      }

      const { data, error } = await supabase
        .from("core_client_users")
        .select(
          `
            id,
            name,
            surname,
            email,
            role,
            avatar_type,
            avatar_seed,
            custom_avatar_url,
            avatar_url,
            is_active
          `
        )
        .eq("client_id", clientId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error || !data) {
        console.error("Erro ao carregar usuários para permissões:", error);
        return [];
      }

      return data.map((user) => ({
        id: user.id,
        firstName: user.name,
        lastName: user.surname,
        email: user.email,
        role: user.role,
        avatarType: user.avatar_type,
        avatarSeed: user.avatar_seed,
        customAvatarUrl: user.custom_avatar_url,
        avatarUrl: user.avatar_url,
      }));
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}

