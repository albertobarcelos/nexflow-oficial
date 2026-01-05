import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface OrganizationUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  is_active: boolean;
  client_id?: string | null;
  company_name?: string | null;
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
        // Buscar todos os usuários com JOIN na empresa (admin pode ver todos)
        const { data: users, error } = await supabase
          .from("core_client_users")
          .select(`
            id,
            name,
            surname,
            email,
            role,
            is_active,
            client_id,
            avatar_url,
            custom_avatar_url,
            avatar_type,
            avatar_seed,
            core_clients:client_id (
              id,
              name,
              company_name
            )
          `)
          .order("name");

        if (error) {
          console.error("Erro ao buscar usuários:", error);
          return [];
        }

        return (users || []).map((user: any) => {
          const company = user.core_clients;
          return {
            id: user.id,
            name: user.name || "",
            surname: user.surname || "",
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            client_id: user.client_id,
            company_name: company?.company_name || company?.name || "Sem empresa",
            avatar_url: user.avatar_url,
            custom_avatar_url: user.custom_avatar_url,
            avatar_type: user.avatar_type,
            avatar_seed: user.avatar_seed,
          };
        });
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return [];
      }
    },
  });
}

