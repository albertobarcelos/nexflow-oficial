import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface OrganizationUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  is_active: boolean;
  avatar_url?: string | null;
  custom_avatar_url?: string | null;
  avatar_type?: string | null;
  avatar_seed?: string | null;
}

export function useOrganizationUsers() {
  return useQuery({
    queryKey: ["organization-users"],
    queryFn: async () => {
      try {
        // Buscar todos os usuários (admin pode ver todos)
        const { data: users, error } = await supabase
          .from("core_client_users")
          .select(`
            id,
            name,
            surname,
            email,
            role,
            is_active,
            avatar_url,
            custom_avatar_url,
            avatar_type,
            avatar_seed
          `)
          .order("name");

        if (error) {
          console.error("Erro ao buscar usuários:", error);
          return [];
        }

        return (users || []).map((user: any) => ({
          id: user.id,
          name: user.name || "",
          surname: user.surname || "",
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          avatar_url: user.avatar_url,
          custom_avatar_url: user.custom_avatar_url,
          avatar_type: user.avatar_type,
          avatar_seed: user.avatar_seed,
        }));
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return [];
      }
    },
  });
}

