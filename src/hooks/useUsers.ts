import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserData } from "@/lib/auth";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
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

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const collaborator = await getCurrentUserData();

        const { data: collaborators, error } = await supabase
          .from("core_client_users")
          .select(`
            id,
            first_name,
            last_name,
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
          .eq("client_id", collaborator.client_id)
          .order("first_name");

        if (error) {
          console.error("Erro ao buscar usuários:", error);
          return [];
        }



        return (collaborators || [])
          .filter((c: any) => c.is_active)
          .map((c: any) => ({
            id: c.id,
            first_name: c.first_name,
            last_name: c.last_name,
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
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return [];
      }
    },
  });
}