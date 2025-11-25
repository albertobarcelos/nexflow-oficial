import { useQuery } from "@tanstack/react-query";
import { supabase, getCurrentClientId } from "@/lib/supabase";

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

export function useNexflowUsers() {
  return useQuery({
    queryKey: ["nexflow", "users"],
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
            first_name,
            last_name,
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
        .order("first_name", { ascending: true });

      if (error || !data) {
        console.error("Erro ao carregar usuários para permissões:", error);
        return [];
      }

      return data.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        avatarType: user.avatar_type,
        avatarSeed: user.avatar_seed,
        customAvatarUrl: user.custom_avatar_url,
        avatarUrl: user.avatar_url,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

