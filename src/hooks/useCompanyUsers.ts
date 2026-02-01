import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { OrganizationUser } from "./useOrganizationUsers";

export function useCompanyUsers(clientId?: string | null) {
  return useQuery({
    queryKey: ["company-users", clientId],
    queryFn: async (): Promise<OrganizationUser[]> => {
      if (!clientId) return [];

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
        .eq("client_id", clientId)
        .order("name");

      if (error) {
        console.error("Erro ao buscar usuários da empresa:", error);
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
    },
    enabled: !!clientId,
  });
}
